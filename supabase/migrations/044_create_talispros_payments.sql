CREATE TABLE IF NOT EXISTS talispros_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  paypal_order_id TEXT,
  paypal_capture_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE talispros_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON talispros_payments
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow all selects" ON talispros_payments
  FOR SELECT TO anon USING (true);
