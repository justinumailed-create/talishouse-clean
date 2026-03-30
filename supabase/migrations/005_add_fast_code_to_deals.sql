-- Add associate tracking fields to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS fast_code TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS project_details TEXT;

-- Create index for fast_code lookup
CREATE INDEX IF NOT EXISTS idx_deals_fast_code ON deals(fast_code);
