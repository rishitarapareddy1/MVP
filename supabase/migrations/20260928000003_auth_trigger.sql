-- Phase 1: create a profiles row whenever a Supabase Auth user is created.
--
-- Every new user starts as role 'student' with no `students` row. The auth
-- callback (app/(auth)/auth/callback/route.ts) then either:
--   * promotes the user to 'admin' if their email is in ADMIN_EMAILS, or
--   * creates their `students` row if their email domain is allowed, or
--   * signs them out.
-- Role decisions live in the app because ADMIN_EMAILS and
-- ALLOWED_STUDENT_EMAIL_DOMAINS are environment variables the database can't see.
-- Until a `students` row exists, is_student() is false, so an off-domain
-- account that slips through can't read anything.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(new.email),
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
