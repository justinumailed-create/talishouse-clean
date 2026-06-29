-- Allow anon users to insert into users table (for admin creation)
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Anon users can insert users" ON users;
    CREATE POLICY "Anon users can insert users" ON users
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;
