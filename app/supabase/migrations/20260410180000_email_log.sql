-- Email log for audit trail
CREATE TABLE IF NOT EXISTS public.email_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient TEXT NOT NULL,
  type TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'skipped_no_key')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_log_recipient ON public.email_log(recipient);
CREATE INDEX IF NOT EXISTS idx_email_log_type ON public.email_log(type);
CREATE INDEX IF NOT EXISTS idx_email_log_created ON public.email_log(created_at DESC);

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
-- No public policies : only service role can read/write (via edge function)
