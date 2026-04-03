CREATE TABLE IF NOT EXISTS assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  phone TEXT,
  email TEXT,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts" ON assistant_messages
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public reads" ON assistant_messages
  FOR SELECT TO anon USING (true);
