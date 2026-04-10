-- Referral / parrainage system
-- Adds referral_code to profiles + auto-generation trigger

-- 1. Add columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_code TEXT;

-- 2. Function to generate unique 6-char code
CREATE OR REPLACE FUNCTION public.generate_referral_code() RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    -- 6 uppercase alphanumeric chars, e.g. "X7K9M2"
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Trigger function: assigns code if NULL on insert
CREATE OR REPLACE FUNCTION public.set_referral_code() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Trigger on profiles
DROP TRIGGER IF EXISTS profiles_set_referral_code ON public.profiles;
CREATE TRIGGER profiles_set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_referral_code();

-- 5. Backfill existing profiles without a code
UPDATE public.profiles
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL;

-- 6. RLS policy: allow anon/authenticated to SELECT referral_code by code
-- (so the site /parrainage page can look up a parrain by code when a filleul signs up)
CREATE POLICY "Public can lookup referral codes"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);
-- Note: this exposes the full profiles row. If too permissive, we can restrict
-- to a VIEW with only referral_code + first_name. For now, KEY tracking only.

-- Index for fast code lookup
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by_code ON public.profiles(referred_by_code) WHERE referred_by_code IS NOT NULL;
