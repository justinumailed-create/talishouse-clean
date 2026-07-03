-- Client marketing metrics (daily snapshots posted by marketing manager)
CREATE TABLE IF NOT EXISTS client_marketing_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fast_code TEXT NOT NULL,
  report_date DATE NOT NULL,
  facebook_impressions INTEGER NOT NULL DEFAULT 0,
  instagram_impressions INTEGER NOT NULL DEFAULT 0,
  total_reach INTEGER NOT NULL DEFAULT 0,
  emails_received INTEGER NOT NULL DEFAULT 0,
  texts_received INTEGER NOT NULL DEFAULT 0,
  pipeline_status TEXT NOT NULL DEFAULT 'active',
  checklist_notes TEXT,
  posted_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (fast_code, report_date)
);

CREATE INDEX IF NOT EXISTS idx_client_marketing_metrics_fast_code
  ON client_marketing_metrics (fast_code);

CREATE INDEX IF NOT EXISTS idx_client_marketing_metrics_report_date
  ON client_marketing_metrics (report_date DESC);

-- Weekly performance summaries (cron-generated)
CREATE TABLE IF NOT EXISTS client_weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fast_code TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  summary_text TEXT NOT NULL,
  facebook_impressions_total INTEGER NOT NULL DEFAULT 0,
  instagram_impressions_total INTEGER NOT NULL DEFAULT 0,
  total_reach_total INTEGER NOT NULL DEFAULT 0,
  emails_received_total INTEGER NOT NULL DEFAULT 0,
  texts_received_total INTEGER NOT NULL DEFAULT 0,
  pipeline_status TEXT NOT NULL DEFAULT 'active',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (fast_code, week_start)
);

CREATE INDEX IF NOT EXISTS idx_client_weekly_reports_fast_code
  ON client_weekly_reports (fast_code);

CREATE INDEX IF NOT EXISTS idx_client_weekly_reports_week_start
  ON client_weekly_reports (week_start DESC);

ALTER TABLE client_marketing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access client_marketing_metrics"
  ON client_marketing_metrics FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access client_weekly_reports"
  ON client_weekly_reports FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Demo seed for lrg1
INSERT INTO client_marketing_metrics (
  fast_code,
  report_date,
  facebook_impressions,
  instagram_impressions,
  total_reach,
  emails_received,
  texts_received,
  pipeline_status,
  checklist_notes,
  posted_by
) VALUES (
  'lrg1',
  CURRENT_DATE,
  4200,
  3100,
  7300,
  8,
  3,
  'active',
  'Posted property highlight reel on Facebook and Instagram. Responded to all inbound emails.',
  'rahulc@talispros.com'
)
ON CONFLICT (fast_code, report_date) DO NOTHING;
