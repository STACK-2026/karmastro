-- Cache du theme natal calcule par le Engine Swiss Ephemeris
-- Evite de recalculer a chaque chargement de page (l'engine prend 300-800ms)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS natal_chart_json JSONB,
  ADD COLUMN IF NOT EXISTS natal_chart_computed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS birth_latitude NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS birth_longitude NUMERIC(9, 6);

CREATE INDEX IF NOT EXISTS idx_profiles_chart_computed ON public.profiles(natal_chart_computed_at) WHERE natal_chart_json IS NOT NULL;

-- RPC : retourne le theme natal du user courant (cache, recalcul si expire ou force)
CREATE OR REPLACE FUNCTION public.get_my_natal_chart()
RETURNS JSONB AS $$
DECLARE
  v_chart JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT natal_chart_json INTO v_chart
  FROM public.profiles
  WHERE user_id = auth.uid() LIMIT 1;

  RETURN COALESCE(v_chart, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_my_natal_chart() TO authenticated;

-- RPC : upsert du theme natal (appele par la edge function get-natal-chart)
CREATE OR REPLACE FUNCTION public.save_natal_chart(p_chart JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
  SET natal_chart_json = p_chart,
      natal_chart_computed_at = now()
  WHERE user_id = auth.uid();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.save_natal_chart(JSONB) TO authenticated;
