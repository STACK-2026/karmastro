\set ON_ERROR_STOP on
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(8);

insert into auth.users (
  id, email, aud, role, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) values
  ('00000000-0000-4000-8000-000000000001', 'pass-free@example.test', 'authenticated', 'authenticated', now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000002', 'pass-paid@example.test', 'authenticated', 'authenticated', now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000003', 'pass-apple@example.test', 'authenticated', 'authenticated', now(), now(), '{}'::jsonb, '{}'::jsonb);

update public.profiles
set subscription_tier = 'etoile', subscription_status = 'active'
where user_id = '00000000-0000-4000-8000-000000000002';

insert into public.billing_entitlements (
  user_id, provider, entitlement_id, status, expires_at
) values (
  '00000000-0000-4000-8000-000000000003',
  'apple',
  'etoile',
  'active',
  now() + interval '1 month'
);

do $$
declare
  v_requested integer;
  v_assigned integer;
begin
  select requested_count, assigned_count
  into v_requested, v_assigned
  from public.assign_promotion_offers(
    'etoile_pass_48h_v1',
    array[
      '00000000-0000-4000-8000-000000000001'::uuid,
      '00000000-0000-4000-8000-000000000002'::uuid,
      '00000000-0000-4000-8000-000000000003'::uuid
    ]
  );
  if v_requested <> 3 or v_assigned <> 1 then
    raise exception 'cohort_assignment_failed requested=% assigned=%', v_requested, v_assigned;
  end if;
end;
$$;
select pass('assigns only the eligible free account from a bounded cohort');

insert into auth.users (
  id, email, aud, role, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
select
  ('10000000-0000-4000-8000-' || lpad(value::text, 12, '0'))::uuid,
  'pass-cap-' || value || '@example.test',
  'authenticated',
  'authenticated',
  now(),
  now(),
  '{}'::jsonb,
  '{}'::jsonb
from generate_series(1, 30) value;

select throws_ok(
  $$
    select *
    from public.assign_promotion_offers(
      'etoile_pass_48h_v1',
      array(
        select (
          '10000000-0000-4000-8000-' || lpad(value::text, 12, '0')
        )::uuid
        from generate_series(1, 30) value
      )
    )
  $$,
  'P0001',
  'promotion_campaign_grant_cap_exceeded',
  'enforces the 30 grant cap across repeated assignment calls'
);

update public.promotion_campaigns
set issuance_enabled = true, offer_ends_at = now() + interval '1 day'
where code = 'etoile_pass_48h_v1';

do $$
declare
  v_state text;
  v_activated_at timestamptz;
  v_expires_at timestamptz;
begin
  select offer_state into v_state
  from public.get_effective_app_access(
    '00000000-0000-4000-8000-000000000001',
    'etoile_pass_48h_v1'
  );
  if v_state <> 'offered' then
    raise exception 'expected offered, got %', v_state;
  end if;

  select offer_state, activated_at, expires_at
  into v_state, v_activated_at, v_expires_at
  from public.activate_promotion_pass(
    '00000000-0000-4000-8000-000000000001',
    'etoile_pass_48h_v1',
    '10000000-0000-4000-8000-000000000001'
  );
  if v_state <> 'active' or v_expires_at <> v_activated_at + interval '48 hours' then
    raise exception 'activation_window_failed state=%', v_state;
  end if;
end;
$$;
select pass('activates once with an exact 48 hour window');

do $$
declare
  v_first_request uuid := gen_random_uuid();
  v_result record;
  v_count integer;
begin
  select * into v_result
  from public.authorize_promotion_oracle_turn(
    '00000000-0000-4000-8000-000000000001',
    'etoile_pass_48h_v1',
    v_first_request
  );
  if not v_result.allowed or v_result.replayed then
    raise exception 'first_authorization_failed';
  end if;

  select * into v_result
  from public.authorize_promotion_oracle_turn(
    '00000000-0000-4000-8000-000000000001',
    'etoile_pass_48h_v1',
    v_first_request
  );
  if not v_result.allowed or not v_result.replayed then
    raise exception 'authorization_replay_failed';
  end if;

  for v_count in 2..20 loop
    perform *
    from public.authorize_promotion_oracle_turn(
      '00000000-0000-4000-8000-000000000001',
      'etoile_pass_48h_v1',
      gen_random_uuid()
    );
  end loop;

  select * into v_result
  from public.authorize_promotion_oracle_turn(
    '00000000-0000-4000-8000-000000000001',
    'etoile_pass_48h_v1',
    gen_random_uuid()
  );
  if v_result.allowed or v_result.reason <> 'promo_hourly_cap' then
    raise exception 'hourly_cap_failed reason=%', v_result.reason;
  end if;
end;
$$;
select pass('replays idempotently and enforces the hourly Oracle cap');

do $$
begin
  if has_function_privilege('authenticated', 'public.assign_promotion_offers(text,uuid[])', 'execute') then
    raise exception 'assignment_rpc_exposed_to_authenticated';
  end if;
  if has_table_privilege('authenticated', 'public.promotion_grants', 'select') then
    raise exception 'promotion_grants_exposed_to_authenticated';
  end if;
end;
$$;
select pass('keeps grant tables and cohort assignment service-only');

select is(
  (select count(*)::integer from cron.job where jobname = 'karmastro-promotion-turn-retention'),
  1,
  'schedules exactly one daily retention purge'
);

update public.profiles
set first_name = 'Camille'
where user_id = '00000000-0000-4000-8000-000000000001';

select is(
  (
    select first_name
    from public.lookup_referral_code(
      (select referral_code from public.profiles where user_id = '00000000-0000-4000-8000-000000000001')
    )
  ),
  'Camille'::text,
  'looks up one exact referral code without exposing the profiles table'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}';
do $$
begin
  begin
    update public.profiles
    set subscription_tier = 'etoile'
    where user_id = '00000000-0000-4000-8000-000000000001';
    raise exception 'reserved_profile_update_was_not_blocked';
  exception
    when others then
      if sqlerrm = 'reserved_profile_update_was_not_blocked' then
        raise;
      end if;
  end;
end;
$$;
reset role;
select pass('blocks authenticated writes to reserved premium profile columns');

select * from finish();
rollback;
