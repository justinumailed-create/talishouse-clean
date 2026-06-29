-- Add associate-specific fields to users table
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS intro_message TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

    -- Create index for role lookup
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  END IF;
END $$;
