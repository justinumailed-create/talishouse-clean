-- Create mapsite_requests table for Talispros Build System
CREATE TABLE IF NOT EXISTS mapsite_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES build_requests(id),
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  assigned_to TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mapsite_requests ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage
CREATE POLICY "Authenticated users can manage mapsite_requests" ON mapsite_requests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anon users can view
CREATE POLICY "Anon users can view mapsite_requests" ON mapsite_requests
  FOR SELECT
  TO anon
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mapsite_requests_request_id ON mapsite_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_mapsite_requests_status ON mapsite_requests(status);
CREATE INDEX IF NOT EXISTS idx_mapsite_requests_assigned_to ON mapsite_requests(assigned_to);
