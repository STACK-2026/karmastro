-- Funnel des CTA de fin d'outil (analytics_events, surface=site).
-- Montre l'effet du reroute Oracle : par jour, combien d'outils calculés,
-- combien de vues du bloc CTA, et le SPLIT clic Oracle (gratuit) vs clic lecture 4,90€.
create or replace view public.v_cta_funnel_daily as
select created_at::date                                                as d,
       count(*) filter (where event_name = 'tool_calculated')         as tool_calculated,
       count(*) filter (where event_name = 'reading_cta_view')        as cta_viewed,
       count(*) filter (where event_name = 'oracle_cta_click')        as oracle_clicks,
       count(*) filter (where event_name = 'reading_cta_click')       as paid_clicks
from public.analytics_events
where surface = 'site'
  and event_name in ('tool_calculated','reading_cta_view','oracle_cta_click','reading_cta_click')
group by 1
order by 1 desc;

comment on view public.v_cta_funnel_daily is
  'Funnel CTA fin d''outil : tool_calculated -> cta_viewed -> {oracle_clicks (reroute gratuit) | paid_clicks (4,90€)}.';
