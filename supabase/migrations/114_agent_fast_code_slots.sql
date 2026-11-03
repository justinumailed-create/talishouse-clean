-- FAST Code slots for sales associates on the demo Mapsite page
-- (/talispros/demo-mapsite). Each agent account keeps one ordered list of up
-- to 15 prepared Mapsites. The list stores the Mapsite id only; the FAST Code
-- is read from mapsites on the server and sent to the owning signed-in agent
-- only. Public visitors see the agent name, the towns and the count.
--
-- Written only by server actions with the service role after the agent
-- session check. No public policies.

CREATE TABLE IF NOT EXISTS agent_fast_code_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agent_admins(id) ON DELETE CASCADE,
  mapsite_id uuid NOT NULL REFERENCES mapsites(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_fast_code_slots_unique UNIQUE (agent_id, mapsite_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_fast_code_slots_agent
  ON agent_fast_code_slots (agent_id, position);

CREATE INDEX IF NOT EXISTS idx_agent_fast_code_slots_mapsite
  ON agent_fast_code_slots (mapsite_id);

ALTER TABLE agent_fast_code_slots ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE agent_fast_code_slots FROM anon, authenticated;
