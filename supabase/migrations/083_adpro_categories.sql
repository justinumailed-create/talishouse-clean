-- Add Adpros category classification for admin display and filtering.
ALTER TABLE build_requests
  ADD COLUMN IF NOT EXISTS adpro_category TEXT;
