-- Bot detection helper + bot filter on all analytics RPCs + bot stats RPC

-- 1. Helper: returns TRUE if the user_agent looks like a known bot/crawler
CREATE OR REPLACE FUNCTION public.is_bot_ua(ua TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF ua IS NULL THEN RETURN FALSE; END IF;
  RETURN (
    ua ILIKE '%bot%'
    OR ua ILIKE '%crawl%'
    OR ua ILIKE '%spider%'
    OR ua ILIKE '%GoogleOther%'
    OR ua ILIKE '%Google-InspectionTool%'
    OR ua ILIKE '%Google-Read-Aloud%'
    OR ua ILIKE '%HubSpot%'
    OR ua ILIKE '%HeadlessChrome%'
    OR ua ILIKE '%Dataprovider%'
    OR ua ILIKE '%Bytespider%'
    OR ua = 'curl'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Recreate admin_live_visitors: add is_bot flag per session + total counts
CREATE OR REPLACE FUNCTION public.admin_live_visitors(p_window_minutes INTEGER DEFAULT 5)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT jsonb_build_object(
    'total', COUNT(DISTINCT session_id),
    'total_humans', COUNT(DISTINCT session_id) FILTER (WHERE NOT is_bot),
    'total_bots', COUNT(DISTINCT session_id) FILTER (WHERE is_bot),
    'sessions', COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
      'session_id', session_id,
      'last_path', last_path,
      'page_count', page_count,
      'last_seen', last_seen,
      'surface', surface,
      'user_id', user_id,
      'user_agent', user_agent,
      'is_bot', is_bot
    )), '[]'::jsonb)
  ) INTO v_result
  FROM (
    SELECT DISTINCT ON (pv.session_id)
      pv.session_id,
      pv.path AS last_path,
      pv.surface,
      pv.user_id,
      pv.user_agent,
      public.is_bot_ua(pv.user_agent) AS is_bot,
      (SELECT COUNT(*) FROM public.page_views WHERE session_id = pv.session_id) AS page_count,
      (SELECT MAX(created_at) FROM public.page_views WHERE session_id = pv.session_id) AS last_seen
    FROM public.page_views pv
    WHERE pv.created_at >= now() - (p_window_minutes || ' minutes')::interval
    ORDER BY pv.session_id, pv.created_at DESC
  ) t;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. admin_top_pages: add p_exclude_bots
CREATE OR REPLACE FUNCTION public.admin_top_pages(
  p_period_days INTEGER DEFAULT 30,
  p_surface TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 30,
  p_exclude_bots BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  path TEXT,
  surface TEXT,
  views BIGINT,
  unique_sessions BIGINT,
  avg_time_ms NUMERIC
) AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    pv.path,
    pv.surface,
    COUNT(*)::BIGINT AS views,
    COUNT(DISTINCT pv.session_id)::BIGINT AS unique_sessions,
    AVG(pv.time_on_page_ms)::NUMERIC AS avg_time_ms
  FROM public.page_views pv
  WHERE pv.created_at >= now() - (p_period_days || ' days')::interval
    AND (p_surface IS NULL OR pv.surface = p_surface)
    AND (NOT p_exclude_bots OR NOT public.is_bot_ua(pv.user_agent))
  GROUP BY pv.path, pv.surface
  ORDER BY views DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_top_pages(INTEGER, TEXT, INTEGER, BOOLEAN) TO authenticated;

-- 4. admin_traffic_sources: add p_exclude_bots
CREATE OR REPLACE FUNCTION public.admin_traffic_sources(
  p_period_days INTEGER DEFAULT 30,
  p_exclude_bots BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  v_channels JSONB;
  v_sources JSONB;
  v_referrers JSONB;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT jsonb_agg(jsonb_build_object('name', src, 'count', cnt) ORDER BY cnt DESC)
  INTO v_sources
  FROM (
    SELECT COALESCE(NULLIF(utm_source, ''), 'direct') AS src, COUNT(DISTINCT session_id) AS cnt
    FROM public.page_views
    WHERE created_at >= now() - (p_period_days || ' days')::interval
      AND (NOT p_exclude_bots OR NOT public.is_bot_ua(user_agent))
    GROUP BY COALESCE(NULLIF(utm_source, ''), 'direct')
    ORDER BY cnt DESC
    LIMIT 20
  ) t;

  SELECT jsonb_agg(jsonb_build_object('name', domain, 'count', cnt) ORDER BY cnt DESC)
  INTO v_referrers
  FROM (
    SELECT referrer_domain AS domain, COUNT(DISTINCT session_id) AS cnt
    FROM public.page_views
    WHERE created_at >= now() - (p_period_days || ' days')::interval
      AND referrer_domain IS NOT NULL AND referrer_domain <> ''
      AND (NOT p_exclude_bots OR NOT public.is_bot_ua(user_agent))
    GROUP BY referrer_domain
    ORDER BY cnt DESC
    LIMIT 20
  ) t;

  SELECT jsonb_object_agg(channel, cnt)
  INTO v_channels
  FROM (
    SELECT
      CASE
        WHEN utm_source ILIKE '%google%' OR referrer_domain ILIKE '%google%' THEN 'google'
        WHEN utm_source ILIKE '%bing%' OR referrer_domain ILIKE '%bing%' THEN 'bing'
        WHEN utm_source ILIKE '%duckduckgo%' OR referrer_domain ILIKE '%duckduckgo%' THEN 'duckduckgo'
        WHEN utm_medium = 'email' OR utm_source ILIKE '%email%' OR utm_source ILIKE '%resend%' THEN 'email'
        WHEN referrer_domain ILIKE '%facebook%' OR referrer_domain ILIKE '%instagram%'
             OR referrer_domain ILIKE '%twitter%' OR referrer_domain ILIKE '%tiktok%'
             OR referrer_domain ILIKE '%linkedin%' OR referrer_domain ILIKE '%reddit%' THEN 'social'
        WHEN utm_source = 'referral' OR referrer_domain IS NOT NULL THEN 'referral'
        ELSE 'direct'
      END AS channel,
      COUNT(DISTINCT session_id) AS cnt
    FROM public.page_views
    WHERE created_at >= now() - (p_period_days || ' days')::interval
      AND (NOT p_exclude_bots OR NOT public.is_bot_ua(user_agent))
    GROUP BY 1
  ) t;

  RETURN jsonb_build_object(
    'channels', COALESCE(v_channels, '{}'::jsonb),
    'sources', COALESCE(v_sources, '[]'::jsonb),
    'referrers', COALESCE(v_referrers, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_traffic_sources(INTEGER, BOOLEAN) TO authenticated;

-- 5. admin_device_breakdown: add p_exclude_bots
CREATE OR REPLACE FUNCTION public.admin_device_breakdown(
  p_period_days INTEGER DEFAULT 30,
  p_exclude_bots BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT jsonb_build_object(
    'devices', (
      SELECT jsonb_object_agg(device, cnt)
      FROM (
        SELECT
          CASE
            WHEN screen_width < 768 THEN 'mobile'
            WHEN screen_width < 1024 THEN 'tablet'
            ELSE 'desktop'
          END AS device,
          COUNT(DISTINCT session_id) AS cnt
        FROM public.page_views
        WHERE created_at >= now() - (p_period_days || ' days')::interval
          AND screen_width IS NOT NULL
          AND (NOT p_exclude_bots OR NOT public.is_bot_ua(user_agent))
        GROUP BY 1
      ) t
    ),
    'os', (
      SELECT jsonb_object_agg(os, cnt)
      FROM (
        SELECT
          CASE
            WHEN user_agent ILIKE '%iphone%' OR user_agent ILIKE '%ipad%' OR user_agent ILIKE '%ipod%' THEN 'iOS'
            WHEN user_agent ILIKE '%android%' THEN 'Android'
            WHEN user_agent ILIKE '%mac os x%' OR user_agent ILIKE '%macintosh%' THEN 'macOS'
            WHEN user_agent ILIKE '%windows%' THEN 'Windows'
            WHEN user_agent ILIKE '%linux%' THEN 'Linux'
            ELSE 'Autre'
          END AS os,
          COUNT(DISTINCT session_id) AS cnt
        FROM public.page_views
        WHERE created_at >= now() - (p_period_days || ' days')::interval
          AND user_agent IS NOT NULL
          AND (NOT p_exclude_bots OR NOT public.is_bot_ua(user_agent))
        GROUP BY 1
      ) t
    ),
    'browsers', (
      SELECT jsonb_object_agg(browser, cnt)
      FROM (
        SELECT
          CASE
            WHEN user_agent ILIKE '%edg/%' THEN 'Edge'
            WHEN user_agent ILIKE '%chrome%' AND user_agent NOT ILIKE '%edg/%' THEN 'Chrome'
            WHEN user_agent ILIKE '%firefox%' THEN 'Firefox'
            WHEN user_agent ILIKE '%safari%' AND user_agent NOT ILIKE '%chrome%' THEN 'Safari'
            WHEN user_agent ILIKE '%opr/%' OR user_agent ILIKE '%opera%' THEN 'Opera'
            ELSE 'Autre'
          END AS browser,
          COUNT(DISTINCT session_id) AS cnt
        FROM public.page_views
        WHERE created_at >= now() - (p_period_days || ' days')::interval
          AND user_agent IS NOT NULL
          AND (NOT p_exclude_bots OR NOT public.is_bot_ua(user_agent))
        GROUP BY 1
      ) t
    ),
    'locales', (
      SELECT jsonb_object_agg(locale, cnt)
      FROM (
        SELECT COALESCE(NULLIF(locale, ''), 'fr') AS locale, COUNT(DISTINCT session_id) AS cnt
        FROM public.page_views
        WHERE created_at >= now() - (p_period_days || ' days')::interval
          AND (NOT p_exclude_bots OR NOT public.is_bot_ua(user_agent))
        GROUP BY 1
        ORDER BY cnt DESC
        LIMIT 15
      ) t
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_device_breakdown(INTEGER, BOOLEAN) TO authenticated;

-- 6. admin_recent_journeys: add is_bot flag
CREATE OR REPLACE FUNCTION public.admin_recent_journeys(p_limit INTEGER DEFAULT 20)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT jsonb_agg(journey ORDER BY last_seen DESC)
  INTO v_result
  FROM (
    SELECT
      jsonb_build_object(
        'session_id', session_id,
        'user_id', user_id,
        'surface', surface,
        'first_seen', first_seen,
        'last_seen', last_seen,
        'duration_seconds', EXTRACT(EPOCH FROM (last_seen - first_seen))::INTEGER,
        'page_count', page_count,
        'pages', pages,
        'referrer_domain', referrer_domain,
        'utm_source', utm_source,
        'user_agent', user_agent,
        'is_bot', public.is_bot_ua(user_agent)
      ) AS journey,
      last_seen
    FROM (
      SELECT
        pv.session_id,
        (ARRAY_AGG(pv.user_id ORDER BY pv.created_at DESC))[1] AS user_id,
        (ARRAY_AGG(pv.surface ORDER BY pv.created_at DESC))[1] AS surface,
        (ARRAY_AGG(pv.referrer_domain ORDER BY pv.created_at ASC))[1] AS referrer_domain,
        (ARRAY_AGG(pv.utm_source ORDER BY pv.created_at ASC))[1] AS utm_source,
        (ARRAY_AGG(pv.user_agent ORDER BY pv.created_at DESC))[1] AS user_agent,
        MIN(pv.created_at) AS first_seen,
        MAX(pv.created_at) AS last_seen,
        COUNT(*) AS page_count,
        jsonb_agg(jsonb_build_object('path', pv.path, 'at', pv.created_at, 'surface', pv.surface) ORDER BY pv.created_at ASC) AS pages
      FROM public.page_views pv
      WHERE pv.created_at >= now() - INTERVAL '7 days'
      GROUP BY pv.session_id
      ORDER BY MAX(pv.created_at) DESC
      LIMIT p_limit
    ) t
  ) s;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. admin_pageviews_timeseries: add p_exclude_bots
CREATE OR REPLACE FUNCTION public.admin_pageviews_timeseries(
  p_period_days INTEGER DEFAULT 30,
  p_exclude_bots BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT jsonb_agg(row_to_json(t) ORDER BY day)
  INTO v_result
  FROM (
    SELECT
      DATE(created_at) AS day,
      COUNT(*) FILTER (WHERE surface = 'site') AS site_views,
      COUNT(*) FILTER (WHERE surface = 'app') AS app_views,
      COUNT(DISTINCT session_id) AS sessions
    FROM public.page_views
    WHERE created_at >= now() - (p_period_days || ' days')::interval
      AND (NOT p_exclude_bots OR NOT public.is_bot_ua(user_agent))
    GROUP BY DATE(created_at)
    ORDER BY day ASC
  ) t;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_pageviews_timeseries(INTEGER, BOOLEAN) TO authenticated;

-- 8. NEW: admin_bot_stats - crawl summary
CREATE OR REPLACE FUNCTION public.admin_bot_stats(p_period_days INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT jsonb_build_object(
    'total_bot_hits', COUNT(*),
    'total_bot_sessions', COUNT(DISTINCT session_id),
    'unique_pages_crawled', COUNT(DISTINCT path),
    'first_crawl', MIN(created_at),
    'last_crawl', MAX(created_at),
    'crawl_window_hours', EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))::INTEGER / 3600,
    'by_bot', (
      SELECT jsonb_agg(jsonb_build_object('name', bot_name, 'hits', hits, 'sessions', sessions, 'unique_pages', upages) ORDER BY hits DESC)
      FROM (
        SELECT
          CASE
            WHEN user_agent ILIKE '%GoogleOther%' THEN 'GoogleOther'
            WHEN user_agent ILIKE '%Googlebot/2.1%' THEN 'Googlebot'
            WHEN user_agent ILIKE '%Google-InspectionTool%' THEN 'Google-InspectionTool'
            WHEN user_agent ILIKE '%Google-Read-Aloud%' THEN 'Google-Read-Aloud'
            WHEN user_agent ILIKE '%YandexBot%' THEN 'YandexBot'
            WHEN user_agent ILIKE '%HubSpot%' THEN 'HubSpot'
            WHEN user_agent ILIKE '%Bytespider%' THEN 'Bytespider (TikTok)'
            WHEN user_agent ILIKE '%HeadlessChrome%' THEN 'HeadlessChrome'
            WHEN user_agent ILIKE '%Dataprovider%' THEN 'Dataprovider'
            WHEN user_agent = 'curl' THEN 'curl'
            ELSE 'Autre'
          END AS bot_name,
          COUNT(*) AS hits,
          COUNT(DISTINCT session_id) AS sessions,
          COUNT(DISTINCT path) AS upages
        FROM public.page_views
        WHERE created_at >= now() - (p_period_days || ' days')::interval
          AND public.is_bot_ua(user_agent)
        GROUP BY 1
      ) b
    ),
    'crawl_per_day', (
      SELECT jsonb_agg(jsonb_build_object('day', day, 'hits', hits, 'pages', upages) ORDER BY day)
      FROM (
        SELECT DATE(created_at) AS day, COUNT(*) AS hits, COUNT(DISTINCT path) AS upages
        FROM public.page_views
        WHERE created_at >= now() - (p_period_days || ' days')::interval
          AND public.is_bot_ua(user_agent)
        GROUP BY DATE(created_at)
      ) d
    )
  ) INTO v_result
  FROM public.page_views
  WHERE created_at >= now() - (p_period_days || ' days')::interval
    AND public.is_bot_ua(user_agent);

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_bot_stats(INTEGER) TO authenticated;
