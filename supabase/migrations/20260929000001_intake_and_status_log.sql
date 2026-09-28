-- Phase 2: intake budget range + automatic project status logging.

-- The intake form asks for a rough budget range. It's the business's own
-- estimate, kept separate from budget_cents (the price the admin sets while
-- scoping).
alter table public.projects
  add column budget_range text
  check (budget_range in ('under_100', '100_250', '250_500', '500_plus'));

-- Log every project creation and status change to activity_log.
-- Doing this in a trigger (instead of app code) means no code path can
-- forget it, including the offer-acceptance function coming in Phase 4.
-- actor_id is the logged-in user, or null for service-role writes such as
-- the public intake form.
create function public.log_project_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_log (actor_id, entity_type, entity_id, action, metadata)
    values ((select auth.uid()), 'project', new.id, 'created',
            jsonb_build_object('status', new.status));
  elsif new.status is distinct from old.status then
    insert into public.activity_log (actor_id, entity_type, entity_id, action, metadata)
    values ((select auth.uid()), 'project', new.id, 'status_changed',
            jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  return null;
end;
$$;

create trigger log_project_status_change
  after insert or update of status on public.projects
  for each row execute function public.log_project_status_change();
