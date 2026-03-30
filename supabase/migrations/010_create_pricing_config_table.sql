-- Migration: 010_create_pricing_config_table.sql
-- Creates the pricing_config table for dynamic pricing configuration

CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anonymous read access for all users
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read" ON pricing_config
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON pricing_config
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON pricing_config
  FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete" ON pricing_config
  FOR DELETE USING (true);

-- Insert default configuration
INSERT INTO pricing_config (config, created_at, updated_at)
SELECT 
  '{
    "taxRate": 0.14,
    "paymentOptions": {
      "full": { "enabled": true },
      "partial": { "enabled": true, "percentage": 0.05 }
    },
    "leaseToOwn": {
      "enabled": true,
      "maxMonths": 60,
      "adminFeePercent": 0.05,
      "downPaymentPercent": 0.5,
      "interestRate": 0.08
    },
    "discounts": {
      "enabled": true,
      "codes": {
        "PAC5": { "type": "percentage", "value": 0.05 }
      }
    }
  }'::jsonb,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM pricing_config);

-- Manual seed (run in SQL editor if needed):
-- INSERT INTO pricing_config (config) 
-- VALUES ('{"taxRate":0.14,"paymentOptions":{"full":{"enabled":true},"partial":{"enabled":true,"percentage":0.05}},"leaseToOwn":{"enabled":true,"maxMonths":60,"adminFeePercent":0.05,"downPaymentPercent":0.5,"interestRate":0.08},"discounts":{"enabled":true,"codes":{}}}');
