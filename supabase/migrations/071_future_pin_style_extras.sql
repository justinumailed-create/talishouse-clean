-- Additional Home PIN style preferences captured on market/build forms
ALTER TABLE build_requests
  ADD COLUMN IF NOT EXISTS future_pin_white_center BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS future_pin_animated BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS future_pin_category_badge TEXT;
