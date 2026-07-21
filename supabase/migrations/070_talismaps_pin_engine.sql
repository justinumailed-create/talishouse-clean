-- TalisMaps™ PIN Engine extensions

ALTER TABLE talismaps_map_pins DROP CONSTRAINT IF EXISTS talismaps_map_pins_pin_type_check;

UPDATE talismaps_map_pins
SET pin_type = 'root'
WHERE pin_type = 'standard';

ALTER TABLE talismaps_map_pins
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'network',
  ADD COLUMN IF NOT EXISTS theme_id UUID REFERENCES talismaps_map_themes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';

ALTER TABLE talismaps_map_pins DROP CONSTRAINT IF EXISTS talismaps_map_pins_visibility_check;
ALTER TABLE talismaps_map_pins
  ADD CONSTRAINT talismaps_map_pins_visibility_check
  CHECK (visibility IN ('public', 'private', 'network'));

ALTER TABLE talismaps_map_pins DROP CONSTRAINT IF EXISTS talismaps_map_pins_status_check;
ALTER TABLE talismaps_map_pins
  ADD CONSTRAINT talismaps_map_pins_status_check
  CHECK (status IN ('draft', 'published', 'archived'));

ALTER TABLE talismaps_map_pins
  ADD CONSTRAINT talismaps_map_pins_pin_type_check
  CHECK (pin_type IN ('root', 'derivative', 'adpro', 'property'));

CREATE INDEX IF NOT EXISTS idx_talismaps_map_pins_owner_id ON talismaps_map_pins(owner_id);
CREATE INDEX IF NOT EXISTS idx_talismaps_map_pins_theme_id ON talismaps_map_pins(theme_id);
CREATE INDEX IF NOT EXISTS idx_talismaps_map_pins_status ON talismaps_map_pins(status);
CREATE INDEX IF NOT EXISTS idx_talismaps_map_pins_visibility ON talismaps_map_pins(visibility);
