-- Create assistant_leads table for TalisBOT lead capture
CREATE TABLE IF NOT EXISTS assistant_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  email TEXT,
  intent TEXT,
  size TEXT,
  budget TEXT,
  location TEXT,
  finish TEXT,
  installation TEXT,
  recommended_product_ids TEXT[],
  last_step TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE assistant_leads ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (TalisBOT needs to write)
CREATE POLICY "Allow public inserts" ON assistant_leads
  FOR INSERT TO anon WITH CHECK (true);

-- Allow authenticated reads (admin)
CREATE POLICY "Allow authenticated reads" ON assistant_leads
  FOR SELECT TO authenticated USING (true);

-- Create chat_logs table for conversation history
CREATE TABLE IF NOT EXISTS talisbot_chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  step TEXT NOT NULL,
  user_input TEXT,
  bot_response TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE talisbot_chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts" ON talisbot_chat_logs
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow authenticated reads" ON talisbot_chat_logs
  FOR SELECT TO authenticated USING (true);

-- Index for efficient session lookups
CREATE INDEX IF NOT EXISTS idx_talisbot_session ON talisbot_chat_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_assistant_leads_session ON assistant_leads(session_id);
CREATE INDEX IF NOT EXISTS idx_assistant_leads_created ON assistant_leads(created_at DESC);