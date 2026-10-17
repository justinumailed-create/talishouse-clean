-- 109 (Ralf, Oct 17 2026)
-- 1) PIN categories: every PIN (main + additional) can carry a category so the
--    Mapsite "Select Category" filter can hide the others. Five mandatory
--    categories (residential, vacant-land, investment, commercial, luxury) are
--    stored by id; up to five custom categories per Root Mapsite are stored as
--    "custom:<label>".
-- 2) Root ↔ Derivative: a partner link can name its Root side. A Derivative
--    Mapsite may belong to only one Root. The Root's map shows the Derivative
--    holders' PINs. Existing links keep working (root_fast_code null = plain
--    partner pair); DC06 (paid Root Account) ↔ DC05 is backfilled.

alter table public.mapsite_additional_pins
  add column if not exists category text;
alter table public.mapsite_additional_pins
  drop constraint if exists mapsite_additional_pins_category_len;
alter table public.mapsite_additional_pins
  add constraint mapsite_additional_pins_category_len
  check (category is null or char_length(category) between 1 and 48);

alter table public.mapsites
  add column if not exists pin_category text;
alter table public.mapsites
  drop constraint if exists mapsites_pin_category_len;
alter table public.mapsites
  add constraint mapsites_pin_category_len
  check (pin_category is null or char_length(pin_category) between 1 and 48);

create table if not exists public.mapsite_pin_categories (
  mapsite_id uuid primary key references public.mapsites(id) on delete cascade,
  fast_code text not null check (fast_code = lower(btrim(fast_code)) and fast_code <> ''),
  custom_categories text[] not null default '{}',
  updated_at timestamptz not null default now(),
  constraint mapsite_pin_categories_max5 check (cardinality(custom_categories) <= 5)
);
alter table public.mapsite_pin_categories enable row level security;
revoke all on table public.mapsite_pin_categories from anon, authenticated;
grant select on table public.mapsite_pin_categories to anon, authenticated;
drop policy if exists mapsite_pin_categories_public_read on public.mapsite_pin_categories;
create policy mapsite_pin_categories_public_read
  on public.mapsite_pin_categories for select to anon, authenticated using (true);

alter table public.mapsite_partner_links
  add column if not exists root_fast_code text;
alter table public.mapsite_partner_links
  drop constraint if exists mapsite_partner_links_root_side;
alter table public.mapsite_partner_links
  add constraint mapsite_partner_links_root_side
  check (root_fast_code is null or root_fast_code = fast_code_a or root_fast_code = fast_code_b);
alter table public.mapsite_partner_links
  add column if not exists derivative_fast_code text
  generated always as (
    case
      when root_fast_code = fast_code_a then fast_code_b
      when root_fast_code = fast_code_b then fast_code_a
    end
  ) stored;
create unique index if not exists mapsite_partner_links_one_root_per_derivative
  on public.mapsite_partner_links (derivative_fast_code)
  where derivative_fast_code is not null;
create index if not exists mapsite_partner_links_root_idx
  on public.mapsite_partner_links (root_fast_code)
  where root_fast_code is not null;

update public.mapsite_partner_links
   set root_fast_code = 'dc06'
 where fast_code_a = 'dc05' and fast_code_b = 'dc06' and root_fast_code is null;
