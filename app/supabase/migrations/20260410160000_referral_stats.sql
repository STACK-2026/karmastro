-- Referral logic v2: resolution, validation, stats, badges
-- Builds on 20260410150000_referral_codes.sql

-- 1. Add referred_by_user_id (resolved from code)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Trigger: resolve referred_by_code → referred_by_user_id, block self-referral
CREATE OR REPLACE FUNCTION public.resolve_referral_code() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referred_by_code IS NOT NULL THEN
    SELECT user_id INTO NEW.referred_by_user_id
    FROM public.profiles
    WHERE referral_code = NEW.referred_by_code
    LIMIT 1;

    -- Anti self-referral
    IF NEW.referred_by_user_id = NEW.user_id THEN
      NEW.referred_by_user_id := NULL;
      NEW.referred_by_code := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS profiles_resolve_referral ON public.profiles;
CREATE TRIGGER profiles_resolve_referral
  BEFORE INSERT OR UPDATE OF referred_by_code ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.resolve_referral_code();

-- 3. Backfill existing referred_by_code to referred_by_user_id
UPDATE public.profiles p
SET referred_by_user_id = (
  SELECT user_id FROM public.profiles p2 WHERE p2.referral_code = p.referred_by_code LIMIT 1
)
WHERE p.referred_by_code IS NOT NULL AND p.referred_by_user_id IS NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by_user_id
  ON public.profiles(referred_by_user_id)
  WHERE referred_by_user_id IS NOT NULL;

-- 4. RPC: get referral stats for a user
-- validated = filleul inscrit depuis plus de 7 jours (comptabilisé définitivement)
-- pending = filleul inscrit dans les 7 derniers jours (période de grâce)
CREATE OR REPLACE FUNCTION public.get_referral_stats(p_user_id UUID)
RETURNS TABLE(validated_count BIGINT, pending_count BIGINT, total_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE p.created_at < now() - interval '7 days')::BIGINT AS validated_count,
    COUNT(*) FILTER (WHERE p.created_at >= now() - interval '7 days')::BIGINT AS pending_count,
    COUNT(*)::BIGINT AS total_count
  FROM public.profiles p
  WHERE p.referred_by_user_id = p_user_id
    AND p.user_id != p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_referral_stats(UUID) TO authenticated;

-- 5. Badges computation based on validated filleuls
CREATE OR REPLACE FUNCTION public.update_user_badges(p_user_id UUID) RETURNS TEXT[] AS $$
DECLARE
  v_count BIGINT;
  v_badges TEXT[] := '{}';
BEGIN
  SELECT validated_count INTO v_count FROM public.get_referral_stats(p_user_id);

  IF v_count >= 3 THEN v_badges := array_append(v_badges, 'eclaireur_cosmique'); END IF;
  IF v_count >= 10 THEN v_badges := array_append(v_badges, 'guide_des_etoiles'); END IF;
  IF v_count >= 25 THEN v_badges := array_append(v_badges, 'constellation_vivante'); END IF;
  IF v_count >= 100 THEN v_badges := array_append(v_badges, 'nebuleuse_maitresse'); END IF;

  UPDATE public.profiles
  SET badges = v_badges
  WHERE user_id = p_user_id;

  RETURN v_badges;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.update_user_badges(UUID) TO authenticated;

-- 6. Top parrains view (for Hall des Constellations future page)
CREATE OR REPLACE VIEW public.top_parrains AS
SELECT
  p.first_name,
  p.referral_code,
  COUNT(f.id) FILTER (WHERE f.created_at < now() - interval '7 days') AS validated_filleuls,
  COUNT(f.id) AS total_filleuls,
  p.badges,
  MIN(f.created_at) AS first_filleul_at
FROM public.profiles p
LEFT JOIN public.profiles f ON f.referred_by_user_id = p.user_id
WHERE p.referral_code IS NOT NULL
GROUP BY p.user_id, p.first_name, p.referral_code, p.badges
HAVING COUNT(f.id) > 0
ORDER BY validated_filleuls DESC, total_filleuls DESC
LIMIT 100;

GRANT SELECT ON public.top_parrains TO anon, authenticated;
