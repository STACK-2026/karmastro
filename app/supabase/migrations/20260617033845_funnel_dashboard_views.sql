-- Funnel & débotage karmastro (Phase 0, plan 2026-06-17-monetisation-mrr-growth)
-- Vues read-only : isolent le trafic HUMAIN (is_bot=false) et exposent le funnel quotidien.

create or replace view public.v_sessions_clean as
select session_id,
       min(created_at)            as started_at,
       count(*)                   as page_count,
       max(locale)                as locale,
       bool_or(path ilike '%/oracle%') as reached_oracle_page
from public.page_views
where is_bot = false          -- débotage : flag déjà calculé, ~88% du trafic brut est bot
group by session_id;

comment on view public.v_sessions_clean is
  'Sessions humaines (is_bot=false). 1 ligne/session. Source de vérité trafic vs page_views brut.';

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
  from public.oracle_messages group by 1
),
limits as (
  select usage_date as d, count(*) as limit_hits
  from public.oracle_daily_usage where message_count > 3 group by 1
),
subs as (
  select created_at::date as d, count(*) as new_subs
  from public.subscriptions group by 1
)
select days.d,
       coalesce(sess.clean_sessions, 0) as clean_sessions,
       coalesce(signups.signups, 0)     as signups,
       coalesce(oracle.oracle_users, 0) as oracle_users,
       coalesce(limits.limit_hits, 0)   as limit_hits,
       coalesce(subs.new_subs, 0)       as new_subs
from days
left join sess    on sess.d = days.d
left join signups on signups.d = days.d
left join oracle  on oracle.d = days.d
left join limits  on limits.d = days.d
left join subs    on subs.d = days.d
order by days.d desc;

comment on view public.v_funnel_daily is
  'Funnel quotidien débotté : clean_sessions -> signups -> oracle_users -> limit_hits -> new_subs.';
