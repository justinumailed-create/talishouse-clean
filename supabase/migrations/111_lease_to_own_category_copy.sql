-- Display copy only. Category slugs and ids stay.
-- Seeded blurbs said "SPLITS enabled"; the structure is now Lease-to-Own.
update public.categories
set description = replace(description, 'SPLITS', 'Lease-to-Own')
where description like '%SPLITS%';
