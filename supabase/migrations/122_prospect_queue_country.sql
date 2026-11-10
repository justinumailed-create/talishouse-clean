-- Country on the sourcing review queue, and a hold decision.
-- Existing rows use Canadian province codes (NL, PE, NB, QC, ON, …) and
-- backfill to CA. US state codes backfill to US. Nothing is deleted.

alter table public.prospect_queue
  add column if not exists country text;

update public.prospect_queue
set country = case
  when upper(btrim(province)) in (
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
    'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
    'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
  ) then 'US'
  else 'CA'
end
where country is null;

alter table public.prospect_queue
  alter column country set default 'CA';

alter table public.prospect_queue
  alter column country set not null;

alter table public.prospect_queue
  drop constraint if exists prospect_queue_country_check;

alter table public.prospect_queue
  add constraint prospect_queue_country_check check (country in ('CA', 'US'));

comment on column public.prospect_queue.country is
  'Market country: CA or US. Existing rows are backfilled from the province (Canadian provinces → CA).';

alter table public.prospect_queue
  drop constraint if exists prospect_queue_status_check;

alter table public.prospect_queue
  add constraint prospect_queue_status_check
  check (status in ('pending', 'approved', 'rejected', 'on_hold'));

create index if not exists prospect_queue_country_status_idx
  on public.prospect_queue (country, status, created_at desc);
