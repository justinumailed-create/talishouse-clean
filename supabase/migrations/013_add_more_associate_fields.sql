-- Add missing columns to associates table for full page customization
ALTER TABLE associates ADD COLUMN IF NOT EXISTS hero_type TEXT DEFAULT 'map';
ALTER TABLE associates ADD COLUMN IF NOT EXISTS hero_content TEXT;
ALTER TABLE associates ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE associates ADD COLUMN IF NOT EXISTS show_form BOOLEAN DEFAULT false;
ALTER TABLE associates ADD COLUMN IF NOT EXISTS show_video BOOLEAN DEFAULT false;
