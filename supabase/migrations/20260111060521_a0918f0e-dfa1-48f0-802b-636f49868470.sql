-- Create neighborhoods table
CREATE TABLE public.neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  zip_codes TEXT[],
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create articles table
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  excerpt TEXT,
  content TEXT,
  ai_summary TEXT,
  source_url TEXT UNIQUE,
  source_name TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  neighborhood_id UUID REFERENCES public.neighborhoods(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  content_type TEXT DEFAULT 'aggregated',
  status TEXT DEFAULT 'pending',
  is_featured BOOLEAN DEFAULT false,
  is_breaking BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for articles
CREATE INDEX idx_articles_category ON public.articles(category);
CREATE INDEX idx_articles_neighborhood_id ON public.articles(neighborhood_id);
CREATE INDEX idx_articles_status ON public.articles(status);
CREATE INDEX idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX idx_articles_is_featured ON public.articles(is_featured);

-- Enable Row Level Security
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Neighborhoods RLS: Public read access
CREATE POLICY "Anyone can view neighborhoods"
ON public.neighborhoods FOR SELECT
USING (true);

-- Articles RLS: Public can read active articles
CREATE POLICY "Anyone can view active articles"
ON public.articles FOR SELECT
USING (status = 'active');

-- Articles RLS: Authenticated users can insert (for user submissions)
CREATE POLICY "Authenticated users can submit articles"
ON public.articles FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for articles updated_at
CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed neighborhoods data
INSERT INTO public.neighborhoods (name, slug, description, zip_codes, display_order) VALUES
('Downtown', 'downtown', 'The heart of Jacksonville featuring urban living, cultural attractions, and the historic riverfront.', ARRAY['32202', '32204'], 1),
('Riverside', 'riverside', 'Historic neighborhood known for eclectic shops, diverse dining, and beautiful parks along the St. Johns River.', ARRAY['32204', '32205'], 2),
('Avondale', 'avondale', 'Charming area with tree-lined streets, boutique shops, and a thriving arts scene.', ARRAY['32205'], 3),
('San Marco', 'san-marco', 'Upscale neighborhood featuring unique shops, fine dining, and beautiful architecture.', ARRAY['32207'], 4),
('Southside', 'southside', 'Major commercial and residential hub with shopping centers, restaurants, and entertainment.', ARRAY['32216', '32217', '32256'], 5),
('Arlington', 'arlington', 'Diverse community with established neighborhoods, local businesses, and easy access to beaches.', ARRAY['32211', '32225'], 6),
('Mandarin', 'mandarin', 'Suburban community known for excellent schools, parks, and family-friendly atmosphere.', ARRAY['32223', '32257', '32258'], 7),
('Jacksonville Beach', 'jacksonville-beach', 'Vibrant beach community with oceanfront living, dining, and active nightlife.', ARRAY['32250'], 8),
('Neptune Beach', 'neptune-beach', 'Quiet beach town known for its laid-back vibe and local charm.', ARRAY['32266'], 9),
('Atlantic Beach', 'atlantic-beach', 'Family-oriented beach community with a relaxed atmosphere and natural beauty.', ARRAY['32233'], 10),
('Ponte Vedra', 'ponte-vedra', 'Upscale coastal community known for world-class golf, resorts, and beautiful beaches.', ARRAY['32082'], 11),
('Westside', 'westside', 'Rapidly growing area with new developments, shopping centers, and diverse communities.', ARRAY['32210', '32221'], 12),
('Northside', 'northside', 'Historic area home to the Jacksonville Zoo, cultural sites, and revitalization projects.', ARRAY['32208', '32218', '32226'], 13),
('Springfield', 'springfield', 'Historic urban neighborhood undergoing renaissance with art galleries, local restaurants, and community events.', ARRAY['32206'], 14),
('Orange Park', 'orange-park', 'Suburban community in Clay County with excellent amenities and easy access to Jacksonville.', ARRAY['32065', '32073'], 15);