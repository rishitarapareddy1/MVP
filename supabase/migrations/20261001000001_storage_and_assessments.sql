-- Phase 3: storage buckets, assessment retake rules, grading log.

-- ============================================================================
-- Storage buckets (all private; files are served through short-lived signed URLs)
--
-- Files are uploaded straight from the browser to Storage (not through our
-- server), so these bucket limits and the policies below are what actually
-- enforce size, type and ownership.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('resumes', 'resumes', false, 5 * 1024 * 1024, array['application/pdf']),
  ('submissions', 'submissions', false, 10 * 1024 * 1024, array[
    'application/pdf', 'text/csv', 'text/plain', 'image/png', 'image/jpeg', 'application/zip',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]),
  ('assessment-resources', 'assessment-resources', false, 10 * 1024 * 1024, null);

-- Path convention for student files: '<student id>/<file>'. foldername()
-- splits the path, so [1] is the top folder, i.e. the owner's id.

-- resumes: students manage files in their own folder; admins read all.
create policy "students manage own resume files" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_student())
  )
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_student())
  );

create policy "admins read resumes" on storage.objects
  for select to authenticated
  using (bucket_id = 'resumes' and (select public.is_admin()));

-- submissions: students upload to and read their own folder, but can't
-- change or delete a file once submitted. Admins read all.
create policy "students upload own submission files" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_student())
  );

create policy "students read own submission files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "admins read submission files" on storage.objects
  for select to authenticated
  using (bucket_id = 'submissions' and (select public.is_admin()));

-- assessment-resources: admins manage; students download.
create policy "admins manage assessment resources" on storage.objects
  for all to authenticated
  using (bucket_id = 'assessment-resources' and (select public.is_admin()))
  with check (bucket_id = 'assessment-resources' and (select public.is_admin()));

create policy "students read assessment resources" on storage.objects
  for select to authenticated
  using (bucket_id = 'assessment-resources' and (select public.is_student()));

-- ============================================================================
-- Assessment retake rules, enforced in the database
--
-- A student may submit an assessment only if it's active, they haven't
-- passed it, they have no ungraded submission for it, and their latest
-- failed attempt was graded at least 30 days ago. The app checks the same
-- rules (lib/assessments/eligibility.ts) to show friendly messages; this
-- stops anyone from skipping them by calling the API directly.
-- ============================================================================

create function public.can_submit_assessment(p_assessment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (select 1 from public.assessments where id = p_assessment_id and is_active)
    and not exists (
      select 1 from public.assessment_submissions
      where assessment_id = p_assessment_id
        and student_id = (select auth.uid())
        and (status in ('submitted', 'passed')
             or (status = 'failed' and graded_at > now() - interval '30 days'))
    );
$$;

drop policy "students create own ungraded submissions" on public.assessment_submissions;

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
    and public.can_submit_assessment(assessment_id)
  );

-- ============================================================================
-- Log grading to activity_log (spec: "write a row whenever ... an assessment
-- is graded"). Same trigger approach as project status changes.
-- ============================================================================

create function public.log_submission_graded()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'submitted' and new.status <> 'submitted' then
    insert into public.activity_log (actor_id, entity_type, entity_id, action, metadata)
    values ((select auth.uid()), 'assessment_submission', new.id, 'graded',
            jsonb_build_object(
              'status', new.status,
              'total_score', new.total_score,
              'assessment_id', new.assessment_id,
              'student_id', new.student_id));
  end if;
  return null;
end;
$$;

create trigger log_submission_graded
  after update of status on public.assessment_submissions
  for each row execute function public.log_submission_graded();
