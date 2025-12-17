-- Create storage bucket for store assets
INSERT INTO storage.buckets (id, name, public) VALUES ('store-assets', 'store-assets', true);

-- Create policy for public read access
CREATE POLICY "Public can view store assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'store-assets');

-- Create policy for admin upload
CREATE POLICY "Admins can upload store assets"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'store-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- Create policy for admin update
CREATE POLICY "Admins can update store assets"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'store-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- Create policy for admin delete
CREATE POLICY "Admins can delete store assets"
ON storage.objects
FOR DELETE
USING (bucket_id = 'store-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- Add logo setting if not exists
INSERT INTO public.site_settings (key, value)
VALUES ('store_logo', '')
ON CONFLICT (key) DO NOTHING;