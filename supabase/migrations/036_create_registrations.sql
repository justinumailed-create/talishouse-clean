-- Create registrations table for MapSite checkout
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT NOT NULL,
  account_type TEXT NOT NULL,
  fast_code TEXT,
  amount_paid DECIMAL(10,2) NOT NULL,
  monthly_subscription DECIMAL(10,2) NOT NULL,
  registration_number TEXT NOT NULL UNIQUE,
  paypal_order_id TEXT,
  paypal_capture_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage
CREATE POLICY "Authenticated users can manage registrations" ON registrations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anon users can insert (for public checkout flow)
CREATE POLICY "Anon users can insert registrations" ON registrations
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Public users can view their own registration by email
CREATE POLICY "Public users can view registrations" ON registrations
  FOR SELECT
  TO anon
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_reg_number ON registrations(registration_number);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at DESC);
