-- Phase 1: Row Level Security.
--
-- Model:
--   * anon (not logged in): no table access at all. The public intake and
--     feedback forms write through server actions using the service role key,
--     which bypasses RLS.
--   * students: only their own rows. They never touch `projects` directly;
--     they read the `student_projects` view, which omits budget, business and
--     token columns.
--   * admins (profiles.role = 'admin'): everything.
--
-- `(select auth.uid())` instead of bare `auth.uid()` lets Postgres evaluate it
-- once per query instead of once per row (Supabase performance advice).

-- ============================================================================
-- Helper functions
-- ============================================================================

-- SECURITY DEFINER so these can read `profiles`/`students` without being
-- blocked by those tables' own policies (which would otherwise recurse).
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create function public.is_student()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.students s
    join public.profiles p on p.id = s.id
    where s.id = (select auth.uid()) and p.role = 'student'
  );
$$;

-- True if the current user is assigned to this project and it is still open
-- for delivery. SECURITY DEFINER because students can't read `projects`
-- directly, so a plain subquery inside a policy would always see nothing.
create function public.can_submit_deliverable(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.projects
    where id = p_project_id
      and assigned_student_id = (select auth.uid())
      and status in ('assigned', 'in_progress', 'delivered')
  );
$$;

-- ============================================================================
-- Enable RLS on every table
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.businesses enable row level security;
alter table public.projects enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_submissions enable row level security;
alter table public.offers enable row level security;
alter table public.deliverables enable row level security;
alter table public.feedback enable row level security;
alter table public.payments enable row level security;
alter table public.outcomes enable row level security;
alter table public.activity_log enable row level security;

-- ============================================================================
-- Admin: full access to every table
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
      'create policy "admins have full access" on public.%I
         for all to authenticated
         using ((select public.is_admin()))
         with check ((select public.is_admin()))', t);
  end loop;
end;
$$;

-- businesses, payments, feedback, outcomes, activity_log: admin only.
-- (No further policies = no access for anyone else.)

-- ============================================================================
-- profiles
-- ============================================================================

create policy "users read own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "users update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ============================================================================
-- students
-- ============================================================================

create policy "students read own row" on public.students
  for select to authenticated
  using (id = (select auth.uid()));

create policy "students update own row" on public.students
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Student rows are created by the auth callback (service role) after the
-- email domain is checked, so there is no student insert policy.

-- ============================================================================
-- Column protection
-- RLS works on whole rows, so it can't stop a student from editing their own
-- `role` or `is_active`. These triggers do. They only apply to logged-in
-- non-admins; the service role and migrations (auth.uid() is null) pass.
-- ============================================================================

create function public.protect_profile_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    if new.role is distinct from old.role
       or new.email is distinct from old.email
       or new.id is distinct from old.id then
      raise exception 'Not allowed to change role, email or id';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

create function public.protect_student_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    if new.is_active is distinct from old.is_active
       or new.id is distinct from old.id then
      raise exception 'Not allowed to change is_active or id';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_student_columns
  before update on public.students
  for each row execute function public.protect_student_columns();

-- ============================================================================
-- assessments: students see active templates only
-- ============================================================================

create policy "students read active assessments" on public.assessments
  for select to authenticated
  using (is_active and (select public.is_student()));

-- ============================================================================
-- assessment_submissions: students read their own and submit new ones,
-- but can never set scores or grade themselves.
-- ============================================================================

create policy "students read own submissions" on public.assessment_submissions
  for select to authenticated
  using (student_id = (select auth.uid()));

create policy "students create own ungraded submissions" on public.assessment_submissions
  for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and (select public.is_student())
    and status = 'submitted'
    and rubric_scores is null
    and total_score is null
    and grader_notes is null
    and graded_at is null
  );

-- ============================================================================
-- offers: students read their own. Accept/decline goes through a
-- SECURITY DEFINER function (Phase 4) so acceptance can lock the project row.
-- ============================================================================

create policy "students read own offers" on public.offers
  for select to authenticated
  using (student_id = (select auth.uid()));

-- ============================================================================
-- deliverables: students read their own and submit for projects assigned to them
-- ============================================================================

create policy "students read own deliverables" on public.deliverables
  for select to authenticated
  using (student_id = (select auth.uid()));

create policy "students submit deliverables for assigned projects" on public.deliverables
  for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and public.can_submit_deliverable(project_id)
  );

-- ============================================================================
-- student_projects view
--
-- Students have no policy on `projects`, so they can't read it directly. This
-- view exposes only student-safe columns (no budget_cents, business_id,
-- raw_request or feedback_token) for projects the student was offered or is
-- assigned to.
--
-- It deliberately runs with the view owner's rights (security_invoker = false)
-- so it can read `projects` past RLS; the WHERE clause does the filtering.
-- ============================================================================

create view public.student_projects
with (security_invoker = false)
as
select
  p.id,
  p.title,
  p.scoped_description,
  p.deliverable,
  p.category,
  p.required_skills,
  p.preferred_skills,
  p.estimated_hours,
  p.student_pay_cents,
  p.deadline,
  p.is_starter,
  p.status,
  p.assigned_student_id
from public.projects p
where p.assigned_student_id = (select auth.uid())
   or exists (
     select 1 from public.offers o
     where o.project_id = p.id and o.student_id = (select auth.uid())
   );

revoke all on public.student_projects from anon, public;
grant select on public.student_projects to authenticated;
