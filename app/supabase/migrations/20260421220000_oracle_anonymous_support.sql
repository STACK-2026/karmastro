-- Oracle anonymous support: allow the Oracle to persist conversations and
-- messages for visitors who have not signed up yet. Session-based identity
-- backs unauthenticated access; authenticated users keep their auth.uid().

-- 1. Relax NOT NULL on user_id (anonymous sessions have no auth.users row)
ALTER TABLE public.oracle_conversations ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.oracle_messages ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add session_id column (the km_session_id used by the tracker)
ALTER TABLE public.oracle_conversations ADD COLUMN IF NOT EXISTS session_id text;
ALTER TABLE public.oracle_messages ADD COLUMN IF NOT EXISTS session_id text;

-- 3. Enforce at least one identifier present
ALTER TABLE public.oracle_conversations
  DROP CONSTRAINT IF EXISTS oracle_conversations_identity_check;
ALTER TABLE public.oracle_conversations
  ADD CONSTRAINT oracle_conversations_identity_check
  CHECK (user_id IS NOT NULL OR session_id IS NOT NULL);

ALTER TABLE public.oracle_messages
  DROP CONSTRAINT IF EXISTS oracle_messages_identity_check;
ALTER TABLE public.oracle_messages
  ADD CONSTRAINT oracle_messages_identity_check
  CHECK (user_id IS NOT NULL OR session_id IS NOT NULL);

-- 4. Indexes for the anonymous lookup path
CREATE INDEX IF NOT EXISTS oracle_conversations_session_id_idx
  ON public.oracle_conversations (session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS oracle_messages_session_id_idx
  ON public.oracle_messages (session_id) WHERE session_id IS NOT NULL;

-- 5. Refresh RLS policies. Authenticated users keep owner access.
-- Anonymous inserts/selects are handled by the edge function via the service
-- role, which bypasses RLS. No anonymous client-side INSERT is granted here,
-- to keep the attack surface narrow (session_id is easily forgeable).

DROP POLICY IF EXISTS "Users can insert own conversations" ON public.oracle_conversations;
CREATE POLICY "Users can insert own conversations"
  ON public.oracle_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own conversations" ON public.oracle_conversations;
CREATE POLICY "Users can view own conversations"
  ON public.oracle_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversations" ON public.oracle_conversations;
CREATE POLICY "Users can delete own conversations"
  ON public.oracle_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own messages" ON public.oracle_messages;
CREATE POLICY "Users can insert own messages"
  ON public.oracle_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own messages" ON public.oracle_messages;
CREATE POLICY "Users can view own messages"
  ON public.oracle_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
