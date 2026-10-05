-- Verify a university email for students who log in with another address
-- (e.g. Gmail). Students who log in with a university address count as
-- verified already; this is only for everyone else.

alter table public.students
  add column university_email text,
  add column university_email_verified_at timestamptz;

-- One university address can verify only one account.
create unique index students_verified_university_email_idx
  on public.students (lower(university_email))
  where university_email_verified_at is not null;

-- Students must not be able to mark themselves verified. Extend the existing
-- column-protection trigger (same rules: only logged-in non-admins are blocked).
create or replace function public.protect_student_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    if new.is_active is distinct from old.is_active
       or new.id is distinct from old.id
       or new.university_email is distinct from old.university_email
       or new.university_email_verified_at is distinct from old.university_email_verified_at then
      raise exception 'Not allowed to change is_active, id or university email verification';
    end if;
  end if;
  return new;
end;
$$;

-- Pending verification codes. Only our server (service role) touches this
-- table: RLS is on and there are no policies, so browsers can't read codes.
-- Codes are stored as hashes, never in plain text.
create table public.email_verification_codes (
  student_id uuid primary key references public.students (id) on delete cascade,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  -- Rate limiting: last send time, and sends within the current hour window.
  last_sent_at timestamptz not null default now(),
  window_started_at timestamptz not null default now(),
  sends_in_window int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.email_verification_codes enable row level security;
revoke all on public.email_verification_codes from anon, authenticated;

create trigger set_updated_at before update on public.email_verification_codes
  for each row execute function public.set_updated_at();
