-- Add transaction-level discount columns
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS discount_percentage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_active boolean DEFAULT false;