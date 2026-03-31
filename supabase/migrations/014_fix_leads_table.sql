-- Add missing columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS associate_id UUID REFERENCES associates(id);
