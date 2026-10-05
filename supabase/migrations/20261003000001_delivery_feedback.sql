-- Phase 5: delivery, feedback, follow-ups.

-- ============================================================================
-- Deliverables storage. Path convention: '<student id>/<project id>/<file>'.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('deliverables', 'deliverables', false, 25 * 1024 * 1024, null);

-- True if the current user is assigned to the project whose id is this
-- folder name. Takes text so a malformed folder just returns false instead
-- of erroring on a uuid cast.
create function public.is_assigned_project_folder(p_folder text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.projects
    where id::text = p_folder
      and assigned_student_id = (select auth.uid())
      and status in ('assigned', 'in_progress')
  );
$$;

create policy "students upload deliverable files" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'deliverables'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_assigned_project_folder((storage.foldername(name))[2])
  );

create policy "students read own deliverable files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'deliverables'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "admins read deliverable files" on storage.objects
  for select to authenticated
  using (bucket_id = 'deliverables' and (select public.is_admin()));

-- Deliverables are now created only through submit_deliverable() below,
-- which also moves the project to 'delivered' in the same transaction.
drop policy "students submit deliverables for assigned projects" on public.deliverables;

-- ============================================================================
-- start_project: assigned student marks work as started.
-- Returns: started | wrong_status | not_found
-- ============================================================================

create function public.start_project(p_project_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.project_status;
  v_assigned uuid;
begin
  select status, assigned_student_id into v_status, v_assigned
  from public.projects where id = p_project_id for update;
  if not found or v_assigned is distinct from (select auth.uid()) then
    return 'not_found';
  end if;
  if v_status <> 'assigned' then
    return 'wrong_status';
  end if;

  update public.projects set status = 'in_progress' where id = p_project_id;
  return 'started';
end;
$$;

-- ============================================================================
-- submit_deliverable: record the work and mark the project delivered.
-- Returns: delivered | wrong_status | missing | bad_path | bad_url | not_found
-- ============================================================================

create function public.submit_deliverable(
  p_project_id uuid,
  p_file_path text,
  p_url text,
  p_note text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.project_status;
  v_assigned uuid;
  v_uid uuid := (select auth.uid());
begin
  select status, assigned_student_id into v_status, v_assigned
  from public.projects where id = p_project_id for update;
  if not found or v_assigned is distinct from v_uid then
    return 'not_found';
  end if;
  -- Must be started first; after a rework request the admin moves it back
  -- to in_progress, so a second deliverable can be submitted.
  if v_status <> 'in_progress' then
    return 'wrong_status';
  end if;
  if p_file_path is null and p_url is null then
    return 'missing';
  end if;
  -- Files must live in this student's folder for this project.
  if p_file_path is not null
     and p_file_path not like v_uid::text || '/' || p_project_id::text || '/%' then
    return 'bad_path';
  end if;
  -- Links are shown to the admin as clickable links: http(s) only.
  if p_url is not null and p_url !~* '^https?://' then
    return 'bad_url';
  end if;

  insert into public.deliverables (project_id, student_id, file_path, url, note)
  values (p_project_id, v_uid, p_file_path, p_url, left(p_note, 2000));
  update public.projects set status = 'delivered' where id = p_project_id;
  return 'delivered';
end;
$$;

-- ============================================================================
-- submit_feedback: the business's feedback link (no login).
-- Called by our server with the service role key after validating input.
-- Returns: submitted | not_ready | already_submitted | not_found
-- ============================================================================

create function public.submit_feedback(
  p_token text,
  p_rating integer,
  p_quality_notes text,
  p_would_hire_again boolean,
  p_interested boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project_id uuid;
  v_status public.project_status;
begin
  select id, status into v_project_id, v_status
  from public.projects where feedback_token = p_token for update;
  if not found then
    return 'not_found';
  end if;
  if v_status = 'closed' or exists (select 1 from public.feedback where project_id = v_project_id) then
    return 'already_submitted';
  end if;
  -- Spec flow: work approved, both payments recorded (paid), then feedback.
  if v_status <> 'paid' then
    return 'not_ready';
  end if;

  insert into public.feedback
    (project_id, rating, quality_notes, would_hire_again, interested_in_internship_or_job)
  values (v_project_id, p_rating, left(p_quality_notes, 2000), p_would_hire_again, p_interested);
  update public.projects set status = 'closed' where id = v_project_id;
  return 'submitted';
end;
$$;

-- ============================================================================
-- Hiring-interest follow-ups: lets the admin clear the dashboard flag.
-- ============================================================================

alter table public.feedback add column followed_up_at timestamptz;

-- ============================================================================
-- Who may call what
-- ============================================================================

revoke execute on function public.start_project(uuid) from public, anon;
revoke execute on function public.submit_deliverable(uuid, text, text, text) from public, anon;
grant execute on function public.start_project(uuid) to authenticated;
grant execute on function public.submit_deliverable(uuid, text, text, text) to authenticated;

-- Feedback goes only through our server (service role), never straight
-- from a browser, so the form's validation and honeypot can't be skipped.
revoke execute on function public.submit_feedback(text, integer, text, boolean, boolean)
  from public, anon, authenticated;
grant execute on function public.submit_feedback(text, integer, text, boolean, boolean)
  to service_role;
