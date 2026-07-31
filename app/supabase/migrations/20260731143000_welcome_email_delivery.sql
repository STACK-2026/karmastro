-- One idempotent welcome delivery per authenticated account.
-- No client policy is created: only service-role Edge Functions may read or
-- mutate this ledger.
CREATE TABLE IF NOT EXISTS public.welcome_email_deliveries (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  locale TEXT NOT NULL DEFAULT 'fr-FR'
    CHECK (locale IN (
      'fr-FR','en-US','es-ES','es-MX','de-DE','it-IT','pt-BR','nl-NL',
      'ja-JP','ko-KR','zh-Hans','ar','tr-TR','pl-PL','ru-RU','uk-UA',
      'cs-CZ','hu-HU','ro-RO','sv-SE','da-DK','nb-NO','fi-FI','el-GR',
      'th-TH','vi-VN','id-ID','ms-MY'
    )),
  first_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','failed')),
  attempts INTEGER NOT NULL DEFAULT 1 CHECK (attempts > 0),
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.welcome_email_deliveries ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_welcome_email_delivery_status
  ON public.welcome_email_deliveries(status, claimed_at);

-- Seed the ledger from proven historical successes before the new client path
-- goes live. This prevents a recent account that already received its welcome
-- from receiving another one on its next SIGNED_IN event.
INSERT INTO public.welcome_email_deliveries (
  user_id,
  locale,
  first_name,
  status,
  attempts,
  claimed_at,
  sent_at,
  last_error
)
SELECT
  users.id,
  CASE lower(replace(coalesce(profiles.language, ''), '_', '-'))
    WHEN 'fr' THEN 'fr-FR'
    WHEN 'fr-fr' THEN 'fr-FR'
    WHEN 'en' THEN 'en-US'
    WHEN 'en-us' THEN 'en-US'
    WHEN 'es' THEN 'es-ES'
    WHEN 'es-es' THEN 'es-ES'
    WHEN 'es-mx' THEN 'es-MX'
    WHEN 'de' THEN 'de-DE'
    WHEN 'de-de' THEN 'de-DE'
    WHEN 'it' THEN 'it-IT'
    WHEN 'it-it' THEN 'it-IT'
    WHEN 'pt' THEN 'pt-BR'
    WHEN 'pt-br' THEN 'pt-BR'
    WHEN 'nl' THEN 'nl-NL'
    WHEN 'nl-nl' THEN 'nl-NL'
    WHEN 'ja' THEN 'ja-JP'
    WHEN 'ja-jp' THEN 'ja-JP'
    WHEN 'ko' THEN 'ko-KR'
    WHEN 'ko-kr' THEN 'ko-KR'
    WHEN 'zh' THEN 'zh-Hans'
    WHEN 'zh-hans' THEN 'zh-Hans'
    WHEN 'zh-cn' THEN 'zh-Hans'
    WHEN 'ar' THEN 'ar'
    WHEN 'tr' THEN 'tr-TR'
    WHEN 'tr-tr' THEN 'tr-TR'
    WHEN 'pl' THEN 'pl-PL'
    WHEN 'pl-pl' THEN 'pl-PL'
    WHEN 'ru' THEN 'ru-RU'
    WHEN 'ru-ru' THEN 'ru-RU'
    WHEN 'uk' THEN 'uk-UA'
    WHEN 'uk-ua' THEN 'uk-UA'
    WHEN 'cs' THEN 'cs-CZ'
    WHEN 'cs-cz' THEN 'cs-CZ'
    WHEN 'hu' THEN 'hu-HU'
    WHEN 'hu-hu' THEN 'hu-HU'
    WHEN 'ro' THEN 'ro-RO'
    WHEN 'ro-ro' THEN 'ro-RO'
    WHEN 'sv' THEN 'sv-SE'
    WHEN 'sv-se' THEN 'sv-SE'
    WHEN 'da' THEN 'da-DK'
    WHEN 'da-dk' THEN 'da-DK'
    WHEN 'no' THEN 'nb-NO'
    WHEN 'nb' THEN 'nb-NO'
    WHEN 'nb-no' THEN 'nb-NO'
    WHEN 'fi' THEN 'fi-FI'
    WHEN 'fi-fi' THEN 'fi-FI'
    WHEN 'el' THEN 'el-GR'
    WHEN 'el-gr' THEN 'el-GR'
    WHEN 'th' THEN 'th-TH'
    WHEN 'th-th' THEN 'th-TH'
    WHEN 'vi' THEN 'vi-VN'
    WHEN 'vi-vn' THEN 'vi-VN'
    WHEN 'id' THEN 'id-ID'
    WHEN 'id-id' THEN 'id-ID'
    WHEN 'ms' THEN 'ms-MY'
    WHEN 'ms-my' THEN 'ms-MY'
    ELSE 'fr-FR'
  END,
  profiles.first_name,
  'sent',
  1,
  delivered.created_at,
  delivered.created_at,
  NULL
FROM auth.users AS users
JOIN public.profiles AS profiles ON profiles.user_id = users.id
CROSS JOIN LATERAL (
  SELECT email_log.created_at
  FROM public.email_log AS email_log
  WHERE email_log.type = 'welcome'
    AND email_log.status = 'sent'
    AND lower(email_log.recipient) = lower(users.email)
  ORDER BY email_log.created_at DESC
  LIMIT 1
) AS delivered
ON CONFLICT (user_id) DO NOTHING;

DROP TRIGGER IF EXISTS update_welcome_email_deliveries_updated_at
  ON public.welcome_email_deliveries;

CREATE OR REPLACE FUNCTION public.set_welcome_email_delivery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE TRIGGER update_welcome_email_deliveries_updated_at
  BEFORE UPDATE ON public.welcome_email_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.set_welcome_email_delivery_updated_at();

-- Profile creation remains synchronous and safe. Welcome delivery now starts
-- only after an authenticated SIGNED_IN event, where the app locale is known.
-- This removes the obsolete direct Edge Function call and its stale token.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
