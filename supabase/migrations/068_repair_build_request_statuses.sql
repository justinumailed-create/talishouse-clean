-- Repair partially-applied 067 migration: normalize legacy statuses before constraint.
ALTER TABLE build_requests DROP CONSTRAINT IF EXISTS build_requests_status_check;

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
