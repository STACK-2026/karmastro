-- Oracle feedback table
-- Collects user ratings + optional text on Oracle responses
-- Supports both authenticated and anonymous users (via session_id fallback)

CREATE TABLE IF NOT EXISTS public.oracle_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  guide TEXT NOT NULL CHECK (guide IN ('sibylle', 'orion', 'selene', 'pythia')),
  rating SMALLINT NOT NULL CHECK (rating IN (1, 2, 3)),
  text TEXT,
  user_message TEXT,
  assistant_message TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.oracle_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone (auth or anon) can insert feedback
CREATE POLICY "anon_insert_feedback"
  ON public.oracle_feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Grants required for RLS to work with anon/authenticated roles
GRANT INSERT ON public.oracle_feedback TO anon, authenticated;
GRANT SELECT ON public.oracle_feedback TO authenticated;

-- Users can read their own feedback; anon cannot read
CREATE POLICY "Users can view their own oracle feedback"
  ON public.oracle_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes for dashboard aggregation
CREATE INDEX IF NOT EXISTS idx_oracle_feedback_guide ON public.oracle_feedback(guide);
CREATE INDEX IF NOT EXISTS idx_oracle_feedback_created_at ON public.oracle_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oracle_feedback_user_id ON public.oracle_feedback(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_oracle_feedback_rating ON public.oracle_feedback(rating);
