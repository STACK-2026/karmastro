-- Monétisation Stripe : tiers, crédits, usage quotidien Oracle

-- 1. Profiles : ajouter colonnes subscription + crédits
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'eveil',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0;

-- Constraint pour les tiers valides
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('eveil', 'etoile', 'ame_soeur', 'cosmos'));

-- Index perf
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);

-- 2. Oracle daily usage : compteur quotidien par user pour la limitation gratuite
CREATE TABLE IF NOT EXISTS public.oracle_daily_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, usage_date),
  UNIQUE (session_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_oracle_daily_usage_user_date ON public.oracle_daily_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_oracle_daily_usage_session_date ON public.oracle_daily_usage(session_id, usage_date);

ALTER TABLE public.oracle_daily_usage ENABLE ROW LEVEL SECURITY;

-- RLS : un user peut voir et incrémenter son propre compteur
CREATE POLICY "Users can view own usage"
  ON public.oracle_daily_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Credit transactions : historique des crédits achetés et consommés
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'consume', 'bonus', 'referral_reward', 'refund')),
  description TEXT,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON public.credit_transactions(user_id, created_at DESC);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit transactions"
  ON public.credit_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Subscription events : journal des événements webhook pour debug + audit
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payload JSONB,
  processed BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON public.stripe_events(type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_user ON public.stripe_events(user_id) WHERE user_id IS NOT NULL;

-- Pas de RLS SELECT public (admin only via service role)

-- 5. Helper function : check si user a accès illimité à l'Oracle
CREATE OR REPLACE FUNCTION public.has_unlimited_oracle(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_status TEXT;
  v_period_end TIMESTAMPTZ;
BEGIN
  SELECT subscription_tier, subscription_status, subscription_period_end
  INTO v_tier, v_status, v_period_end
  FROM public.profiles
  WHERE user_id = p_user_id;

  -- Étoile et Cosmos ont accès illimité si actifs
  IF v_tier IN ('etoile', 'cosmos') AND v_status = 'active' THEN
    IF v_period_end IS NULL OR v_period_end > now() THEN
      RETURN TRUE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION public.has_unlimited_oracle(UUID) TO authenticated;

-- 6. Helper function : increment usage counter + return new count
CREATE OR REPLACE FUNCTION public.increment_oracle_usage(
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS TABLE(message_count INTEGER, unlimited BOOLEAN) AS $$
DECLARE
  v_count INTEGER;
  v_unlimited BOOLEAN;
BEGIN
  -- Check unlimited status
  IF p_user_id IS NOT NULL THEN
    v_unlimited := public.has_unlimited_oracle(p_user_id);
  ELSE
    v_unlimited := FALSE;
  END IF;

  -- Upsert the counter
  IF p_user_id IS NOT NULL THEN
    INSERT INTO public.oracle_daily_usage (user_id, usage_date, message_count)
    VALUES (p_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET message_count = public.oracle_daily_usage.message_count + 1, updated_at = now()
    RETURNING public.oracle_daily_usage.message_count INTO v_count;
  ELSIF p_session_id IS NOT NULL THEN
    INSERT INTO public.oracle_daily_usage (session_id, usage_date, message_count)
    VALUES (p_session_id, CURRENT_DATE, 1)
    ON CONFLICT (session_id, usage_date)
    DO UPDATE SET message_count = public.oracle_daily_usage.message_count + 1, updated_at = now()
    RETURNING public.oracle_daily_usage.message_count INTO v_count;
  ELSE
    v_count := 0;
  END IF;

  RETURN QUERY SELECT v_count, v_unlimited;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.increment_oracle_usage(UUID, TEXT) TO anon, authenticated;

-- 7. Helper function : consume a credit atomically
CREATE OR REPLACE FUNCTION public.consume_credit(p_user_id UUID, p_description TEXT DEFAULT 'Oracle consultation')
RETURNS BOOLEAN AS $$
DECLARE
  v_current INTEGER;
  v_new INTEGER;
BEGIN
  SELECT credits INTO v_current FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;

  IF v_current IS NULL OR v_current <= 0 THEN
    RETURN FALSE;
  END IF;

  v_new := v_current - 1;
  UPDATE public.profiles SET credits = v_new WHERE user_id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, balance_after, type, description)
  VALUES (p_user_id, -1, v_new, 'consume', p_description);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.consume_credit(UUID, TEXT) TO authenticated;
