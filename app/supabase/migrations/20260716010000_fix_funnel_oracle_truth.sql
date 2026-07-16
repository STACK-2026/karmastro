-- Align the product funnel with the live Oracle contract (2 free messages,
-- user turns only) and the Stripe source of truth used by the current app.

create or replace view public.v_funnel_daily as
with days as (
  select generate_series((now() - interval '30 days')::date, now()::date, interval '1 day')::date as d
),
sess as (
  select started_at::date as d, count(*) as clean_sessions
  from public.v_sessions_clean group by 1
),
signups as (
  select created_at::date as d, count(*) as signups
  from auth.users group by 1
),
oracle as (
  select created_at::date as d,
         count(distinct coalesce(user_id::text, session_id)) as oracle_users
  from public.oracle_messages
  where role = 'user'
  group by 1
),
limits as (
  select usage_date as d, count(*) as limit_hits
  from public.oracle_daily_usage
  where message_count > 2
  group by 1
),
checkouts as (
  select created_at::date as d,
         count(*) filter (where event_name = 'checkout_started') as checkout_starts
  from public.analytics_events
  where event_name = 'checkout_started'
  group by 1
),
paid as (
  select created_at::date as d,
         count(*) filter (
           where type in ('checkout.session.completed', 'checkout.session.async_payment_succeeded')
             and payload->>'payment_status' = 'paid'
         ) as paid_checkouts,
         count(*) filter (
           where type in ('checkout.session.completed', 'checkout.session.async_payment_succeeded')
             and payload->>'payment_status' = 'paid'
             and payload->>'mode' = 'subscription'
         ) as new_subs
  from public.stripe_events
  group by 1
)
select days.d,
       coalesce(sess.clean_sessions, 0) as clean_sessions,
       coalesce(signups.signups, 0)     as signups,
       coalesce(oracle.oracle_users, 0) as oracle_users,
       coalesce(limits.limit_hits, 0)   as limit_hits,
       coalesce(paid.new_subs, 0)       as new_subs,
       coalesce(checkouts.checkout_starts, 0) as checkout_starts,
       coalesce(paid.paid_checkouts, 0) as paid_checkouts
from days
left join sess      on sess.d = days.d
left join signups   on signups.d = days.d
left join oracle    on oracle.d = days.d
left join limits    on limits.d = days.d
left join checkouts on checkouts.d = days.d
left join paid      on paid.d = days.d
order by days.d desc;

comment on view public.v_funnel_daily is
  'Funnel quotidien : sessions humaines -> comptes -> utilisateurs Oracle -> limite 2 messages -> checkout -> paiement Stripe.';

-- Stripe retries and manual replays must never grant a credit pack twice.
create unique index if not exists credit_transactions_purchase_session_uidx
  on public.credit_transactions(stripe_session_id)
  where stripe_session_id is not null and type = 'purchase';

create or replace function public.fulfill_credit_purchase(
  p_user_id uuid,
  p_credits integer,
  p_session_id text,
  p_description text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  if p_user_id is null or p_credits <= 0 or coalesce(trim(p_session_id), '') = '' then
    raise exception 'invalid_credit_purchase';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_session_id, 0));
  if exists (
    select 1 from public.credit_transactions
    where stripe_session_id = p_session_id and type = 'purchase'
  ) then
    return false;
  end if;

  update public.profiles
     set credits = coalesce(credits, 0) + p_credits
   where user_id = p_user_id
   returning credits into v_balance;
  if v_balance is null then
    raise exception 'profile_not_found';
  end if;

  insert into public.credit_transactions(
    user_id, amount, balance_after, type, description, stripe_session_id
  ) values (
    p_user_id, p_credits, v_balance, 'purchase', p_description, p_session_id
  );
  return true;
end;
$$;

revoke all on function public.fulfill_credit_purchase(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.fulfill_credit_purchase(uuid, integer, text, text) to service_role;
