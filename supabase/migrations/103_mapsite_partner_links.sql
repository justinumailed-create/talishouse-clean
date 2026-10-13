-- 103: Partner-linked Mapsites (Ralf). A superadmin links two FAST Codes /
-- Mapsites as partners; each linked Mapsite shows a button to the other.
-- Pairs are stored sorted (fast_code_a < fast_code_b, lower-case) so a pair is
-- unique regardless of order. More than two Mapsites can be linked by adding
-- several pairs. Reads/writes go through server code (service role); RLS is on
-- and anon/authenticated may only read (links are shown on public Mapsites).

create table if not exists public.mapsite_partner_links (
  id uuid primary key default gen_random_uuid(),
  fast_code_a text not null check (fast_code_a = lower(btrim(fast_code_a)) and fast_code_a <> ''),
  fast_code_b text not null check (fast_code_b = lower(btrim(fast_code_b)) and fast_code_b <> ''),
  created_by text,
  created_at timestamptz not null default now(),
  constraint mapsite_partner_links_order check (fast_code_a < fast_code_b),
  constraint mapsite_partner_links_pair unique (fast_code_a, fast_code_b)
);

create index if not exists mapsite_partner_links_b_idx on public.mapsite_partner_links (fast_code_b);

alter table public.mapsite_partner_links enable row level security;

revoke all on table public.mapsite_partner_links from anon, authenticated;
grant select on table public.mapsite_partner_links to anon, authenticated;

drop policy if exists mapsite_partner_links_public_read on public.mapsite_partner_links;
create policy mapsite_partner_links_public_read
  on public.mapsite_partner_links
  for select
  to anon, authenticated
  using (true);
