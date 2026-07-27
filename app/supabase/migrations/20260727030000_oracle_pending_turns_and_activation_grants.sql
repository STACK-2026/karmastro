-- Confidential pending Oracle turns and one-time post-onboarding activation grants.

create table if not exists public.oracle_pending_turns (
  id uuid primary key default gen_random_uuid(),
  session_hmac text,
  user_id uuid references auth.users(id) on delete cascade,
  conversation_id uuid references public.oracle_conversations(id) on delete set null,
  ciphertext text not null,
  iv text not null,
  key_version integer not null default 1,
  wall_type text not null check (
    wall_type in ('anonymous_signup_wall_v1', 'authenticated_interim_limit_v1')
  ),
  status text not null default 'pending' check (
    status in ('pending', 'claimed', 'delivered', 'expired', 'canceled')
  ),
  idempotency_key uuid not null,
  next_available_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  check (session_hmac is not null or user_id is not null),
  check (expires_at <= created_at + interval '72 hours')
);

create unique index if not exists oracle_pending_turns_session_active_idx
  on public.oracle_pending_turns (session_hmac)
  where session_hmac is not null and status in ('pending', 'claimed');

create unique index if not exists oracle_pending_turns_user_active_idx
  on public.oracle_pending_turns (user_id)
  where user_id is not null and status in ('pending', 'claimed');

create unique index if not exists oracle_pending_turns_idempotency_idx
  on public.oracle_pending_turns (idempotency_key);

create index if not exists oracle_pending_turns_expiry_idx
  on public.oracle_pending_turns (expires_at)
  where status in ('pending', 'claimed');

alter table public.oracle_pending_turns enable row level security;
revoke all on public.oracle_pending_turns from anon, authenticated;

create table if not exists public.oracle_activation_grants (
  id uuid primary key default gen_random_uuid(),
  pending_turn_id uuid references public.oracle_pending_turns(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (
    status in ('active', 'reserved', 'consumed', 'revoked')
  ),
  created_at timestamptz not null default now(),
  reserved_at timestamptz,
  consumed_at timestamptz,
  expires_at timestamptz not null,
  unique (pending_turn_id)
);

create index if not exists oracle_activation_grants_user_idx
  on public.oracle_activation_grants (user_id, status, expires_at);

alter table public.oracle_activation_grants enable row level security;
revoke all on public.oracle_activation_grants from anon, authenticated;

create or replace function public.claim_oracle_pending_turn(
  p_session_hmac text,
  p_user_id uuid
)
returns table(pending_turn_id uuid, claimed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_turn public.oracle_pending_turns%rowtype;
begin
  if p_user_id is null or coalesce(btrim(p_session_hmac), '') = '' then
    return;
  end if;

  -- Serialize claims for one account so two browser handoffs cannot race the
  -- partial unique index on active user pending turns.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  update public.oracle_pending_turns
  set status = 'expired', updated_at = now()
  where status in ('pending', 'claimed') and expires_at <= now();

  select *
  into v_turn
  from public.oracle_pending_turns
  where session_hmac = p_session_hmac
    and status in ('pending', 'claimed')
    and expires_at > now()
  order by created_at desc
  limit 1
  for update;

  if v_turn.id is null then
    return;
  end if;
  if v_turn.user_id is not null and v_turn.user_id <> p_user_id then
    return;
  end if;

  -- The explicit handoff wins over an older active turn for this account.
  -- Revoke its one-time grant first, then make the encrypted row inactive.
  update public.oracle_activation_grants as grants
  set status = 'revoked'
  where grants.pending_turn_id in (
    select id
    from public.oracle_pending_turns
    where user_id = p_user_id
      and id <> v_turn.id
      and status in ('pending', 'claimed')
  )
    and grants.status in ('active', 'reserved');

  update public.oracle_pending_turns
  set status = 'canceled', updated_at = now()
  where user_id = p_user_id
    and id <> v_turn.id
    and status in ('pending', 'claimed');

  update public.oracle_pending_turns
  set user_id = p_user_id, status = 'claimed', updated_at = now()
  where id = v_turn.id;

  return query select v_turn.id, true;
end;
$$;

create or replace function public.reserve_oracle_activation_grant(
  p_pending_turn_id uuid,
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grant public.oracle_activation_grants%rowtype;
begin
  select *
  into v_grant
  from public.oracle_activation_grants
  where pending_turn_id = p_pending_turn_id
    and user_id = p_user_id
    and expires_at > now()
  for update;

  if v_grant.id is null or v_grant.status in ('consumed', 'revoked') then
    return false;
  end if;
  if v_grant.status = 'reserved' and v_grant.reserved_at > now() - interval '5 minutes' then
    return false;
  end if;

  update public.oracle_activation_grants
  set status = 'reserved', reserved_at = now()
  where id = v_grant.id;
  return true;
end;
$$;

create or replace function public.release_oracle_activation_grant(
  p_pending_turn_id uuid,
  p_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  with released as (
    update public.oracle_activation_grants
    set status = 'active', reserved_at = null
    where pending_turn_id = p_pending_turn_id
      and user_id = p_user_id
      and status = 'reserved'
      and expires_at > now()
    returning id
  )
  select exists(select 1 from released);
$$;

create or replace function public.consume_oracle_activation_grant(
  p_pending_turn_id uuid,
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consumed integer;
begin
  update public.oracle_activation_grants
  set status = 'consumed', consumed_at = now()
  where pending_turn_id = p_pending_turn_id
    and user_id = p_user_id
    and status = 'reserved'
    and expires_at > now();
  get diagnostics v_consumed = row_count;

  if v_consumed = 0 then
    return false;
  end if;

  delete from public.oracle_pending_turns
  where id = p_pending_turn_id and user_id = p_user_id;
  return true;
end;
$$;

create or replace function public.purge_expired_oracle_pending_turns()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.oracle_pending_turns where expires_at <= now();
  get diagnostics v_deleted = row_count;
  update public.oracle_activation_grants
  set status = 'revoked'
  where status in ('active', 'reserved') and expires_at <= now();
  return v_deleted;
end;
$$;

revoke all on function public.claim_oracle_pending_turn(text, uuid) from public, anon, authenticated;
revoke all on function public.reserve_oracle_activation_grant(uuid, uuid) from public, anon, authenticated;
revoke all on function public.release_oracle_activation_grant(uuid, uuid) from public, anon, authenticated;
revoke all on function public.consume_oracle_activation_grant(uuid, uuid) from public, anon, authenticated;
revoke all on function public.purge_expired_oracle_pending_turns() from public, anon, authenticated;

grant execute on function public.claim_oracle_pending_turn(text, uuid) to service_role;
grant execute on function public.reserve_oracle_activation_grant(uuid, uuid) to service_role;
grant execute on function public.release_oracle_activation_grant(uuid, uuid) to service_role;
grant execute on function public.consume_oracle_activation_grant(uuid, uuid) to service_role;
grant execute on function public.purge_expired_oracle_pending_turns() to service_role;

-- Confidential pending questions must not survive their retention window.
-- Run the physical purge every day in Postgres so it does not depend on user
-- traffic or an externally authenticated HTTP call.
create extension if not exists pg_cron with schema extensions;

select cron.unschedule('purge-expired-oracle-pending-turns')
where exists (
  select 1 from cron.job where jobname = 'purge-expired-oracle-pending-turns'
);

select cron.schedule(
  'purge-expired-oracle-pending-turns',
  '17 3 * * *',
  $cron$
    select public.purge_expired_oracle_pending_turns();
  $cron$
);
