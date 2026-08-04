-- Oracle feedback contract v1
--
-- Preserve the three historical rows while making new feedback measurable,
-- idempotent per response, and bound to the caller identity.

ALTER TABLE public.oracle_feedback
  DROP CONSTRAINT IF EXISTS oracle_feedback_guide_check;

ALTER TABLE public.oracle_feedback
  ADD CONSTRAINT oracle_feedback_guide_check
  CHECK (guide IN ('oracle', 'sibylle', 'orion', 'selene', 'pythia'));

ALTER TABLE public.oracle_feedback
  ADD COLUMN IF NOT EXISTS conversation_id UUID
    REFERENCES public.oracle_conversations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS turn_index SMALLINT,
  ADD COLUMN IF NOT EXISTS surface TEXT,
  ADD COLUMN IF NOT EXISTS locale TEXT,
  ADD COLUMN IF NOT EXISTS contract_version SMALLINT,
  ADD COLUMN IF NOT EXISTS introduced_at TIMESTAMPTZ;

ALTER TABLE public.oracle_feedback
  ADD CONSTRAINT oracle_feedback_turn_index_check
    CHECK (turn_index IS NULL OR turn_index >= 1) NOT VALID,
  ADD CONSTRAINT oracle_feedback_surface_check
    CHECK (surface IS NULL OR surface IN ('site', 'app')) NOT VALID,
  ADD CONSTRAINT oracle_feedback_locale_check
    CHECK (locale IS NULL OR char_length(locale) BETWEEN 2 AND 20) NOT VALID,
  ADD CONSTRAINT oracle_feedback_contract_version_check
    CHECK (contract_version IS NULL OR contract_version >= 1) NOT VALID,
  ADD CONSTRAINT oracle_feedback_text_length_check
    CHECK (text IS NULL OR char_length(text) <= 500) NOT VALID,
  ADD CONSTRAINT oracle_feedback_user_message_length_check
    CHECK (user_message IS NULL OR char_length(user_message) <= 500) NOT VALID,
  ADD CONSTRAINT oracle_feedback_assistant_message_length_check
    CHECK (assistant_message IS NULL OR char_length(assistant_message) <= 2000) NOT VALID;

CREATE UNIQUE INDEX IF NOT EXISTS oracle_feedback_conversation_turn_uidx
  ON public.oracle_feedback (conversation_id, turn_index)
  WHERE conversation_id IS NOT NULL AND turn_index IS NOT NULL;

DROP POLICY IF EXISTS "anon_insert_feedback" ON public.oracle_feedback;
DROP POLICY IF EXISTS "Users can insert own oracle feedback" ON public.oracle_feedback;
DROP POLICY IF EXISTS "Anonymous users can insert oracle feedback" ON public.oracle_feedback;

CREATE POLICY "Anonymous users can insert oracle feedback"
  ON public.oracle_feedback
  FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NULL
    AND session_id IS NOT NULL
    AND char_length(session_id) BETWEEN 16 AND 128
    AND guide = 'oracle'
    AND conversation_id IS NOT NULL
    AND turn_index = 1
    AND surface IN ('site', 'app')
    AND locale IS NOT NULL
    AND contract_version = 1
    AND introduced_at IS NOT NULL
    AND text IS NULL
    AND user_message IS NULL
    AND assistant_message IS NULL
  );

CREATE POLICY "Users can insert own oracle feedback"
  ON public.oracle_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND session_id IS NULL
    AND guide = 'oracle'
    AND conversation_id IS NOT NULL
    AND turn_index = 1
    AND surface IN ('site', 'app')
    AND locale IS NOT NULL
    AND contract_version = 1
    AND introduced_at IS NOT NULL
    AND text IS NULL
    AND user_message IS NULL
    AND assistant_message IS NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.oracle_conversations AS conversation
        WHERE conversation.id = conversation_id
          AND conversation.user_id = auth.uid()
      )
    )
  );
