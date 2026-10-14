-- Mapsite batch: editable left-card fields, gated contract + in-app e-signature.
-- Additive only.
--
-- 1) mapsite_owner_customizations: card title (e.g. "TSplits"), address,
--    telephone number and the per-Mapsite contract text (admin/owner editable).
-- 2) mapsite_contract_access_codes: codes agents generate so a visitor can
--    open the contract page for one FAST Code. Only a SHA-256 hash is stored.
-- 3) mapsite_contract_access_log: every generate / unlock / fail / revoke / sign.
-- 4) mapsite_contract_signatures: signed records (typed or drawn signature,
--    name, email, timestamp, IP, user agent, contract hash + snapshot).
-- 5) Private storage bucket `mapsite-contracts` for the signed record files.
-- All writes go through server actions with the service role. No public policies.

alter table public.mapsite_owner_customizations
  add column if not exists card_title text,
  add column if not exists card_address text,
  add column if not exists card_phone text,
  add column if not exists contract_text text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'mapsite_owner_customizations_card_title_len') then
    alter table public.mapsite_owner_customizations
      add constraint mapsite_owner_customizations_card_title_len
      check (card_title is null or char_length(card_title) between 1 and 60);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'mapsite_owner_customizations_card_address_len') then
    alter table public.mapsite_owner_customizations
      add constraint mapsite_owner_customizations_card_address_len
      check (card_address is null or char_length(card_address) between 1 and 160);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'mapsite_owner_customizations_card_phone_len') then
    alter table public.mapsite_owner_customizations
      add constraint mapsite_owner_customizations_card_phone_len
      check (card_phone is null or char_length(card_phone) between 3 and 40);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'mapsite_owner_customizations_contract_text_len') then
    alter table public.mapsite_owner_customizations
      add constraint mapsite_owner_customizations_contract_text_len
      check (contract_text is null or char_length(contract_text) between 1 and 20000);
  end if;
end $$;

create table if not exists public.mapsite_contract_access_codes (
  id uuid primary key default gen_random_uuid(),
  fast_code text not null,
  code_hash text not null unique,
  code_hint text not null,
  label text,
  created_by text not null,
  created_by_agent_id uuid,
  expires_at timestamptz not null,
  max_uses integer not null default 25 check (max_uses between 1 and 1000),
  use_count integer not null default 0,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_mapsite_contract_codes_fast_code
  on public.mapsite_contract_access_codes (lower(fast_code), created_at desc);
alter table public.mapsite_contract_access_codes enable row level security;

create table if not exists public.mapsite_contract_access_log (
  id bigint generated always as identity primary key,
  code_id uuid references public.mapsite_contract_access_codes(id) on delete set null,
  fast_code text not null,
  event text not null check (event in ('generated','unlocked','failed','revoked','signed')),
  actor text,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_mapsite_contract_log_fast_code
  on public.mapsite_contract_access_log (lower(fast_code), created_at desc);
create index if not exists idx_mapsite_contract_log_ip_failed
  on public.mapsite_contract_access_log (ip, created_at desc) where event = 'failed';
alter table public.mapsite_contract_access_log enable row level security;

create table if not exists public.mapsite_contract_signatures (
  id uuid primary key default gen_random_uuid(),
  mapsite_id uuid references public.mapsites(id) on delete set null,
  fast_code text not null,
  code_id uuid references public.mapsite_contract_access_codes(id) on delete set null,
  signer_name text not null check (char_length(signer_name) between 2 and 120),
  signer_email text check (signer_email is null or char_length(signer_email) <= 254),
  signature_type text not null check (signature_type in ('typed','drawn')),
  signature_text text,
  signature_image text,
  contract_text text not null,
  contract_sha256 text not null,
  locale text,
  ip text,
  user_agent text,
  record_path text,
  provider text not null default 'in-app',
  signed_at timestamptz not null default now()
);
create index if not exists idx_mapsite_contract_signatures_fast_code
  on public.mapsite_contract_signatures (lower(fast_code), signed_at desc);
alter table public.mapsite_contract_signatures enable row level security;

insert into storage.buckets (id, name, public)
values ('mapsite-contracts', 'mapsite-contracts', false)
on conflict (id) do nothing;
