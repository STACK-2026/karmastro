-- Avis sur les lectures payantes, pour le dashboard admin (qui pense quoi).
-- Remonte note + commentaire + opt-in publication + email acheteur.
CREATE OR REPLACE FUNCTION public.admin_get_reading_reviews(
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  token UUID,
  email TEXT,
  tool_type TEXT,
  rating SMALLINT,
  feedback TEXT,
  feedback_text TEXT,
  feedback_public BOOLEAN,
  feedback_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    r.token, r.email::TEXT, r.tool_type, r.rating, r.feedback,
    r.feedback_text, r.feedback_public, r.feedback_at, r.created_at
  FROM public.readings r
  WHERE r.rating IS NOT NULL OR r.feedback IS NOT NULL OR r.feedback_text IS NOT NULL
  ORDER BY COALESCE(r.feedback_at, r.created_at) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_get_reading_reviews(INTEGER) TO authenticated;
