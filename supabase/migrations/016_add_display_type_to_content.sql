-- Add displayType to GlobalContent
ALTER TABLE public."GlobalContent" ADD COLUMN IF NOT EXISTS "displayType" text DEFAULT 'text';

-- Seed some initial data for the homepage if not present
INSERT INTO public."GlobalContent" (id, title, summary, "displayType")
VALUES 
    ('homepage_hero_title', 'TALISHOUSE™', 'Hero Title', 'text'),
    ('homepage_hero_subtitle', 'Homes and Cottages', 'Hero Subtitle', 'text'),
    ('homepage_stats_price', 'From $58.50 per sq.ft.', 'Starting Price', 'text'),
    ('homepage_stats_speed', 'Up in a day and move in ready in a week', 'Build Speed', 'text'),
    ('homepage_stats_lease', 'Lease-To-Own terms available, OAC', 'Financing', 'text'),
    ('homepage_map_section', '', 'Discovery Map', 'map')
ON CONFLICT (id) DO UPDATE SET 
    "displayType" = EXCLUDED."displayType",
    title = EXCLUDED.title,
    summary = EXCLUDED.summary;
