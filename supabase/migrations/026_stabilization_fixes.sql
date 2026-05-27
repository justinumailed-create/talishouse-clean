-- Migration to ensure all required columns exist in fast_code_registrations
-- Phase 1 Launch Stabilization

DO $$ 
BEGIN
    -- Add province column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_NAME = 'fast_code_registrations' 
                   AND COLUMN_NAME = 'province') THEN
        ALTER TABLE fast_code_registrations ADD COLUMN province TEXT;
    END IF;

    -- Ensure other required columns exist (mostly verification as they are in the initial schema)
    -- first_name
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_NAME = 'fast_code_registrations' 
                   AND COLUMN_NAME = 'first_name') THEN
        ALTER TABLE fast_code_registrations ADD COLUMN first_name TEXT;
    END IF;

    -- last_name
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_NAME = 'fast_code_registrations' 
                   AND COLUMN_NAME = 'last_name') THEN
        ALTER TABLE fast_code_registrations ADD COLUMN last_name TEXT;
    END IF;

    -- email
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_NAME = 'fast_code_registrations' 
                   AND COLUMN_NAME = 'email') THEN
        ALTER TABLE fast_code_registrations ADD COLUMN email TEXT;
    END IF;

    -- cell_phone
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_NAME = 'fast_code_registrations' 
                   AND COLUMN_NAME = 'cell_phone') THEN
        ALTER TABLE fast_code_registrations ADD COLUMN cell_phone TEXT;
    END IF;

    -- street_address
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_NAME = 'fast_code_registrations' 
                   AND COLUMN_NAME = 'street_address') THEN
        ALTER TABLE fast_code_registrations ADD COLUMN street_address TEXT;
    END IF;

    -- fast_code
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_NAME = 'fast_code_registrations' 
                   AND COLUMN_NAME = 'fast_code') THEN
        ALTER TABLE fast_code_registrations ADD COLUMN fast_code TEXT UNIQUE;
    END IF;

    -- created_at
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_NAME = 'fast_code_registrations' 
                   AND COLUMN_NAME = 'created_at') THEN
        ALTER TABLE fast_code_registrations ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;
