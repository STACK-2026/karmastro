-- Track which guide each conversation belongs to so oracle-history can scope
-- memory recall to the guide the user is currently talking to (Sibylle vs
-- Orion vs Séléné vs Pythia have very different voices, mixing their threads
-- back into the same system prompt would be confusing).
ALTER TABLE public.oracle_conversations
  ADD COLUMN IF NOT EXISTS guide text;

CREATE INDEX IF NOT EXISTS oracle_conversations_session_guide_idx
  ON public.oracle_conversations (session_id, guide, updated_at DESC)
  WHERE user_id IS NULL;

CREATE INDEX IF NOT EXISTS oracle_conversations_user_guide_idx
  ON public.oracle_conversations (user_id, guide, updated_at DESC)
  WHERE user_id IS NOT NULL;
