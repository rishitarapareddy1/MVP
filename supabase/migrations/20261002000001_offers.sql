-- Phase 4: offer lifecycle as Postgres functions.
--
-- Why functions instead of app code: accepting an offer has to be atomic.
-- Each function locks the project row (SELECT ... FOR UPDATE), so if two
-- students click Accept at the same moment, the second one waits until the
-- first finishes and then sees the project is already filled.
--
-- These mirror the rules in lib/projects/transitions.ts:
--   matching -> offered   send_offers
--   offered  -> assigned  accept_offer
--   offered  -> matching  decline_offer / expire_stale_offers (no pending left)

-- ============================================================================
-- expire_stale_offers: run on page load (no cron in the MVP)
-- ============================================================================

create function public.expire_stale_offers()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  with expired as (
    update public.offers
    set status = 'expired'
    where status = 'pending' and expires_at <= now()
    returning id, project_id, student_id
  )
  insert into public.activity_log (actor_id, entity_type, entity_id, action, metadata)
  select null, 'project', project_id, 'offer_expired',
         jsonb_build_object('offer_id', id, 'student_id', student_id)
  from expired;
  get diagnostics v_count = row_count;

  -- A project whose offers have all been answered or expired, none
  -- accepted, goes back to matching for another round.
  if v_count > 0 then
    update public.projects p
    set status = 'matching'
    where p.status = 'offered'
      and not exists (
        select 1 from public.offers o where o.project_id = p.id and o.status = 'pending'
      );
  end if;

  return v_count;
end;
$$;

-- ============================================================================
-- send_offers: admin sends up to 3 offers for a project in 'matching'
-- ============================================================================

-- SECURITY INVOKER (the default): runs as the admin, so RLS still applies.
create function public.send_offers(p_project_id uuid, p_offers jsonb)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_status public.project_status;
  v_pending integer;
  v_new integer := jsonb_array_length(p_offers);
begin
  if not public.is_admin() then
    raise exception 'Only admins can send offers';
  end if;

  select status into v_status from public.projects where id = p_project_id for update;
  if not found then
    raise exception 'Project not found';
  end if;
  if v_status <> 'matching' then
    raise exception 'Offers can only be sent while a project is in matching';
  end if;

  perform public.expire_stale_offers();
  select count(*) into v_pending
  from public.offers where project_id = p_project_id and status = 'pending';

  if v_new < 1 then
    raise exception 'Pick at least one student';
  end if;
  if v_pending + v_new > 3 then
    raise exception 'At most 3 offers can be out at once';
  end if;

  insert into public.offers (project_id, student_id, match_score, match_breakdown, admin_note)
  select p_project_id, x.student_id, x.match_score, x.match_breakdown, x.admin_note
  from jsonb_to_recordset(p_offers)
    as x(student_id uuid, match_score integer, match_breakdown jsonb, admin_note text);

  update public.projects set status = 'offered' where id = p_project_id;

  insert into public.activity_log (actor_id, entity_type, entity_id, action, metadata)
  values ((select auth.uid()), 'project', p_project_id, 'offers_sent',
          jsonb_build_object('student_count', v_new));

  return v_new;
end;
$$;

-- ============================================================================
-- accept_offer: first student to accept wins
--
-- Returns a short code the app turns into a message:
--   accepted | filled | expired | not_pending | too_many_projects | not_found
-- ============================================================================

create function public.accept_offer(p_offer_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project_id uuid;
  v_student_id uuid;
  v_offer_status public.offer_status;
  v_project_status public.project_status;
  v_active integer;
begin
  select project_id, student_id into v_project_id, v_student_id
  from public.offers where id = p_offer_id;
  if not found or v_student_id <> (select auth.uid()) then
    return 'not_found';
  end if;

  -- The lock. Concurrent accepts for this project queue up here.
  select status into v_project_status from public.projects where id = v_project_id for update;

  perform public.expire_stale_offers();

  -- Re-read after the lock: the winner may have withdrawn this offer.
  select status into v_offer_status from public.offers where id = p_offer_id;
  if v_offer_status = 'withdrawn' or (v_offer_status = 'pending' and v_project_status <> 'offered') then
    return 'filled';
  end if;
  if v_offer_status = 'expired' then
    return 'expired';
  end if;
  if v_offer_status <> 'pending' then
    return 'not_pending';
  end if;

  -- Same hard filter as matching: at most 2 active projects per student.
  select count(*) into v_active from public.projects
  where assigned_student_id = v_student_id and status in ('assigned', 'in_progress');
  if v_active >= 2 then
    return 'too_many_projects';
  end if;

  update public.offers set status = 'accepted', responded_at = now() where id = p_offer_id;
  update public.offers set status = 'withdrawn'
  where project_id = v_project_id and status = 'pending' and id <> p_offer_id;
  update public.projects
  set status = 'assigned', assigned_student_id = v_student_id
  where id = v_project_id;

  insert into public.activity_log (actor_id, entity_type, entity_id, action, metadata)
  values (v_student_id, 'project', v_project_id, 'offer_accepted',
          jsonb_build_object('offer_id', p_offer_id, 'student_id', v_student_id));

  return 'accepted';
end;
$$;

-- ============================================================================
-- decline_offer
-- Returns: declined | not_pending | not_found
-- ============================================================================

create function public.decline_offer(p_offer_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project_id uuid;
  v_student_id uuid;
  v_offer_status public.offer_status;
begin
  select project_id, student_id into v_project_id, v_student_id
  from public.offers where id = p_offer_id;
  if not found or v_student_id <> (select auth.uid()) then
    return 'not_found';
  end if;

  perform 1 from public.projects where id = v_project_id for update;

  select status into v_offer_status from public.offers where id = p_offer_id;
  if v_offer_status <> 'pending' then
    return 'not_pending';
  end if;

  update public.offers set status = 'declined', responded_at = now() where id = p_offer_id;

  insert into public.activity_log (actor_id, entity_type, entity_id, action, metadata)
  values (v_student_id, 'project', v_project_id, 'offer_declined',
          jsonb_build_object('offer_id', p_offer_id, 'student_id', v_student_id));

  -- Last pending offer declined -> back to matching.
  update public.projects p
  set status = 'matching'
  where p.id = v_project_id
    and p.status = 'offered'
    and not exists (
      select 1 from public.offers o where o.project_id = p.id and o.status = 'pending'
    );

  return 'declined';
end;
$$;

-- ============================================================================
-- Cancelling a project withdraws its pending offers, so nobody can accept
-- a cancelled project.
-- ============================================================================

create function public.withdraw_offers_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    update public.offers set status = 'withdrawn'
    where project_id = new.id and status = 'pending';
  end if;
  return null;
end;
$$;

create trigger withdraw_offers_on_cancel
  after update of status on public.projects
  for each row execute function public.withdraw_offers_on_cancel();

-- ============================================================================
-- Who may call these. Supabase grants EXECUTE to anon by default; only
-- logged-in users should reach them (each function checks the caller).
-- ============================================================================

revoke execute on function public.expire_stale_offers() from public, anon;
revoke execute on function public.send_offers(uuid, jsonb) from public, anon;
revoke execute on function public.accept_offer(uuid) from public, anon;
revoke execute on function public.decline_offer(uuid) from public, anon;
grant execute on function public.expire_stale_offers() to authenticated;
grant execute on function public.send_offers(uuid, jsonb) to authenticated;
grant execute on function public.accept_offer(uuid) to authenticated;
grant execute on function public.decline_offer(uuid) to authenticated;
