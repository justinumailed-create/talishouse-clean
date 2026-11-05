-- Prospect FAST Codes come from decision-maker initials only (never brokerage words).
alter table public.prospect_queue
  add column if not exists contact_first_name text,
  add column if not exists contact_last_name text,
  add column if not exists contact_position text,
  add column if not exists contact_phone text,
  add column if not exists contact_email text;

comment on column public.prospect_queue.contact_first_name is
  'Decision maker given name(s); prospect FAST Codes use these initials, never brokerage words.';
comment on column public.prospect_queue.contact_last_name is
  'Decision maker family name; prospect FAST Codes use these initials, never brokerage words.';
comment on column public.prospect_queue.proposed_code is
  'Person-initials FAST Code from decision maker first+last name only. Null when the name is missing (Code pending).';
