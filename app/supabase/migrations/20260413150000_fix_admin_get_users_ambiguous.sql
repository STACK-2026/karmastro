-- Fix: "column reference user_id is ambiguous" in admin_get_users
-- The RETURNS TABLE output column "user_id" clashes with unqualified
-- "user_id" references inside subqueries. Fix by aliasing all subquery columns.

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
    COALESCE(c.convo_count, 0)::BIGINT AS conversations_count,
    COALESCE(m.msg_count, 0)::BIGINT AS messages_count,
    COALESCE(f.filleuls, 0)::BIGINT AS filleuls_count,
    GREATEST(
      p.updated_at,
      COALESCE(c.last_convo, p.created_at),
      COALESCE(m.last_msg, p.created_at)
    ) AS last_activity
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN (
    SELECT oc.user_id AS uid, COUNT(*) AS convo_count, MAX(oc.updated_at) AS last_convo
    FROM public.oracle_conversations oc GROUP BY oc.user_id
  ) c ON c.uid = p.user_id
  LEFT JOIN (
    SELECT om.user_id AS uid, COUNT(*) AS msg_count, MAX(om.created_at) AS last_msg
    FROM public.oracle_messages om WHERE om.role = 'user' GROUP BY om.user_id
  ) m ON m.uid = p.user_id
  LEFT JOIN (
    SELECT pr.referred_by_user_id AS uid, COUNT(*) AS filleuls
    FROM public.profiles pr WHERE pr.referred_by_user_id IS NOT NULL GROUP BY pr.referred_by_user_id
  ) f ON f.uid = p.user_id
  WHERE
    p_search IS NULL
    OR u.email ILIKE '%' || p_search || '%'
    OR p.first_name ILIKE '%' || p_search || '%'
    OR p.last_name ILIKE '%' || p_search || '%'
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
