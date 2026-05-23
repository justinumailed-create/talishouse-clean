-- Add province column to fast_code_registrations for US/CA support
ALTER TABLE fast_code_registrations
ADD COLUMN IF NOT EXISTS province TEXT NOT NULL DEFAULT '';
