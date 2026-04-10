-- Admin RPC helpers : bypass RLS via SECURITY DEFINER
-- Toutes vérifient is_admin avant d'exposer les données

-- 0. Helper : suis-je admin ?
CREATE OR REPLACE FUNCTION public.is_current_user_admin() RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid() LIMIT 1),
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- 1. KPIs globaux pour la vue d'ensemble
CREATE OR REPLACE FUNCTION public.admin_get_kpis(p_period_days INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
  v_since TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  v_since := now() - (p_period_days || ' days')::interval;

  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'new_users_period', (SELECT COUNT(*) FROM public.profiles WHERE created_at >= v_since),
    'paid_users', (SELECT COUNT(*) FROM public.profiles WHERE subscription_tier IN ('etoile', 'cosmos') AND subscription_status = 'active'),
    'tier_breakdown', (
      SELECT jsonb_object_agg(subscription_tier, cnt)
      FROM (SELECT subscription_tier, COUNT(*) AS cnt FROM public.profiles GROUP BY subscription_tier) t
    ),
    'total_conversations', (SELECT COUNT(*) FROM public.oracle_conversations),
    'conversations_period', (SELECT COUNT(*) FROM public.oracle_conversations WHERE created_at >= v_since),
    'total_messages', (SELECT COUNT(*) FROM public.oracle_messages),
    'messages_period', (SELECT COUNT(*) FROM public.oracle_messages WHERE created_at >= v_since),
    'total_feedbacks', (SELECT COUNT(*) FROM public.oracle_feedback),
    'avg_rating', (SELECT COALESCE(AVG(rating)::numeric(4,2), 0) FROM public.oracle_feedback),
    'total_referrals', (SELECT COUNT(*) FROM public.profiles WHERE referred_by_user_id IS NOT NULL),
    'total_credits_purchased', (SELECT COALESCE(SUM(amount), 0) FROM public.credit_transactions WHERE type = 'purchase'),
    'total_credits_consumed', (SELECT COALESCE(SUM(ABS(amount)), 0) FROM public.credit_transactions WHERE type = 'consume'),
    'stripe_events_period', (SELECT COUNT(*) FROM public.stripe_events WHERE created_at >= v_since),
    'emails_sent_period', (SELECT COUNT(*) FROM public.email_log WHERE created_at >= v_since AND status = 'sent'),
    'emails_failed_period', (SELECT COUNT(*) FROM public.email_log WHERE created_at >= v_since AND status = 'failed')
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_get_kpis(INTEGER) TO authenticated;

-- 2. Timeseries : nouveaux users par jour + messages oracle par jour
CREATE OR REPLACE FUNCTION public.admin_get_timeseries(p_period_days INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
  v_since TIMESTAMPTZ;
  v_signups JSONB;
  v_messages JSONB;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  v_since := (CURRENT_DATE - (p_period_days || ' days')::interval)::timestamptz;

  SELECT jsonb_agg(jsonb_build_object('date', day, 'count', cnt) ORDER BY day)
  INTO v_signups
  FROM (
    SELECT DATE(created_at) AS day, COUNT(*) AS cnt
    FROM public.profiles
    WHERE created_at >= v_since
    GROUP BY DATE(created_at)
  ) s;

  SELECT jsonb_agg(jsonb_build_object('date', day, 'count', cnt) ORDER BY day)
  INTO v_messages
  FROM (
    SELECT DATE(created_at) AS day, COUNT(*) AS cnt
    FROM public.oracle_messages
    WHERE created_at >= v_since AND role = 'user'
    GROUP BY DATE(created_at)
  ) m;

  RETURN jsonb_build_object(
    'signups', COALESCE(v_signups, '[]'::jsonb),
    'messages', COALESCE(v_messages, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_get_timeseries(INTEGER) TO authenticated;

-- 3. Liste paginée des users avec stats agrégées
CREATE OR REPLACE FUNCTION public.admin_get_users(
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  birth_date DATE,
  birth_place TEXT,
  gender TEXT,
  language TEXT,
  subscription_tier TEXT,
  subscription_status TEXT,
  subscription_period_end TIMESTAMPTZ,
  credits INTEGER,
  referral_code TEXT,
  referred_by_code TEXT,
  badges TEXT[],
  is_admin BOOLEAN,
  created_at TIMESTAMPTZ,
  conversations_count BIGINT,
  messages_count BIGINT,
  filleuls_count BIGINT,
  last_activity TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    u.email::TEXT,
    p.first_name,
    p.last_name,
    p.birth_date::DATE,
    p.birth_place,
    p.gender,
    p.language,
    p.subscription_tier,
    p.subscription_status,
    p.subscription_period_end,
    p.credits,
    p.referral_code,
    p.referred_by_code,
    p.badges,
    p.is_admin,
    p.created_at,
    COALESCE(c.convo_count, 0) AS conversations_count,
    COALESCE(m.msg_count, 0) AS messages_count,
    COALESCE(f.filleuls, 0) AS filleuls_count,
    GREATEST(
      p.updated_at,
      COALESCE(c.last_convo, p.created_at),
      COALESCE(m.last_msg, p.created_at)
    ) AS last_activity
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS convo_count, MAX(updated_at) AS last_convo
    FROM public.oracle_conversations GROUP BY user_id
  ) c ON c.user_id = p.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS msg_count, MAX(created_at) AS last_msg
    FROM public.oracle_messages WHERE role = 'user' GROUP BY user_id
  ) m ON m.user_id = p.user_id
  LEFT JOIN (
    SELECT referred_by_user_id, COUNT(*) AS filleuls
    FROM public.profiles WHERE referred_by_user_id IS NOT NULL GROUP BY referred_by_user_id
  ) f ON f.referred_by_user_id = p.user_id
  WHERE
    p_search IS NULL
    OR u.email ILIKE '%' || p_search || '%'
    OR p.first_name ILIKE '%' || p_search || '%'
    OR p.last_name ILIKE '%' || p_search || '%'
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_get_users(INTEGER, INTEGER, TEXT) TO authenticated;

-- 4. Détail d'un user : profil complet + conversations + transactions
CREATE OR REPLACE FUNCTION public.admin_get_user_detail(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_profile JSONB;
  v_convos JSONB;
  v_credits JSONB;
  v_feedbacks JSONB;
  v_email TEXT;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;

  SELECT to_jsonb(p.*) INTO v_profile
  FROM public.profiles p WHERE p.user_id = p_user_id;

  SELECT jsonb_agg(jsonb_build_object(
    'id', id, 'title', title, 'created_at', created_at, 'updated_at', updated_at,
    'message_count', (SELECT COUNT(*) FROM public.oracle_messages WHERE conversation_id = oc.id)
  ) ORDER BY updated_at DESC)
  INTO v_convos
  FROM public.oracle_conversations oc
  WHERE user_id = p_user_id
  LIMIT 50;

  SELECT jsonb_agg(jsonb_build_object(
    'id', id, 'amount', amount, 'balance_after', balance_after, 'type', type,
    'description', description, 'created_at', created_at
  ) ORDER BY created_at DESC)
  INTO v_credits
  FROM public.credit_transactions WHERE user_id = p_user_id LIMIT 50;

  SELECT jsonb_agg(jsonb_build_object(
    'id', id, 'guide', guide, 'rating', rating, 'text', text,
    'user_message', user_message, 'created_at', created_at
  ) ORDER BY created_at DESC)
  INTO v_feedbacks
  FROM public.oracle_feedback WHERE user_id = p_user_id LIMIT 20;

  RETURN jsonb_build_object(
    'email', v_email,
    'profile', v_profile,
    'conversations', COALESCE(v_convos, '[]'::jsonb),
    'credit_transactions', COALESCE(v_credits, '[]'::jsonb),
    'feedbacks', COALESCE(v_feedbacks, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_get_user_detail(UUID) TO authenticated;

-- 5. Toutes les conversations oracle avec nom du user
CREATE OR REPLACE FUNCTION public.admin_get_conversations(
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  user_first_name TEXT,
  title TEXT,
  message_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    oc.id, oc.user_id, u.email::TEXT, p.first_name, oc.title,
    (SELECT COUNT(*) FROM public.oracle_messages WHERE conversation_id = oc.id),
    oc.created_at, oc.updated_at
  FROM public.oracle_conversations oc
  LEFT JOIN auth.users u ON u.id = oc.user_id
  LEFT JOIN public.profiles p ON p.user_id = oc.user_id
  ORDER BY oc.updated_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_get_conversations(INTEGER, INTEGER) TO authenticated;

-- 6. Messages d'une conversation spécifique
CREATE OR REPLACE FUNCTION public.admin_get_conversation_messages(p_conversation_id UUID)
RETURNS TABLE (
  id UUID,
  role TEXT,
  content TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT m.id, m.role, m.content, m.created_at
  FROM public.oracle_messages m
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_get_conversation_messages(UUID) TO authenticated;

-- 7. Feedbacks oracle (tous, avec user info)
CREATE OR REPLACE FUNCTION public.admin_get_feedbacks(
  p_limit INTEGER DEFAULT 100,
  p_guide TEXT DEFAULT NULL,
  p_rating INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  guide TEXT,
  rating SMALLINT,
  text TEXT,
  user_message TEXT,
  assistant_message TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    f.id, f.user_id, u.email::TEXT, f.guide, f.rating, f.text,
    f.user_message, f.assistant_message, f.created_at
  FROM public.oracle_feedback f
  LEFT JOIN auth.users u ON u.id = f.user_id
  WHERE (p_guide IS NULL OR f.guide = p_guide)
    AND (p_rating IS NULL OR f.rating = p_rating)
  ORDER BY f.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_get_feedbacks(INTEGER, TEXT, INTEGER) TO authenticated;

-- 8. Credit transactions globales
CREATE OR REPLACE FUNCTION public.admin_get_credit_transactions(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  amount INTEGER,
  balance_after INTEGER,
  type TEXT,
  description TEXT,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT c.id, c.user_id, u.email::TEXT, c.amount, c.balance_after, c.type,
         c.description, c.stripe_session_id, c.created_at
  FROM public.credit_transactions c
  LEFT JOIN auth.users u ON u.id = c.user_id
  ORDER BY c.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_get_credit_transactions(INTEGER) TO authenticated;

-- 9. Stripe events
CREATE OR REPLACE FUNCTION public.admin_get_stripe_events(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  stripe_event_id TEXT,
  type TEXT,
  user_id UUID,
  user_email TEXT,
  processed BOOLEAN,
  error TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT s.id, s.stripe_event_id, s.type, s.user_id, u.email::TEXT,
         s.processed, s.error, s.created_at
  FROM public.stripe_events s
  LEFT JOIN auth.users u ON u.id = s.user_id
  ORDER BY s.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_get_stripe_events(INTEGER) TO authenticated;

-- 10. Email log
CREATE OR REPLACE FUNCTION public.admin_get_email_log(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  recipient TEXT,
  type TEXT,
  subject TEXT,
  status TEXT,
  error TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT e.id, e.recipient, e.type, e.subject, e.status, e.error, e.created_at
  FROM public.email_log e
  ORDER BY e.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_get_email_log(INTEGER) TO authenticated;

-- 11. Top parrains
CREATE OR REPLACE FUNCTION public.admin_get_top_referrers(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  first_name TEXT,
  referral_code TEXT,
  filleuls_count BIGINT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT p.user_id, u.email::TEXT, p.first_name, p.referral_code,
         COUNT(f.user_id) AS filleuls_count, p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN public.profiles f ON f.referred_by_user_id = p.user_id
  GROUP BY p.user_id, u.email, p.first_name, p.referral_code, p.created_at
  HAVING COUNT(f.user_id) > 0
  ORDER BY filleuls_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_get_top_referrers(INTEGER) TO authenticated;

-- 12. Admin action : accorder des crédits à un user
CREATE OR REPLACE FUNCTION public.admin_grant_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'Crédits offerts par admin'
) RETURNS JSONB AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  UPDATE public.profiles
  SET credits = credits + p_amount
  WHERE user_id = p_user_id
  RETURNING credits INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, balance_after, type, description)
  VALUES (p_user_id, p_amount, v_new_balance, 'bonus', p_description);

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_grant_credits(UUID, INTEGER, TEXT) TO authenticated;

-- 13. Admin action : toggle is_admin sur un user
CREATE OR REPLACE FUNCTION public.admin_toggle_admin(p_user_id UUID) RETURNS BOOLEAN AS $$
DECLARE
  v_new_state BOOLEAN;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  UPDATE public.profiles
  SET is_admin = NOT COALESCE(is_admin, false)
  WHERE user_id = p_user_id
  RETURNING is_admin INTO v_new_state;

  RETURN v_new_state;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_toggle_admin(UUID) TO authenticated;
