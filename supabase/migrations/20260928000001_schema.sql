-- Phase 1: enums, tables, indexes, updated_at triggers.
-- RLS policies live in the next migration; the signup trigger in the one after.

-- ============================================================================
-- Enums
-- ============================================================================

create type public.user_role as enum ('student', 'admin');

create type public.project_category as enum (
  'market_research', 'competitor_analysis', 'data_cleanup',
  'data_analysis', 'lead_research', 'spreadsheet_work',
  'presentation', 'website_qa', 'social_media_analysis', 'other'
);

create type public.project_status as enum (
  'submitted',    -- business filled out intake form
  'scoping',      -- admin is clarifying scope/price with business
  'matching',     -- scoped, admin is selecting students
  'offered',      -- offers sent, waiting on responses
  'assigned',     -- a student accepted
  'in_progress',
  'delivered',    -- student submitted deliverable
  'approved',     -- business accepted the work
  'paid',         -- student has been paid
  'closed',       -- feedback + outcomes recorded
  'cancelled'
);

create type public.offer_status as enum ('pending', 'accepted', 'declined', 'expired', 'withdrawn');
create type public.assessment_status as enum ('submitted', 'passed', 'failed');
create type public.outcome_type as enum (
  'repeat_project', 'referral', 'internship_interview', 'job_interview',
  'internship_offer', 'job_offer', 'listed_on_resume', 'other'
);

-- ============================================================================
-- updated_at helper: attached to every table below.
-- ============================================================================

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- Tables
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'student',
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key references public.profiles (id) on delete cascade,
  major text,
  graduation_year int check (graduation_year between 2000 and 2100),
  bio text check (char_length(bio) <= 500),
  -- Normalized lowercase tags. Lowercasing is enforced in app code (Zod) and
  -- the matching function compares case-insensitively as a second safeguard.
  skills text[] not null default '{}',
  interested_categories public.project_category[] not null default '{}',
  hours_per_week int check (hours_per_week between 0 and 60),
  is_available boolean not null default true,
  portfolio_links text[] not null default '{}',
  resume_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  industry text,
  contact_name text not null,
  -- Unique so a repeat request from the same email reuses the business row.
  contact_email text not null unique,
  contact_phone text,
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete restrict,
  title text not null,
  raw_request text not null,
  scoped_description text,
  deliverable text,
  category public.project_category not null default 'other',
  required_skills text[] not null default '{}',
  preferred_skills text[] not null default '{}',
  estimated_hours int check (estimated_hours > 0),
  budget_cents int check (budget_cents >= 0),
  student_pay_cents int check (student_pay_cents >= 0),
  deadline date,
  is_starter boolean not null default false,
  status public.project_status not null default 'submitted',
  assigned_student_id uuid references public.students (id) on delete set null,
  -- Two UUIDs concatenated = 64 hex chars of randomness for the business's
  -- feedback link. Avoids depending on the pgcrypto extension.
  feedback_token text not null unique
    default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_status_idx on public.projects (status);
create index projects_business_idx on public.projects (business_id);
create index projects_assigned_student_idx on public.projects (assigned_student_id);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  category public.project_category not null,
  title text not null,
  instructions text not null,
  resource_path text,
  time_limit_minutes int check (time_limit_minutes > 0),
  -- e.g. [{ "criterion": "accuracy", "max": 40 }, ...]; maxes should sum to 100.
  rubric jsonb not null default '[]',
  pass_threshold int not null check (pass_threshold between 0 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  submission_path text,
  submission_url text,
  rubric_scores jsonb,
  total_score int check (total_score between 0 and 100),
  status public.assessment_status not null default 'submitted',
  grader_notes text,
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (submission_path is not null or submission_url is not null)
);

-- "One active submission per (student, assessment)": at most one ungraded
-- submission at a time. Graded ones stay as history so retakes (allowed after
-- 30 days, enforced in app code) can add a new row.
create unique index assessment_submissions_one_active_idx
  on public.assessment_submissions (student_id, assessment_id)
  where status = 'submitted';

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  status public.offer_status not null default 'pending',
  match_score int not null,
  match_breakdown jsonb not null default '[]',
  admin_note text,
  expires_at timestamptz not null default now() + interval '48 hours',
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, student_id)
);

create index offers_student_idx on public.offers (student_id);

create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  file_path text,
  url text,
  note text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (file_path is not null or url is not null)
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  -- One feedback per project; the token link can't be reused to submit twice.
  project_id uuid not null unique references public.projects (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  quality_notes text,
  would_hire_again boolean not null,
  interested_in_internship_or_job boolean not null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  direction text not null check (direction in ('business_to_us', 'us_to_student')),
  amount_cents int not null check (amount_cents > 0),
  method text not null,
  paid_at timestamptz not null default now(),
  reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.outcomes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  business_id uuid references public.businesses (id) on delete set null,
  type public.outcome_type not null,
  notes text,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index activity_log_entity_idx on public.activity_log (entity_type, entity_id);

-- ============================================================================
-- Attach updated_at trigger to every table
-- ============================================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'students', 'businesses', 'projects', 'assessments',
    'assessment_submissions', 'offers', 'deliverables', 'feedback',
    'payments', 'outcomes', 'activity_log'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;
