-- Ensure public/anon can read published MapSites and related pins
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE mapsites TO anon, authenticated;
GRANT SELECT ON TABLE pins TO anon, authenticated;

-- Keep policy explicit and idempotent for published MapSites only
DROP POLICY IF EXISTS "Public can view active mapsites" ON mapsites;
CREATE POLICY "Public can view active mapsites" ON mapsites
  FOR SELECT
  TO public
  USING (status = 'active');
