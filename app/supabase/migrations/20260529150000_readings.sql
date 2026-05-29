-- readings : lectures karmiques achetées à l'acte, accès par token sans compte
-- (transactionnel one-shot, cf. docs/superpowers/specs/2026-05-29-lecture-karmique-transactionnelle-design.md)
create table if not exists public.readings (
  id                uuid primary key default gen_random_uuid(),
  token             text unique not null,
  email             text,
  tool_type         text not null,
  inputs_json       jsonb not null,
  content           text,
  locale            text not null default 'fr',
  status            text not null default 'pending', -- pending | ready | error
  stripe_session_id text,
  user_id           uuid references auth.users(id),
  created_at        timestamptz not null default now()
);
create index if not exists readings_token_idx on public.readings(token);

-- RLS activé, AUCUNE policy anon : tout accès passe par les Edge Functions (service key).
alter table public.readings enable row level security;
