-- Assign to Mapsite (Add Pin flow): a PIN can be tied to another Mapsite by
-- FAST Code. Agents must assign their PINs to a Broker's FAST Code; FSBO and
-- Ad Pro may also show a PIN on a Broker's Mapsite. Null = own Mapsite only.
-- Additive and backwards compatible: existing rows keep null.

alter table public.mapsite_additional_pins
  add column if not exists assigned_fast_code text;

comment on column public.mapsite_additional_pins.assigned_fast_code is
  'Lower-case FAST Code of the Broker Mapsite this PIN is assigned to (Assign to Mapsite). Null = own Mapsite only.';

create index if not exists mapsite_additional_pins_assigned_fast_code_idx
  on public.mapsite_additional_pins (assigned_fast_code)
  where assigned_fast_code is not null;
