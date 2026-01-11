
-- TABLE 3: events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  short_description TEXT CHECK (char_length(short_description) <= 200),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  location_name TEXT,
  location_address TEXT,
  neighborhood_id UUID REFERENCES public.neighborhoods(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('music', 'sports', 'family', 'food', 'arts', 'community', 'business', 'nightlife')),
  price_type TEXT DEFAULT 'free' CHECK (price_type IN ('free', 'paid', 'donation')),
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),
  ticket_url TEXT,
  image_url TEXT,
  organizer_name TEXT,
  organizer_id UUID,
  source_type TEXT DEFAULT 'user' CHECK (source_type IN ('user', 'imported', 'partner')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Events indexes
CREATE INDEX idx_events_start_time ON public.events(start_time);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_category ON public.events(category);
CREATE INDEX idx_events_neighborhood_id ON public.events(neighborhood_id);

-- Events RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved events"
ON public.events FOR SELECT
USING (status = 'approved');

CREATE POLICY "Authenticated users can submit events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (organizer_id = auth.uid());

-- Events updated_at trigger
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- TABLE 5: business_categories (create before businesses for reference)
CREATE TABLE public.business_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  display_order INTEGER DEFAULT 0
);

ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view business categories"
ON public.business_categories FOR SELECT
USING (true);

-- Seed business categories
INSERT INTO public.business_categories (name, slug, icon, display_order) VALUES
('Restaurants & Dining', 'restaurants', '🍽️', 1),
('Shopping & Retail', 'shopping', '🛍️', 2),
('Health & Wellness', 'health', '💪', 3),
('Home Services', 'home-services', '🏠', 4),
('Professional Services', 'professional', '💼', 5),
('Entertainment', 'entertainment', '🎭', 6),
('Automotive', 'automotive', '🚗', 7),
('Beauty & Spa', 'beauty', '💇', 8),
('Education', 'education', '📚', 9),
('Real Estate', 'real-estate', '🏢', 10);

-- TABLE 4: businesses
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT CHECK (char_length(short_description) <= 150),
  category TEXT NOT NULL,
  subcategories TEXT[],
  address TEXT,
  city TEXT DEFAULT 'Jacksonville',
  state TEXT DEFAULT 'FL',
  zip_code TEXT,
  neighborhood_id UUID REFERENCES public.neighborhoods(id) ON DELETE SET NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  hours JSONB,
  price_level INTEGER CHECK (price_level >= 1 AND price_level <= 4),
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  logo_url TEXT,
  cover_image_url TEXT,
  gallery_urls TEXT[],
  claimed BOOLEAN DEFAULT false,
  claimed_by UUID,
  verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'hidden')),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Businesses indexes
CREATE INDEX idx_businesses_status ON public.businesses(status);
CREATE INDEX idx_businesses_category ON public.businesses(category);
CREATE INDEX idx_businesses_neighborhood_id ON public.businesses(neighborhood_id);
CREATE INDEX idx_businesses_slug ON public.businesses(slug);

-- Businesses RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active businesses"
ON public.businesses FOR SELECT
USING (status = 'active');

CREATE POLICY "Authenticated users can claim businesses"
ON public.businesses FOR UPDATE
TO authenticated
USING (claimed_by = auth.uid() OR (claimed = false AND claimed_by IS NULL));

-- Businesses updated_at trigger
CREATE TRIGGER update_businesses_updated_at
BEFORE UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
