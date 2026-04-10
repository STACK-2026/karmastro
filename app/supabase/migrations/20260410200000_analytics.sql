-- Analytics : tracking complet site + app (pages vues, sessions, attribution, events)

-- 1. page_views : chaque vue de page, app ET site
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  surface TEXT NOT NULL CHECK (surface IN ('site', 'app')),
  path TEXT NOT NULL,
  title TEXT,
  referrer TEXT,
  referrer_domain TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  user_agent TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  locale TEXT,
  country_code TEXT,
  time_on_page_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON public.page_views(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON public.page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_surface ON public.page_views(surface);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut insérer (tracking anonyme)
DROP POLICY IF EXISTS "anyone_insert_page_views" ON public.page_views;
CREATE POLICY "anyone_insert_page_views" ON public.page_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Lecture réservée aux admins via RPC (pas de SELECT direct)
GRANT INSERT ON public.page_views TO anon, authenticated;

-- 2. analytics_events : events custom (clics, conversions, oracle_sent, checkout_started, etc.)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  surface TEXT NOT NULL CHECK (surface IN ('site', 'app')),
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events(created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_insert_analytics_events" ON public.analytics_events;
CREATE POLICY "anyone_insert_analytics_events" ON public.analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON public.analytics_events TO anon, authenticated;

-- 3. user_attribution : first-touch UTM attribution (une ligne par user_id)
CREATE TABLE IF NOT EXISTS public.user_attribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  landing_page TEXT,
  referrer TEXT,
  referrer_domain TEXT,
  first_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_attribution_source ON public.user_attribution(utm_source);

ALTER TABLE public.user_attribution ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_insert_own_attribution" ON public.user_attribution;
CREATE POLICY "users_insert_own_attribution" ON public.user_attribution
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_read_own_attribution" ON public.user_attribution;
CREATE POLICY "users_read_own_attribution" ON public.user_attribution
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.user_attribution TO authenticated;
