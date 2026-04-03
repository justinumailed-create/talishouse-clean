-- STEP 1: Disable RLS temporarily
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- STEP 2: Test insert works without RLS
-- (Do NOT skip this mentally — this confirms issue is RLS)

-- STEP 3: Re-enable RLS cleanly
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- STEP 4: Remove ALL existing policies
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'leads') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON leads';
  END LOOP;
END $$;

-- STEP 5: Create simplest possible open policy

CREATE POLICY "open_insert"
ON leads
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "open_select"
ON leads
FOR SELECT
TO public
USING (true);

-- STEP 6: Verify
SELECT * FROM pg_policies WHERE tablename = 'leads';
