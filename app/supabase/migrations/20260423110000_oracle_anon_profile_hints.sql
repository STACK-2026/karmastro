-- Store profile hints that a user drops in anonymous oracle chats so we can
-- rehydrate their account at signup time (see edge function claim-anon-session).
-- Keys are session_id (one row per anon session), values are partial profile
-- fields detected by the oracle at conversation time (rule 15 of BASE_PROMPT).

CREATE TABLE IF NOT EXISTS public.oracle_anon_profile_hints (
  session_id   text PRIMARY KEY,
  first_name   text,
  last_name    text,
  birth_date   text,        -- ISO yyyy-mm-dd when confident
  birth_time   text,        -- HH:MM when confident
  birth_place  text,
  gender       text,
  raw_hints    jsonb DEFAULT '{}'::jsonb,   -- anything else Claude extracted
  hit_count    integer NOT NULL DEFAULT 1,  -- how many turns refined these hints
  locale       text,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  claimed_at   timestamptz,                 -- set by claim-anon-session on merge
  claimed_by   uuid                         -- the user_id that claimed this session
);

CREATE INDEX IF NOT EXISTS oracle_anon_profile_hints_updated_at_idx
  ON public.oracle_anon_profile_hints (updated_at DESC);

CREATE INDEX IF NOT EXISTS oracle_anon_profile_hints_claimed_by_idx
  ON public.oracle_anon_profile_hints (claimed_by)
  WHERE claimed_by IS NOT NULL;

-- RLS : only service_role writes (via edge functions), users can read
-- their own claimed row.
ALTER TABLE public.oracle_anon_profile_hints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own claimed hints"
  ON public.oracle_anon_profile_hints
  FOR SELECT
  TO authenticated
  USING (claimed_by = auth.uid());

-- Service role bypasses RLS , no policy needed for it.
