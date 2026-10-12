-- 098: Remove the legacy associates system. Agents (agent_admins) are separate
-- and untouched. Both tables were empty when dropped; a JSON/CSV export was
-- taken first (2026-10-12). leads.associate_id (all NULL) is kept, only its FK is dropped.
alter table if exists public.leads drop constraint if exists leads_associate_id_fkey;
drop table if exists public.associate_applications;
drop table if exists public.associates;
