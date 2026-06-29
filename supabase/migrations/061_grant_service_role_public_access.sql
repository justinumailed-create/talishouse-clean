-- service_role needs explicit public schema access (PG15+ tightened defaults)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;

-- Explicit RLS policies for MapSite admin operations
DROP POLICY IF EXISTS "Service role can manage mapsites" ON mapsites;
CREATE POLICY "Service role can manage mapsites" ON mapsites
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage pins" ON pins;
CREATE POLICY "Service role can manage pins" ON pins
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
