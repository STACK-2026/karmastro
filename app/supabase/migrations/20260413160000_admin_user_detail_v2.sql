-- Enhanced admin_get_user_detail with attribution, sessions, device, cumulative stats

CREATE OR REPLACE FUNCTION public.admin_get_user_detail(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_profile JSONB;
  v_convos JSONB;
  v_credits JSONB;
  v_feedbacks JSONB;
  v_email TEXT;
  v_auth_provider TEXT;
  v_first_sign_in TIMESTAMPTZ;
  v_last_sign_in TIMESTAMPTZ;
  v_attribution JSONB;
  v_sessions JSONB;
  v_stats JSONB;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  -- Auth info
  SELECT au.email, au.raw_app_meta_data->>'provider',
         au.created_at, au.last_sign_in_at
  INTO v_email, v_auth_provider, v_first_sign_in, v_last_sign_in
  FROM auth.users au WHERE au.id = p_user_id;

  -- Profile
  SELECT to_jsonb(p.*) INTO v_profile
  FROM public.profiles p WHERE p.user_id = p_user_id;

  -- Conversations (last 50)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', oc.id, 'title', oc.title, 'created_at', oc.created_at, 'updated_at', oc.updated_at,
    'message_count', (SELECT COUNT(*) FROM public.oracle_messages om2 WHERE om2.conversation_id = oc.id)
  ) ORDER BY oc.updated_at DESC), '[]'::jsonb)
  INTO v_convos
  FROM public.oracle_conversations oc
  WHERE oc.user_id = p_user_id;

  -- Credit transactions (last 50)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', ct.id, 'amount', ct.amount, 'balance_after', ct.balance_after, 'type', ct.type,
    'description', ct.description, 'created_at', ct.created_at
  ) ORDER BY ct.created_at DESC), '[]'::jsonb)
  INTO v_credits
  FROM public.credit_transactions ct WHERE ct.user_id = p_user_id;

  -- Feedbacks (last 20)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', of.id, 'guide', of.guide, 'rating', of.rating, 'text', of.text,
    'user_message', of.user_message, 'created_at', of.created_at
  ) ORDER BY of.created_at DESC), '[]'::jsonb)
  INTO v_feedbacks
  FROM public.oracle_feedback of WHERE of.user_id = p_user_id;

  -- Attribution (first-touch)
  SELECT jsonb_build_object(
    'utm_source', ua.utm_source, 'utm_medium', ua.utm_medium,
    'utm_campaign', ua.utm_campaign, 'utm_term', ua.utm_term,
    'utm_content', ua.utm_content, 'landing_page', ua.landing_page,
    'referrer', ua.referrer, 'referrer_domain', ua.referrer_domain
  ) INTO v_attribution
  FROM public.user_attribution ua WHERE ua.user_id = p_user_id;

  -- Sessions (from page_views, grouped by session_id, ordered by recency)
  SELECT COALESCE(jsonb_agg(s ORDER BY s.started_at DESC), '[]'::jsonb)
  INTO v_sessions
  FROM (
    SELECT jsonb_build_object(
      'session_id', pv.session_id,
      'started_at', MIN(pv.created_at),
      'ended_at', MAX(pv.created_at),
      'duration_seconds', EXTRACT(EPOCH FROM (MAX(pv.created_at) - MIN(pv.created_at)))::INTEGER,
      'page_count', COUNT(*),
      'pages', jsonb_agg(jsonb_build_object('path', pv.path, 'at', pv.created_at) ORDER BY pv.created_at),
      'surface', (array_agg(pv.surface ORDER BY pv.created_at))[1],
      'device', CASE
        WHEN (array_agg(pv.user_agent ORDER BY pv.created_at))[1] ILIKE '%iPhone%' THEN 'iPhone'
        WHEN (array_agg(pv.user_agent ORDER BY pv.created_at))[1] ILIKE '%iPad%' THEN 'iPad'
        WHEN (array_agg(pv.user_agent ORDER BY pv.created_at))[1] ILIKE '%Android%' THEN 'Android'
        WHEN (array_agg(pv.user_agent ORDER BY pv.created_at))[1] ILIKE '%Mobile%' THEN 'Mobile'
        ELSE 'Desktop'
      END,
      'country_code', (array_agg(pv.country_code ORDER BY pv.created_at) FILTER (WHERE pv.country_code IS NOT NULL))[1],
      'referrer_domain', (array_agg(pv.referrer_domain ORDER BY pv.created_at) FILTER (WHERE pv.referrer_domain IS NOT NULL))[1]
    ) AS s
    FROM public.page_views pv
    WHERE pv.user_id = p_user_id AND NOT is_bot_ua(pv.user_agent)
    GROUP BY pv.session_id
  ) sub;

  -- Cumulative stats
  SELECT jsonb_build_object(
    'total_page_views', COUNT(*),
    'total_sessions', COUNT(DISTINCT pv2.session_id),
    'total_time_seconds', COALESCE(SUM(pv2.time_on_page_ms) / 1000, 0),
    'estimated_time_seconds', COALESCE(
      (SELECT SUM(EXTRACT(EPOCH FROM (sub2.ended - sub2.started)))::INTEGER
       FROM (SELECT MIN(pv3.created_at) AS started, MAX(pv3.created_at) AS ended
             FROM public.page_views pv3
             WHERE pv3.user_id = p_user_id AND NOT is_bot_ua(pv3.user_agent)
             GROUP BY pv3.session_id) sub2), 0),
    'first_seen', MIN(pv2.created_at),
    'last_seen', MAX(pv2.created_at),
    'total_oracle_messages', (SELECT COUNT(*) FROM public.oracle_messages om3 WHERE om3.user_id = p_user_id AND om3.role = 'user'),
    'total_conversations', (SELECT COUNT(*) FROM public.oracle_conversations oc2 WHERE oc2.user_id = p_user_id)
  ) INTO v_stats
  FROM public.page_views pv2
  WHERE pv2.user_id = p_user_id AND NOT is_bot_ua(pv2.user_agent);

  RETURN jsonb_build_object(
    'email', v_email,
    'auth_provider', COALESCE(v_auth_provider, 'email'),
    'first_sign_in', v_first_sign_in,
    'last_sign_in', v_last_sign_in,
    'profile', v_profile,
    'attribution', v_attribution,
    'sessions', v_sessions,
    'stats', v_stats,
    'conversations', v_convos,
    'credit_transactions', v_credits,
    'feedbacks', v_feedbacks
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
