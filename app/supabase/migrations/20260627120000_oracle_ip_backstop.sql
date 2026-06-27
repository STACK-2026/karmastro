-- Backstop IP pour le comptage Oracle anonyme.
-- Un anonyme peut vider localStorage -> nouveau sessionId -> compteur remis a zero.
-- Ce plafond par IP/jour limite l'abus sans bloquer l'usage legitime.
create table if not exists public.oracle_ip_usage (
  ip text not null,
  usage_date date not null default current_date,
  message_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (ip, usage_date)
);

alter table public.oracle_ip_usage enable row level security;
-- Pas de policy : acces service_role uniquement (RLS bloque anon/auth par defaut).

create or replace function public.bump_oracle_ip(p_ip text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if p_ip is null or length(p_ip) = 0 then
    return 0;
  end if;
  insert into public.oracle_ip_usage (ip, usage_date, message_count)
  values (p_ip, current_date, 1)
  on conflict (ip, usage_date)
  do update set
    message_count = public.oracle_ip_usage.message_count + 1,
    updated_at = now()
  returning message_count into v_count;
  return v_count;
end;
$$;
