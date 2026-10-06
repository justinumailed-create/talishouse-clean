-- Owner Dashboard → Logo & Card Editor: left-card partner name + tagline overrides.
-- Additive only: two nullable columns with length limits (NULL = use the default).
alter table public.mapsite_owner_customizations
  add column if not exists partner_name text,
  add column if not exists partner_tagline text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'mapsite_owner_customizations_partner_name_len'
  ) then
    alter table public.mapsite_owner_customizations
      add constraint mapsite_owner_customizations_partner_name_len
      check (partner_name is null or char_length(partner_name) between 1 and 60);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'mapsite_owner_customizations_partner_tagline_len'
  ) then
    alter table public.mapsite_owner_customizations
      add constraint mapsite_owner_customizations_partner_tagline_len
      check (partner_tagline is null or char_length(partner_tagline) between 1 and 140);
  end if;
end $$;
