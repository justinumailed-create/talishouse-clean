-- Allow anon users to insert into users table (for admin creation)
CREATE POLICY "Anon users can insert users" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);
