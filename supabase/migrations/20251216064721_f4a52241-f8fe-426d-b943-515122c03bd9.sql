-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create treatment_categories table
CREATE TABLE public.treatment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create treatments table
CREATE TABLE public.treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.treatment_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_name TEXT NOT NULL,
  customer_age TEXT,
  customer_address TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('transfer', 'cash')),
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transaction_items table
CREATE TABLE public.transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  treatment_id UUID REFERENCES public.treatments(id) ON DELETE SET NULL,
  treatment_name TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  quantity INT NOT NULL DEFAULT 1
);

-- Create site_settings table
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Create has_role function for secure role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatments_updated_at
  BEFORE UPDATE ON public.treatments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email));
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles: Users can read/update their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- User roles: Only admins can manage roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Treatment categories: Public read, admin write
CREATE POLICY "Anyone can view categories" ON public.treatment_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.treatment_categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Treatments: Public read, admin write
CREATE POLICY "Anyone can view treatments" ON public.treatments
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage treatments" ON public.treatments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Transactions: Employees can create, view own. Admins can view all
CREATE POLICY "Employees can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (
    auth.uid() = employee_id AND 
    (public.has_role(auth.uid(), 'employee') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Employees can view own transactions" ON public.transactions
  FOR SELECT USING (
    auth.uid() = employee_id OR public.has_role(auth.uid(), 'admin')
  );

-- Transaction items: Same as transactions
CREATE POLICY "Employees can create transaction items" ON public.transaction_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions t 
      WHERE t.id = transaction_id 
      AND (t.employee_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Can view transaction items" ON public.transaction_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.transactions t 
      WHERE t.id = transaction_id 
      AND (t.employee_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Site settings: Public read, admin write
CREATE POLICY "Anyone can view site settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage site settings" ON public.site_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert default site settings
INSERT INTO public.site_settings (key, value) VALUES
  ('store_name', 'Vilia Baby Spa'),
  ('store_description', 'Layanan Studio dan Home Care dengan tenaga profesional yang bersertifikat Baby & Mom Treatment serta Manajemen Laktasi.'),
  ('store_address', 'Alamat Studio (Placeholder)'),
  ('store_phone', '6282210400961'),
  ('store_instagram', 'viliababyspa'),
  ('home_care_areas', 'Area Home Care (Placeholder)'),
  ('certifications', 'Baby & Mom Treatment, Manajemen Laktasi');

-- Insert treatment categories based on the PDF
INSERT INTO public.treatment_categories (name, description, display_order) VALUES
  ('Baby Treatment', 'Perawatan lengkap untuk bayi', 1),
  ('Kids Treatment', 'Perawatan untuk anak-anak', 2),
  ('Haircut & Tindik', 'Layanan potong rambut dan tindik', 3),
  ('Mom/Nifas Treatment', 'Perawatan untuk ibu nifas', 4),
  ('Pijat Laktasi', 'Perawatan laktasi untuk ibu menyusui', 5),
  ('Pregnancy', 'Perawatan untuk ibu hamil', 6),
  ('Baby Spa', 'Layanan spa lengkap untuk bayi', 7),
  ('Newborn Care', 'Perawatan khusus bayi baru lahir', 8),
  ('Add-on', 'Layanan tambahan', 9);

-- Insert treatments based on the PDF price list
INSERT INTO public.treatments (category_id, name, description, price) VALUES
  -- Baby Treatment
  ((SELECT id FROM treatment_categories WHERE name = 'Baby Treatment'), 'Baby Massage', 'Pijat bayi untuk relaksasi dan tumbuh kembang', 80000),
  ((SELECT id FROM treatment_categories WHERE name = 'Baby Treatment'), 'Baby Gym', 'Senam untuk merangsang motorik bayi', 80000),
  ((SELECT id FROM treatment_categories WHERE name = 'Baby Treatment'), 'Tummy Time', 'Latihan tengkurap untuk bayi', 80000),
  ((SELECT id FROM treatment_categories WHERE name = 'Baby Treatment'), 'Paket BM + BG + Solari', 'Paket lengkap Baby Massage, Baby Gym & Berjemur', 105000),
  
  -- Kids Treatment
  ((SELECT id FROM treatment_categories WHERE name = 'Kids Treatment'), 'Kids Massage', 'Pijat untuk anak-anak', 90000),
  ((SELECT id FROM treatment_categories WHERE name = 'Kids Treatment'), 'Paket Kids Massage + Hair Spa', 'Paket pijat dan perawatan rambut anak', 120000),
  
  -- Haircut & Tindik
  ((SELECT id FROM treatment_categories WHERE name = 'Haircut & Tindik'), 'Baby Haircut', 'Potong rambut bayi', 50000),
  ((SELECT id FROM treatment_categories WHERE name = 'Haircut & Tindik'), 'Kids Haircut', 'Potong rambut anak', 55000),
  ((SELECT id FROM treatment_categories WHERE name = 'Haircut & Tindik'), 'Tindik Baby/Kids', 'Layanan tindik telinga', 100000),
  
  -- Mom/Nifas Treatment
  ((SELECT id FROM treatment_categories WHERE name = 'Mom/Nifas Treatment'), 'Mom Massage', 'Pijat relaksasi untuk ibu', 150000),
  ((SELECT id FROM treatment_categories WHERE name = 'Mom/Nifas Treatment'), 'Pijat Nifas', 'Pijat pemulihan pasca melahirkan', 150000),
  ((SELECT id FROM treatment_categories WHERE name = 'Mom/Nifas Treatment'), 'Totok Wajah', 'Pijat akupresur wajah', 50000),
  ((SELECT id FROM treatment_categories WHERE name = 'Mom/Nifas Treatment'), 'Paket Mom Massage + Totok', 'Paket pijat dan totok wajah', 180000),
  
  -- Pijat Laktasi
  ((SELECT id FROM treatment_categories WHERE name = 'Pijat Laktasi'), 'Pijat Laktasi', 'Pijat untuk melancarkan ASI', 180000),
  ((SELECT id FROM treatment_categories WHERE name = 'Pijat Laktasi'), 'Pijat Laktasi + Bekam', 'Paket pijat laktasi dengan bekam', 230000),
  
  -- Pregnancy
  ((SELECT id FROM treatment_categories WHERE name = 'Pregnancy'), 'Pregnancy Massage', 'Pijat relaksasi untuk ibu hamil', 170000),
  
  -- Baby Spa
  ((SELECT id FROM treatment_categories WHERE name = 'Baby Spa'), 'Baby Spa', 'Spa lengkap untuk bayi', 120000),
  ((SELECT id FROM treatment_categories WHERE name = 'Baby Spa'), 'Kids Spa', 'Spa lengkap untuk anak', 150000),
  
  -- Newborn Care
  ((SELECT id FROM treatment_categories WHERE name = 'Newborn Care'), 'Newborn Care Visit', 'Kunjungan perawatan bayi baru lahir', 200000),
  ((SELECT id FROM treatment_categories WHERE name = 'Newborn Care'), 'Paket Newborn + Mom Massage', 'Paket perawatan bayi dan ibu', 300000),
  
  -- Add-on
  ((SELECT id FROM treatment_categories WHERE name = 'Add-on'), 'Aromatherapy', 'Tambahan aromaterapi', 15000),
  ((SELECT id FROM treatment_categories WHERE name = 'Add-on'), 'Hair Spa Baby', 'Perawatan rambut bayi', 25000),
  ((SELECT id FROM treatment_categories WHERE name = 'Add-on'), 'Ear Candle', 'Terapi telinga', 30000);