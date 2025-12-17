-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  description TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  image_url TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved testimonials
CREATE POLICY "Anyone can view approved testimonials"
ON public.testimonials
FOR SELECT
USING (is_approved = true);

-- Anyone can submit testimonials
CREATE POLICY "Anyone can submit testimonials"
ON public.testimonials
FOR INSERT
WITH CHECK (true);

-- Admins can manage all testimonials
CREATE POLICY "Admins can manage testimonials"
ON public.testimonials
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for testimonial images
INSERT INTO storage.buckets (id, name, public) VALUES ('testimonial-images', 'testimonial-images', true);

-- Storage policies for testimonial images
CREATE POLICY "Anyone can view testimonial images"
ON storage.objects FOR SELECT
USING (bucket_id = 'testimonial-images');

CREATE POLICY "Anyone can upload testimonial images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'testimonial-images');

CREATE POLICY "Admins can delete testimonial images"
ON storage.objects FOR DELETE
USING (bucket_id = 'testimonial-images' AND has_role(auth.uid(), 'admin'::app_role));