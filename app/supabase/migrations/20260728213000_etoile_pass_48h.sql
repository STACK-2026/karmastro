-- Etoile Pass 48 h
-- Service-only promotional entitlement, Oracle fair use, and profile billing hardening.

create table if not exists public.promotion_campaigns (
  code text primary key,
  issuance_enabled boolean not null default false,
  entitlement text not null check (entitlement = 'etoile_app'),
  starts_at timestamptz not null,
  offer_ends_at timestamptz,
  max_grants integer not null default 30 check (max_grants between 1 and 30),
  oracle_total_cap integer not null default 100 check (oracle_total_cap between 1 and 500),
  oracle_hourly_cap integer not null default 20 check (oracle_hourly_cap between 1 and 100),
  created_at timestamptz not null default now(),
  check (offer_ends_at is null or offer_ends_at > starts_at),
  check (not issuance_enabled or offer_ends_at is not null)
);

create table if not exists public.promotion_grants (
  id uuid primary key default gen_random_uuid(),
  campaign_code text not null references public.promotion_campaigns(code),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'offered' check (status in ('offered', 'active', 'revoked')),
  offered_at timestamptz not null default now(),
  activation_request_id uuid,
  activated_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz not null default now(),
  unique (campaign_code, user_id),
  unique (campaign_code, activation_request_id),
  check (
    (
      status = 'offered'
      and activated_at is null
      and expires_at is null
      and revoked_at is null
    )
    or (
      status = 'active'
      and activated_at is not null
      and expires_at = activated_at + interval '48 hours'
      and revoked_at is null
    )
    or (
      status = 'revoked'
      and revoked_at is not null
    )
  )
);

create table if not exists public.promotion_grant_oracle_turns (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid not null references public.promotion_grants(id) on delete cascade,
  request_id uuid not null,
  authorized_at timestamptz not null default now(),
  unique (grant_id, request_id)
);

create index if not exists promotion_grants_user_idx
  on public.promotion_grants(user_id, campaign_code);
create index if not exists promotion_grant_oracle_turns_window_idx
  on public.promotion_grant_oracle_turns(grant_id, authorized_at);

alter table public.promotion_campaigns enable row level security;
alter table public.promotion_grants enable row level security;
alter table public.promotion_grant_oracle_turns enable row level security;

revoke all on table public.promotion_campaigns from public, anon, authenticated;
revoke all on table public.promotion_grants from public, anon, authenticated;
revoke all on table public.promotion_grant_oracle_turns from public, anon, authenticated;
grant all on table public.promotion_campaigns to service_role;
grant all on table public.promotion_grants to service_role;
grant all on table public.promotion_grant_oracle_turns to service_role;

insert into public.promotion_campaigns (
  code,
  issuance_enabled,
  entitlement,
  starts_at,
  offer_ends_at,
  oracle_total_cap,
  oracle_hourly_cap
)
values (
  'etoile_pass_48h_v1',
  false,
  'etoile_app',
  now(),
  null,
  100,
  20
)
on conflict (code) do nothing;

create or replace function public.get_effective_app_access(
  p_user_id uuid,
  p_campaign_code text
)
returns table (
  access_source text,
  has_premium_access boolean,
  offer_state text,
  activated_at timestamptz,
  expires_at timestamptz,
  server_now timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := statement_timestamp();
  v_campaign public.promotion_campaigns%rowtype;
  v_grant public.promotion_grants%rowtype;
begin
  if p_user_id is null then
    return query select 'none'::text, false, 'unavailable'::text, null::timestamptz, null::timestamptz, v_now;
    return;
  end if;

  if public.has_unlimited_oracle(p_user_id) then
    return query select 'subscription'::text, true, 'unavailable'::text, null::timestamptz, null::timestamptz, v_now;
    return;
  end if;

  select *
  into v_campaign
  from public.promotion_campaigns
  where code = p_campaign_code;

  if not found then
    return query select 'none'::text, false, 'unavailable'::text, null::timestamptz, null::timestamptz, v_now;
    return;
  end if;

  select *
  into v_grant
  from public.promotion_grants
  where campaign_code = p_campaign_code
    and user_id = p_user_id;

  if not found then
    return query select
      'none'::text,
      false,
      case when v_campaign.issuance_enabled then 'unavailable' else 'disabled' end::text,
      null::timestamptz,
      null::timestamptz,
      v_now;
    return;
  end if;

  if v_grant.status = 'active' and v_grant.expires_at > v_now then
    return query select 'promo_pass'::text, true, 'active'::text, v_grant.activated_at, v_grant.expires_at, v_now;
    return;
  end if;

  if v_grant.status = 'active' and v_grant.expires_at <= v_now then
    return query select 'none'::text, false, 'expired'::text, v_grant.activated_at, v_grant.expires_at, v_now;
    return;
  end if;

  if v_grant.status = 'revoked' then
    return query select 'none'::text, false, 'revoked'::text, v_grant.activated_at, v_grant.expires_at, v_now;
    return;
  end if;

  if not v_campaign.issuance_enabled
    or v_campaign.starts_at > v_now
    or (v_campaign.offer_ends_at is not null and v_campaign.offer_ends_at <= v_now)
  then
    return query select 'none'::text, false, 'disabled'::text, null::timestamptz, null::timestamptz, v_now;
    return;
  end if;

  return query select 'none'::text, false, 'offered'::text, null::timestamptz, null::timestamptz, v_now;
end;
$$;

create or replace function public.activate_promotion_pass(
  p_user_id uuid,
  p_campaign_code text,
  p_activation_request_id uuid
)
returns table (
  access_source text,
  has_premium_access boolean,
  offer_state text,
  activated_at timestamptz,
  expires_at timestamptz,
  server_now timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := statement_timestamp();
  v_campaign public.promotion_campaigns%rowtype;
  v_grant public.promotion_grants%rowtype;
begin
  if p_user_id is null or p_activation_request_id is null then
    raise exception 'invalid_activation_request';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_campaign_code || ':' || p_user_id::text, 0));

  if public.has_unlimited_oracle(p_user_id) then
    return query select * from public.get_effective_app_access(p_user_id, p_campaign_code);
    return;
  end if;

  select *
  into v_campaign
  from public.promotion_campaigns campaign
  where campaign.code = p_campaign_code
  for update;

  if not found then
    return query select * from public.get_effective_app_access(p_user_id, p_campaign_code);
    return;
  end if;

  select *
  into v_grant
  from public.promotion_grants grant_row
  where grant_row.campaign_code = p_campaign_code
    and grant_row.user_id = p_user_id
  for update;

  if not found
    or not v_campaign.issuance_enabled
    or v_campaign.starts_at > v_now
    or (v_campaign.offer_ends_at is not null and v_campaign.offer_ends_at <= v_now)
  then
    return query select * from public.get_effective_app_access(p_user_id, p_campaign_code);
    return;
  end if;

  if v_grant.status = 'offered' then
    update public.promotion_grants
    set
      status = 'active',
      activation_request_id = p_activation_request_id,
      activated_at = v_now,
      expires_at = v_now + interval '48 hours'
    where id = v_grant.id;
  end if;

  return query select * from public.get_effective_app_access(p_user_id, p_campaign_code);
end;
$$;

create or replace function public.authorize_promotion_oracle_turn(
  p_user_id uuid,
  p_campaign_code text,
  p_request_id uuid
)
returns table (
  handled boolean,
  allowed boolean,
  replayed boolean,
  reason text,
  access_source text,
  expires_at timestamptz,
  retry_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := statement_timestamp();
  v_grant_id uuid;
  v_expires_at timestamptz;
  v_hourly_cap integer;
  v_total_cap integer;
  v_hourly_count integer;
  v_total_count integer;
  v_retry_at timestamptz;
begin
  if p_user_id is null or p_request_id is null then
    raise exception 'invalid_oracle_authorization_request';
  end if;

  if public.has_unlimited_oracle(p_user_id) then
    return query select false, true, false, 'paid_subscription'::text, 'subscription'::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  select grant_row.id, grant_row.expires_at, campaign.oracle_hourly_cap, campaign.oracle_total_cap
  into v_grant_id, v_expires_at, v_hourly_cap, v_total_cap
  from public.promotion_grants grant_row
  join public.promotion_campaigns campaign on campaign.code = grant_row.campaign_code
  where grant_row.campaign_code = p_campaign_code
    and grant_row.user_id = p_user_id
    and grant_row.status = 'active'
  for update of grant_row;

  if not found or v_expires_at <= v_now then
    return query select false, false, false, 'no_active_pass'::text, 'none'::text, v_expires_at, null::timestamptz;
    return;
  end if;

  if exists (
    select 1
    from public.promotion_grant_oracle_turns turn_row
    where turn_row.grant_id = v_grant_id
      and turn_row.request_id = p_request_id
  ) then
    return query select true, true, true, 'promo_allowed'::text, 'promo_pass'::text, v_expires_at, null::timestamptz;
    return;
  end if;

  select count(*)::integer
  into v_hourly_count
  from public.promotion_grant_oracle_turns turn_row
  where turn_row.grant_id = v_grant_id
    and turn_row.authorized_at > v_now - interval '1 hour';

  if v_hourly_count >= v_hourly_cap then
    select min(turn_row.authorized_at) + interval '1 hour'
    into v_retry_at
    from public.promotion_grant_oracle_turns turn_row
    where turn_row.grant_id = v_grant_id
      and turn_row.authorized_at > v_now - interval '1 hour';
    return query select true, false, false, 'promo_hourly_cap'::text, 'promo_pass'::text, v_expires_at, v_retry_at;
    return;
  end if;

  select count(*)::integer
  into v_total_count
  from public.promotion_grant_oracle_turns turn_row
  where turn_row.grant_id = v_grant_id;

  if v_total_count >= v_total_cap then
    return query select true, false, false, 'promo_total_cap'::text, 'promo_pass'::text, v_expires_at, v_expires_at;
    return;
  end if;

  insert into public.promotion_grant_oracle_turns (grant_id, request_id, authorized_at)
  values (v_grant_id, p_request_id, v_now);

  return query select true, true, false, 'promo_allowed'::text, 'promo_pass'::text, v_expires_at, null::timestamptz;
end;
$$;

revoke all on function public.get_effective_app_access(uuid, text) from public, anon, authenticated;
revoke all on function public.activate_promotion_pass(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.authorize_promotion_oracle_turn(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.get_effective_app_access(uuid, text) to service_role;
grant execute on function public.activate_promotion_pass(uuid, text, uuid) to service_role;
grant execute on function public.authorize_promotion_oracle_turn(uuid, text, uuid) to service_role;

create or replace function public.assign_promotion_offers(
  p_campaign_code text,
  p_user_ids uuid[]
)
returns table (
  requested_count integer,
  assigned_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requested integer := cardinality(p_user_ids);
  v_assigned integer := 0;
  v_existing integer := 0;
  v_eligible integer := 0;
  v_campaign public.promotion_campaigns%rowtype;
begin
  if p_campaign_code is null or v_requested is null or v_requested < 1 or v_requested > 30 then
    raise exception 'invalid_promotion_cohort';
  end if;

  select *
  into v_campaign
  from public.promotion_campaigns
  where code = p_campaign_code
  for update;

  if not found then
    raise exception 'promotion_campaign_not_found';
  end if;
  if v_campaign.issuance_enabled then
    raise exception 'promotion_campaign_must_be_disabled_during_assignment';
  end if;

  select count(*)::integer
  into v_existing
  from public.promotion_grants
  where campaign_code = p_campaign_code;

  select count(*)::integer
  into v_eligible
  from (
    select distinct unnest(p_user_ids) as user_id
  ) cohort
  join auth.users auth_user on auth_user.id = cohort.user_id
  where not public.has_unlimited_oracle(cohort.user_id)
    and not exists (
      select 1
      from public.promotion_grants existing_grant
      where existing_grant.campaign_code = p_campaign_code
        and existing_grant.user_id = cohort.user_id
    );

  if v_existing + v_eligible > v_campaign.max_grants then
    raise exception 'promotion_campaign_grant_cap_exceeded';
  end if;

  insert into public.promotion_grants (campaign_code, user_id, status)
  select p_campaign_code, cohort.user_id, 'offered'
  from (
    select distinct unnest(p_user_ids) as user_id
  ) cohort
  join auth.users auth_user on auth_user.id = cohort.user_id
  where not public.has_unlimited_oracle(cohort.user_id)
  on conflict (campaign_code, user_id) do nothing;

  get diagnostics v_assigned = row_count;
  return query select v_requested, v_assigned;
end;
$$;

create or replace function public.purge_expired_promotion_turns()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.promotion_grant_oracle_turns turn_row
  using public.promotion_grants grant_row
  where turn_row.grant_id = grant_row.id
    and grant_row.expires_at < statement_timestamp() - interval '30 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.assign_promotion_offers(text, uuid[]) from public, anon, authenticated;
revoke all on function public.purge_expired_promotion_turns() from public, anon, authenticated;
grant execute on function public.assign_promotion_offers(text, uuid[]) to service_role;
grant execute on function public.purge_expired_promotion_turns() to service_role;

do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
  from cron.job
  where jobname = 'karmastro-promotion-turn-retention'
  limit 1;
  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
  perform cron.schedule(
    'karmastro-promotion-turn-retention',
    '17 3 * * *',
    'select public.purge_expired_promotion_turns()'
  );
end;
$$;

-- Client roles must not be able to choose another user id in security-definer
-- billing helpers. Edge functions remain the sole callers through service_role.
revoke execute on function public.has_unlimited_oracle(uuid) from public, anon, authenticated;
revoke execute on function public.increment_oracle_usage(uuid, text) from public, anon, authenticated;
revoke execute on function public.consume_credit(uuid, text) from public, anon, authenticated;
grant execute on function public.has_unlimited_oracle(uuid) to service_role;
grant execute on function public.increment_oracle_usage(uuid, text) to service_role;
grant execute on function public.consume_credit(uuid, text) to service_role;

create or replace function public.protect_profile_reserved_columns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_new jsonb := to_jsonb(new);
  v_old jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  v_column text;
  v_null_only text[] := array[
    'subscription_status',
    'subscription_period_end',
    'stripe_customer_id',
    'stripe_subscription_id',
    'referral_code',
    'referred_by_user_id',
    'apple_subscription_status',
    'apple_subscription_product_id',
    'apple_subscription_expires_at',
    'apple_subscription_synced_at'
  ];
  v_immutable text[] := array[
    'user_id',
    'id',
    'created_at',
    'subscription_tier',
    'subscription_status',
    'subscription_period_end',
    'stripe_customer_id',
    'stripe_subscription_id',
    'credits',
    'is_admin',
    'badges',
    'referral_code',
    'referred_by_user_id',
    'apple_subscription_status',
    'apple_subscription_product_id',
    'apple_subscription_expires_at',
    'apple_subscription_synced_at'
  ];
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if coalesce(v_new ->> 'subscription_tier', 'eveil') <> 'eveil' then
      raise exception 'profile_reserved_column:subscription_tier';
    end if;
    if coalesce((v_new ->> 'credits')::integer, 0) <> 0 then
      raise exception 'profile_reserved_column:credits';
    end if;
    if coalesce((v_new ->> 'is_admin')::boolean, false) then
      raise exception 'profile_reserved_column:is_admin';
    end if;
    if v_new ? 'badges'
      and v_new -> 'badges' is distinct from 'null'::jsonb
      and v_new -> 'badges' is distinct from '[]'::jsonb
    then
      raise exception 'profile_reserved_column:badges';
    end if;
    foreach v_column in array v_null_only loop
      if v_new ? v_column and v_new -> v_column is distinct from 'null'::jsonb then
        raise exception 'profile_reserved_column:%', v_column;
      end if;
    end loop;
    return new;
  end if;

  foreach v_column in array v_immutable loop
    if v_new -> v_column is distinct from v_old -> v_column then
      raise exception 'profile_reserved_column:%', v_column;
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists profiles_protect_reserved_columns on public.profiles;
create trigger profiles_protect_reserved_columns
before insert or update on public.profiles
for each row execute function public.protect_profile_reserved_columns();

-- Replace the historical full-row public profile lookup with a bounded exact
-- lookup. This avoids allowing clients to enumerate the whole referral list.
drop policy if exists "Public can lookup referral codes" on public.profiles;
do $$
begin
  if to_regclass('public.referral_lookup') is not null then
    execute 'revoke all on table public.referral_lookup from public, anon, authenticated';
  end if;
end;
$$;

create or replace function public.lookup_referral_code(p_code text)
returns table (first_name text)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if p_code is null or upper(trim(p_code)) !~ '^[A-Z0-9]{6}$' then
    return;
  end if;
  return query
  select profile.first_name
  from public.profiles profile
  where profile.referral_code = upper(trim(p_code))
  limit 1;
end;
$$;

revoke all on function public.lookup_referral_code(text) from public;
grant execute on function public.lookup_referral_code(text) to anon, authenticated;
