-- Disqualify a brokerage from its 80 km market without deleting the row.
-- An active row hides the FAST Code from agent call lists and the public
-- Mapsite. A Global Admin restores it by setting reversed_at. History stays.

create table if not exists public.market_brokerage_disqualifications (
  id uuid primary key default gen_random_uuid(),
  fast_code text,
  prospect_queue_id uuid references public.prospect_queue(id) on delete set null,
  market text not null default '',
  brokerage text not null,
  reason text not null,
  actor_name text not null,
  actor_role text not null,
  actor_id text,
  created_at timestamptz not null default now(),
  reversed_at timestamptz,
  reversed_by text,
  reversed_reason text,
  constraint market_disq_role_check check (actor_role in ('agent', 'superadmin')),
  constraint market_disq_reason_check check (char_length(btrim(reason)) between 3 and 500),
  constraint market_disq_target_check check (fast_code is not null or prospect_queue_id is not null),
  constraint market_disq_code_check check (fast_code is null or fast_code = lower(fast_code))
);

create unique index if not exists market_disq_active_fast_code
  on public.market_brokerage_disqualifications (fast_code)
  where reversed_at is null and fast_code is not null;

create unique index if not exists market_disq_active_queue
  on public.market_brokerage_disqualifications (prospect_queue_id)
  where reversed_at is null and prospect_queue_id is not null;

create index if not exists market_disq_market_idx
  on public.market_brokerage_disqualifications (market, created_at desc);

comment on table public.market_brokerage_disqualifications is
  'Brokerage removed from one market. Active while reversed_at is null. Never deleted.';

alter table public.market_brokerage_disqualifications enable row level security;

-- Call-history labels for the same action.
do $$
declare cname text;
begin
  select c.conname into cname
  from pg_constraint c
  where c.conrelid = 'public.fast_code_updates'::regclass
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%event_type%';
  if cname is not null then
    execute format('alter table public.fast_code_updates drop constraint %I', cname);
  end if;
end $$;

alter table public.fast_code_updates
  add constraint fast_code_updates_event_type_check
  check (event_type in (
    'stage', 'note', 'listings', 'ebook', 'assigned', 'sourced', 'refresh',
    'step', 'comment', 'lead', 'disqualified', 'requalified'
  ));
