-- Create production_queue table for Talispros Build System
CREATE TABLE IF NOT EXISTS production_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES build_requests(id),
  priority INTEGER DEFAULT 0,
  assigned_to TEXT,
  status TEXT DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE production_queue ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage
CREATE POLICY "Authenticated users can manage production_queue" ON production_queue
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anon users can view
CREATE POLICY "Anon users can view production_queue" ON production_queue
  FOR SELECT
  TO anon
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_production_queue_request_id ON production_queue(request_id);
CREATE INDEX IF NOT EXISTS idx_production_queue_status ON production_queue(status);
CREATE INDEX IF NOT EXISTS idx_production_queue_priority ON production_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_production_queue_assigned_to ON production_queue(assigned_to);
