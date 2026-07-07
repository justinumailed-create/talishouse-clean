ALTER TABLE build_requests
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS market_type TEXT,
  ADD COLUMN IF NOT EXISTS property_title TEXT,
  ADD COLUMN IF NOT EXISTS logo TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS video TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS requested_account_type TEXT,
  ADD COLUMN IF NOT EXISTS requested_fast_code TEXT,
  ADD COLUMN IF NOT EXISTS assigned_marketing_manager TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS approval_status TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS linked_account_id UUID,
  ADD COLUMN IF NOT EXISTS linked_mapsite_id UUID,
  ADD COLUMN IF NOT EXISTS registration_link TEXT;

ALTER TABLE build_requests DROP CONSTRAINT IF EXISTS build_requests_status_check;

ALTER TABLE build_requests
  ADD CONSTRAINT build_requests_status_check
  CHECK (
    status IN (
      'Draft',
      'Submitted',
      'Under Review',
      'Approved',
      'Awaiting Registration',
      'Registered',
      'MapSite Active',
      'Published',
      'Rejected',
      'Changes Requested'
    )
  );

UPDATE build_requests
SET status = CASE
  WHEN status = 'draft' THEN 'Draft'
  WHEN status = 'pending' THEN 'Submitted'
  WHEN status = 'approved' THEN 'Approved'
  WHEN status = 'in_progress' THEN 'Under Review'
  WHEN status = 'completed' THEN 'Published'
  WHEN status = 'cancelled' THEN 'Rejected'
  ELSE status
END
WHERE status IN ('draft', 'pending', 'approved', 'in_progress', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS build_request_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_request_id UUID NOT NULL UNIQUE REFERENCES build_requests(id) ON DELETE CASCADE,
  registration_link TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_build_request_registrations_request_id
  ON build_request_registrations(build_request_id);
