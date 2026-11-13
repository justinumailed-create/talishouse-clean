-- Correct brokerage lead websites that were filled from an internal Mapsite
-- path (for example /talispros/register-your-mapsite/ys01). The brokerage
-- site is the prospect's external address: prospect_queue.website, then
-- mapsites.broker_url. A website that is already an external http(s) site
-- is left unchanged. No rows are deleted.

with candidates as (
  select
    b.id,
    b.brokerage_website as old_site,
    coalesce(
      case
        when q.website ~* '^https?://'
          and q.website !~* 'talispros\.com|register-your-mapsite|localhost|vercel\.app'
          then q.website
      end,
      case
        when m.broker_url ~* '^https?://'
          and m.broker_url !~* 'talispros\.com|register-your-mapsite|localhost|vercel\.app'
          then m.broker_url
      end,
      case
        when m.website ~* '^https?://'
          and m.website !~* 'talispros\.com|register-your-mapsite|/talispros/|localhost|vercel\.app'
          then m.website
      end
    ) as new_site
  from public.brokerage_leads b
  left join public.mapsites m
    on m.id = b.mapsite_id or lower(m.fast_code) = b.fast_code
  left join lateral (
    select website
    from public.prospect_queue
    where lower(proposed_code) = b.fast_code
    order by created_at desc
    limit 1
  ) q on true
  where b.brokerage_website is not null
    and (
      b.brokerage_website ~ '^/'
      or b.brokerage_website ilike '%register-your-mapsite%'
      or b.brokerage_website ilike '%/talispros/%'
      or b.brokerage_website ilike '%talispros.com%'
    )
),
updated as (
  update public.brokerage_leads as lead
  set brokerage_website = candidates.new_site,
      updated_at = now()
  from candidates
  where lead.id = candidates.id
    and lead.brokerage_website is distinct from candidates.new_site
  returning lead.id, candidates.old_site, lead.brokerage_website as new_site
)
insert into public.brokerage_lead_edits (lead_id, action, actor_name, actor_role, changes)
select
  id,
  'update',
  'migration-117',
  'superadmin',
  jsonb_build_object('brokerage_website', jsonb_build_object('from', old_site, 'to', new_site))
from updated;
