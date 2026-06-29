-- Migration: Add associate page customization fields to users table
-- This enables Super Admin to control associate page content

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_page_enabled BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS page_headline VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS page_subtext TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS page_contact_cta VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS page_footer_note TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS page_custom_message TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.is_page_enabled IS 'Whether the associate page is publicly visible';
COMMENT ON COLUMN users.page_headline IS 'Custom headline for associate landing page';
COMMENT ON COLUMN users.page_subtext IS 'Custom subtext/description for associate page';
COMMENT ON COLUMN users.page_contact_cta IS 'Custom call-to-action text for contact form';
COMMENT ON COLUMN users.page_footer_note IS 'Custom footer note displayed on associate page';
COMMENT ON COLUMN users.page_custom_message IS 'Optional custom message/promotion for associate page';
