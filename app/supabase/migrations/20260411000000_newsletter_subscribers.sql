-- Newsletter subscribers (horoscope quotidien par email, RGPD-compliant)

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  locale TEXT NOT NULL DEFAULT 'fr' CHECK (locale IN ('fr','en','es','pt','de','it','tr','pl','ru','ja','ar')),
  sign_slug TEXT CHECK (sign_slug IN (
    'belier','taureau','gemeaux','cancer','lion','vierge',
    'balance','scorpion','sagittaire','capricorne','verseau','poissons'
  )),
  source TEXT,                           -- ex: 'horoscope-belier', 'blog-numerologie', 'homepage'
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  confirmation_token TEXT UNIQUE,
  confirmed_at TIMESTAMPTZ,
  unsubscribed BOOLEAN NOT NULL DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,
  unsubscribe_token TEXT UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  last_sent_at TIMESTAMPTZ,
  send_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_locale ON public.newsletter_subscribers(locale) WHERE confirmed = true AND unsubscribed = false;
CREATE INDEX IF NOT EXISTS idx_newsletter_sign ON public.newsletter_subscribers(sign_slug) WHERE confirmed = true AND unsubscribed = false;
CREATE INDEX IF NOT EXISTS idx_newsletter_confirmed ON public.newsletter_subscribers(confirmed) WHERE confirmed = false;
CREATE INDEX IF NOT EXISTS idx_newsletter_unsub_token ON public.newsletter_subscribers(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_newsletter_confirm_token ON public.newsletter_subscribers(confirmation_token);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (INSERT with email)
DROP POLICY IF EXISTS "anyone_insert_newsletter" ON public.newsletter_subscribers;
CREATE POLICY "anyone_insert_newsletter" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- No SELECT for anon (privacy). Admin reads via RPC.
-- Service role bypasses RLS anyway.
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;

-- RPC : subscribe email with double opt-in (returns confirmation_token)
CREATE OR REPLACE FUNCTION public.newsletter_subscribe(
  p_email TEXT,
  p_locale TEXT DEFAULT 'fr',
  p_sign_slug TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL,
  p_utm_source TEXT DEFAULT NULL,
  p_utm_medium TEXT DEFAULT NULL,
  p_utm_campaign TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_token TEXT;
  v_existing RECORD;
BEGIN
  IF p_email IS NULL OR p_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_email');
  END IF;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');

  SELECT * INTO v_existing FROM public.newsletter_subscribers WHERE email = lower(p_email);

  IF v_existing IS NOT NULL THEN
    -- Already exists : reactivate if unsubscribed, or just return existing state
    IF v_existing.unsubscribed THEN
      UPDATE public.newsletter_subscribers
      SET unsubscribed = false,
          unsubscribed_at = NULL,
          confirmation_token = v_token,
          confirmed = false,
          updated_at = now()
      WHERE id = v_existing.id;
      RETURN jsonb_build_object('success', true, 'status', 'reactivated', 'token', v_token);
    ELSIF NOT v_existing.confirmed THEN
      -- Refresh confirmation token
      UPDATE public.newsletter_subscribers
      SET confirmation_token = v_token, updated_at = now()
      WHERE id = v_existing.id;
      RETURN jsonb_build_object('success', true, 'status', 'pending_confirmation', 'token', v_token);
    ELSE
      RETURN jsonb_build_object('success', true, 'status', 'already_subscribed');
    END IF;
  END IF;

  INSERT INTO public.newsletter_subscribers
    (email, locale, sign_slug, source, utm_source, utm_medium, utm_campaign, confirmation_token)
  VALUES
    (lower(p_email), p_locale, p_sign_slug, p_source, p_utm_source, p_utm_medium, p_utm_campaign, v_token);

  RETURN jsonb_build_object('success', true, 'status', 'created', 'token', v_token);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.newsletter_subscribe(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- RPC : confirm subscription via token (called from email link)
CREATE OR REPLACE FUNCTION public.newsletter_confirm(p_token TEXT) RETURNS JSONB AS $$
DECLARE
  v_row RECORD;
BEGIN
  UPDATE public.newsletter_subscribers
  SET confirmed = true,
      confirmed_at = now(),
      confirmation_token = NULL,
      updated_at = now()
  WHERE confirmation_token = p_token
  RETURNING id, email, locale INTO v_row;

  IF v_row IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_token');
  END IF;

  RETURN jsonb_build_object('success', true, 'email', v_row.email, 'locale', v_row.locale);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.newsletter_confirm(TEXT) TO anon, authenticated;

-- RPC : unsubscribe via token
CREATE OR REPLACE FUNCTION public.newsletter_unsubscribe(p_token TEXT) RETURNS JSONB AS $$
DECLARE
  v_row RECORD;
BEGIN
  UPDATE public.newsletter_subscribers
  SET unsubscribed = true, unsubscribed_at = now(), updated_at = now()
  WHERE unsubscribe_token = p_token AND unsubscribed = false
  RETURNING email INTO v_row;

  IF v_row IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_or_already_unsubscribed');
  END IF;

  RETURN jsonb_build_object('success', true, 'email', v_row.email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.newsletter_unsubscribe(TEXT) TO anon, authenticated;

-- Admin RPC : count subscribers by locale (for dashboard)
CREATE OR REPLACE FUNCTION public.admin_newsletter_stats() RETURNS JSONB AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN jsonb_build_object(
    'total', (SELECT COUNT(*) FROM public.newsletter_subscribers WHERE confirmed = true AND unsubscribed = false),
    'pending', (SELECT COUNT(*) FROM public.newsletter_subscribers WHERE confirmed = false AND unsubscribed = false),
    'unsubscribed', (SELECT COUNT(*) FROM public.newsletter_subscribers WHERE unsubscribed = true),
    'by_locale', (
      SELECT jsonb_object_agg(locale, cnt) FROM (
        SELECT locale, COUNT(*) AS cnt
        FROM public.newsletter_subscribers
        WHERE confirmed = true AND unsubscribed = false
        GROUP BY locale
      ) t
    ),
    'by_sign', (
      SELECT jsonb_object_agg(COALESCE(sign_slug, 'all'), cnt) FROM (
        SELECT sign_slug, COUNT(*) AS cnt
        FROM public.newsletter_subscribers
        WHERE confirmed = true AND unsubscribed = false
        GROUP BY sign_slug
      ) t
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_newsletter_stats() TO authenticated;
