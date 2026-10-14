-- PMC sequence (TalisU → Talispros → Media Directory → Contract → Register).
-- Additive only.
--
-- 1) Every agent gets ONE permanent, unique agent code (agent_admins.contract_code).
--    The agent gives it to a client; entering it unlocks the Contract page and
--    attributes the signed contract (and the client's FAST Code) to that agent.
-- 2) mapsite_contract_signatures: agent attribution + business name; FAST Code
--    becomes optional (a client can sign before a FAST Code exists).
-- 3) mapsite_contract_access_log: agent attribution.

create or replace function public.gen_agent_contract_code()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidate text;
  i int;
begin
  loop
    candidate := 'TP-';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.agent_admins where contract_code = candidate);
  end loop;
  return candidate;
end $$;

alter table public.agent_admins add column if not exists contract_code text;

update public.agent_admins
   set contract_code = public.gen_agent_contract_code()
 where contract_code is null;

create unique index if not exists agent_admins_contract_code_key
  on public.agent_admins (contract_code);

create or replace function public.agent_admins_set_contract_code()
returns trigger
language plpgsql
as $$
begin
  if new.contract_code is null then
    new.contract_code := public.gen_agent_contract_code();
  end if;
  return new;
end $$;

drop trigger if exists agent_admins_contract_code on public.agent_admins;
create trigger agent_admins_contract_code
  before insert on public.agent_admins
  for each row execute function public.agent_admins_set_contract_code();

alter table public.mapsite_contract_signatures
  alter column fast_code drop not null,
  add column if not exists agent_id uuid references public.agent_admins(id) on delete set null,
  add column if not exists agent_code text,
  add column if not exists signer_business text,
  add column if not exists document text not null default 'service-agreement';

create index if not exists idx_mapsite_contract_signatures_agent
  on public.mapsite_contract_signatures (agent_id, signed_at desc);

alter table public.mapsite_contract_access_log
  add column if not exists agent_id uuid references public.agent_admins(id) on delete set null;
