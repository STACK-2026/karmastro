-- Enable extensions required by the daily horoscope cron
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule daily send at 05:00 UTC = 07:00 Paris CEST (summer) / 06:00 Paris CET (winter)
-- Drop then recreate to make this migration idempotent.
SELECT cron.unschedule('send-daily-horoscope') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-daily-horoscope'
);

SELECT cron.schedule(
  'send-daily-horoscope',
  '0 5 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/send-daily-horoscope',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $cron$
);
