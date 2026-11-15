-- The read policy already allows the public role. Anon still needs the table grant,
-- matching mapsites, or a preview with only the public key cannot see extra pins.
grant select on table public.mapsite_additional_pins to anon, authenticated;
