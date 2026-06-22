-- Add "ready_for_review" status to production_queue and mapsite_requests
ALTER TABLE production_queue
  DROP CONSTRAINT IF EXISTS production_queue_status_check;

ALTER TABLE production_queue
  ADD CONSTRAINT production_queue_status_check
  CHECK (status IN ('queued', 'processing', 'ready_for_review', 'completed', 'failed'));

ALTER TABLE mapsite_requests
  DROP CONSTRAINT IF EXISTS mapsite_requests_status_check;

ALTER TABLE mapsite_requests
  ADD CONSTRAINT mapsite_requests_status_check
  CHECK (status IN ('pending', 'processing', 'ready_for_review', 'completed', 'failed'));
