-- Agent Admin privileges v2 + manual (cash) FAST Code payments.
-- Additive: widens the agent_admins privilege check and adds public.manual_payments.
-- RLS on with NO anon/authenticated policies: server-side (service role) access only.

alter table public.agent_admins drop constraint if exists agent_admins_privileges_check;
alter table public.agent_admins add constraint agent_admins_privileges_check check (
  privileges <@ array[
    'mapsites', 'ebooks', 'pins', 'cash-payments',
    'talisbooks', 'build-requests', 'leads', 'agent-pages'
  ]::text[]
);

create table if not exists public.manual_payments (
  id uuid primary key default gen_random_uuid(),
  mapsite_id uuid not null,
  fast_code text not null,
  amount_cad numeric(10, 2) not null,
  method text not null default 'cash',
  paid_on date not null,
  note text,
  recorded_by text not null,
  recorded_by_agent_id uuid references public.agent_admins(id) on delete set null,
  talispros_payment_id uuid,
  previous_mapsite_status text,
  status text not null default 'recorded',
  reversed_by text,
  reversed_at timestamptz,
  reversal_note text,
  created_at timestamptz not null default now(),
  constraint manual_payments_method_check check (method in ('cash')),
  constraint manual_payments_amount_check check (amount_cad > 0 and amount_cad < 100000),
  constraint manual_payments_status_check check (status in ('recorded', 'reversed'))
);

create index if not exists manual_payments_mapsite_id_idx on public.manual_payments (mapsite_id);
create index if not exists manual_payments_created_at_idx on public.manual_payments (created_at desc);

comment on table public.manual_payments is
  'Manual (cash, CAD) FAST Code activation payments recorded by agents/admins. Superadmin may reverse. Server-side only.';

alter table public.manual_payments enable row level security;
revoke all on table public.manual_payments from anon, authenticated;
