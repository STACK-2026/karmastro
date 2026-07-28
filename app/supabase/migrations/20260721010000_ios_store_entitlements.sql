-- Canonical Apple subscription state already deployed by the verified iOS
-- release. Kept in main so clean resets match production billing semantics.

alter table public.profiles
  add column if not exists apple_subscription_status text
    check (apple_subscription_status in ('active', 'expired', 'inactive')),
  add column if not exists apple_subscription_product_id text,
  add column if not exists apple_subscription_expires_at timestamptz,
  add column if not exists apple_subscription_synced_at timestamptz;

create table if not exists public.billing_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('apple')),
  entitlement_id text not null check (entitlement_id in ('etoile')),
  product_id text,
  status text not null check (status in ('active', 'expired', 'inactive')),
  expires_at timestamptz,
  environment text check (environment is null or environment in ('SANDBOX', 'PRODUCTION')),
  synced_at timestamptz not null default now(),
  unique (user_id, provider, entitlement_id)
);

create index if not exists billing_entitlements_active_user_idx
  on public.billing_entitlements (user_id, expires_at)
  where status = 'active';

alter table public.billing_entitlements enable row level security;
revoke all on table public.billing_entitlements from public, anon, authenticated;
grant all on table public.billing_entitlements to service_role;

create table if not exists public.revenuecat_events (
  event_id text primary key,
  app_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  environment text,
  processing_status text not null default 'processing'
    check (processing_status in ('processing', 'processed', 'failed')),
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists revenuecat_events_user_received_idx
  on public.revenuecat_events (app_user_id, received_at desc);

alter table public.revenuecat_events enable row level security;
revoke all on table public.revenuecat_events from public, anon, authenticated;
grant all on table public.revenuecat_events to service_role;

create or replace function public.protect_billing_state()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' and (
    new.subscription_tier is distinct from old.subscription_tier or
    new.subscription_status is distinct from old.subscription_status or
    new.subscription_period_end is distinct from old.subscription_period_end or
    new.stripe_customer_id is distinct from old.stripe_customer_id or
    new.stripe_subscription_id is distinct from old.stripe_subscription_id or
    new.credits is distinct from old.credits or
    new.apple_subscription_status is distinct from old.apple_subscription_status or
    new.apple_subscription_product_id is distinct from old.apple_subscription_product_id or
    new.apple_subscription_expires_at is distinct from old.apple_subscription_expires_at or
    new.apple_subscription_synced_at is distinct from old.apple_subscription_synced_at
  ) then
    raise exception using errcode = '42501', message = 'billing_state_is_server_managed';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_apple_subscription_state on public.profiles;
drop trigger if exists protect_billing_state on public.profiles;
create trigger protect_billing_state
before update on public.profiles
for each row execute function public.protect_billing_state();

create or replace function public.has_unlimited_oracle(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = p_user_id
      and subscription_tier in ('etoile', 'cosmos')
      and subscription_status = 'active'
      and (subscription_period_end is null or subscription_period_end > now())
  ) or exists (
    select 1
    from public.billing_entitlements
    where user_id = p_user_id
      and provider = 'apple'
      and entitlement_id = 'etoile'
      and status = 'active'
      and (expires_at is null or expires_at > now())
  );
$$;

grant execute on function public.has_unlimited_oracle(uuid) to authenticated;

alter table public.readings
  drop constraint if exists readings_user_id_fkey;
alter table public.readings
  add constraint readings_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;
