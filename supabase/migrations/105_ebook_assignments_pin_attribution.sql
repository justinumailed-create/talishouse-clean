-- 105: Demo eBook → account assignments. Every eBook is a Demo until it is
-- CLAIMED (Claim Your Market™) or ASSIGNED to a paid-up account (FAST Code).
-- One row per moved book; server code only (service role), RLS on.

create table if not exists public.ebook_assignments (
  id uuid primary key default gen_random_uuid(),
  book_id uuid,
  book_slug text,
  source_mapsite_id uuid,
  source_fast_code text,
  target_mapsite_id uuid not null,
  target_fast_code text not null,
  assigned_by text not null,
  assigned_by_kind text not null check (assigned_by_kind in ('admin', 'agent', 'owner')),
  created_at timestamptz not null default now()
);
create index if not exists ebook_assignments_target_idx
  on public.ebook_assignments (lower(target_fast_code), created_at desc);

alter table public.ebook_assignments enable row level security;
revoke all on table public.ebook_assignments from anon, authenticated;

-- Phantom flags fix: every extra PIN records who placed it (owner / admin /
-- agent) so owners can see and remove PINs they did not create. Existing rows
-- stay null ("unknown").
alter table public.mapsite_additional_pins
  add column if not exists created_by text,
  add column if not exists created_by_kind text
    check (created_by_kind is null or created_by_kind in ('owner', 'admin', 'agent'));
