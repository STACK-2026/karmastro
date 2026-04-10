-- Analytics RPCs (admin-only, SECURITY DEFINER)

-- 1. Visiteurs live (5 dernières minutes, groupés par session)
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
    'sessions', COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
      'session_id', session_id,
      'last_path', last_path,
      'page_count', page_count,
      'last_seen', last_seen,
      'surface', surface,
      'user_id', user_id,
      'user_agent', user_agent
    )), '[]'::jsonb)
  ) INTO v_result
  FROM (
    SELECT DISTINCT ON (pv.session_id)
      pv.session_id,
      pv.path AS last_path,
      pv.surface,
      pv.user_id,
      pv.user_agent,
      (SELECT COUNT(*) FROM public.page_views WHERE session_id = pv.session_id) AS page_count,
      (SELECT MAX(created_at) FROM public.page_views WHERE session_id = pv.session_id) AS last_seen
    FROM public.page_views pv
    WHERE pv.created_at >= now() - (p_window_minutes || ' minutes')::interval
    ORDER BY pv.session_id, pv.created_at DESC
  ) t;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_live_visitors(INTEGER) TO authenticated;

-- 2. Top pages (vues + uniques) sur une période
CREATE OR REPLACE FUNCTION public.admin_top_pages(
  p_period_days INTEGER DEFAULT 30,
  p_surface TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 30
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
  GROUP BY pv.path, pv.surface
  ORDER BY views DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_top_pages(INTEGER, TEXT, INTEGER) TO authenticated;

-- 3. Traffic sources : breakdown par utm_source / domaine referrer
CREATE OR REPLACE FUNCTION public.admin_traffic_sources(p_period_days INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
  v_channels JSONB;
  v_sources JSONB;
  v_referrers JSONB;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  -- Classement par utm_source
  SELECT jsonb_agg(jsonb_build_object('name', src, 'count', cnt) ORDER BY cnt DESC)
  INTO v_sources
  FROM (
    SELECT COALESCE(NULLIF(utm_source, ''), 'direct') AS src, COUNT(DISTINCT session_id) AS cnt
    FROM public.page_views
    WHERE created_at >= now() - (p_period_days || ' days')::interval
    GROUP BY COALESCE(NULLIF(utm_source, ''), 'direct')
    ORDER BY cnt DESC
    LIMIT 20
  ) t;

  -- Top referrers
  SELECT jsonb_agg(jsonb_build_object('name', domain, 'count', cnt) ORDER BY cnt DESC)
  INTO v_referrers
  FROM (
    SELECT referrer_domain AS domain, COUNT(DISTINCT session_id) AS cnt
    FROM public.page_views
    WHERE created_at >= now() - (p_period_days || ' days')::interval
      AND referrer_domain IS NOT NULL AND referrer_domain <> ''
    GROUP BY referrer_domain
    ORDER BY cnt DESC
    LIMIT 20
  ) t;

  -- Canaux catégorisés
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
    GROUP BY 1
  ) t;

  RETURN jsonb_build_object(
    'channels', COALESCE(v_channels, '{}'::jsonb),
    'sources', COALESCE(v_sources, '[]'::jsonb),
    'referrers', COALESCE(v_referrers, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_traffic_sources(INTEGER) TO authenticated;

-- 4. Device/OS breakdown
CREATE OR REPLACE FUNCTION public.admin_device_breakdown(p_period_days INTEGER DEFAULT 30)
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
        GROUP BY 1
      ) t
    ),
    'locales', (
      SELECT jsonb_object_agg(locale, cnt)
      FROM (
        SELECT COALESCE(NULLIF(locale, ''), 'fr') AS locale, COUNT(DISTINCT session_id) AS cnt
        FROM public.page_views
        WHERE created_at >= now() - (p_period_days || ' days')::interval
        GROUP BY 1
        ORDER BY cnt DESC
        LIMIT 15
      ) t
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_device_breakdown(INTEGER) TO authenticated;

-- 5. Recent user journeys (sessions avec toutes les pages ordonnées)
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
        'user_agent', user_agent
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

GRANT EXECUTE ON FUNCTION public.admin_recent_journeys(INTEGER) TO authenticated;

-- 6. Timeseries page views par jour
CREATE OR REPLACE FUNCTION public.admin_pageviews_timeseries(p_period_days INTEGER DEFAULT 30)
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
    GROUP BY DATE(created_at)
    ORDER BY day ASC
  ) t;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_pageviews_timeseries(INTEGER) TO authenticated;

-- 7. Events breakdown (tous les events custom de analytics_events)
CREATE OR REPLACE FUNCTION public.admin_events_breakdown(p_period_days INTEGER DEFAULT 30)
RETURNS TABLE (
  event_name TEXT,
  event_count BIGINT,
  unique_sessions BIGINT,
  unique_users BIGINT
) AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    e.event_name,
    COUNT(*)::BIGINT AS event_count,
    COUNT(DISTINCT e.session_id)::BIGINT AS unique_sessions,
    COUNT(DISTINCT e.user_id)::BIGINT AS unique_users
  FROM public.analytics_events e
  WHERE e.created_at >= now() - (p_period_days || ' days')::interval
  GROUP BY e.event_name
  ORDER BY event_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_events_breakdown(INTEGER) TO authenticated;
