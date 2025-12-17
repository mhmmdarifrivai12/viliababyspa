-- Add discount columns to treatments table
ALTER TABLE public.treatments 
ADD COLUMN discount_percentage numeric DEFAULT 0,
ADD COLUMN discount_active boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.treatments.discount_percentage IS 'Discount percentage (0-100)';
COMMENT ON COLUMN public.treatments.discount_active IS 'Whether the discount is currently active';