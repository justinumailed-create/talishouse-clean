-- Add mapsite_slug to associates table
ALTER TABLE associates ADD COLUMN IF NOT EXISTS mapsite_slug TEXT UNIQUE;