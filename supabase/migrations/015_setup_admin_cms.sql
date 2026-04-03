-- Create GlobalContent table with text ID as the primary key
CREATE TABLE IF NOT EXISTS public."GlobalContent" (
    id text PRIMARY KEY,
    title text,
    summary text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Recreate pricing_config table with the specific columns requested
DROP TABLE IF EXISTS public.pricing_config;

CREATE TABLE public.pricing_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_rate numeric DEFAULT 0.14,
    full_payment_enabled boolean DEFAULT true,
    partial_payment_enabled boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Insert a default row for pricing_config
INSERT INTO public.pricing_config (tax_rate, full_payment_enabled, partial_payment_enabled)
VALUES (0.14, true, true);

-- Disable RLS for now
ALTER TABLE public."GlobalContent" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_config DISABLE ROW LEVEL SECURITY;
