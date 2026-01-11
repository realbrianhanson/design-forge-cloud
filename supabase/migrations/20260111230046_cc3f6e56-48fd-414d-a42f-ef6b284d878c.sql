-- Add parent_id, icon, and description to business_categories for subcategory support
ALTER TABLE public.business_categories
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.business_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add amenities array to businesses for filtering
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';

-- Create index for parent_id lookups
CREATE INDEX IF NOT EXISTS idx_business_categories_parent_id ON public.business_categories(parent_id);

-- Create index for amenities (GIN for array contains queries)
CREATE INDEX IF NOT EXISTS idx_businesses_amenities ON public.businesses USING GIN(amenities);

-- Seed subcategories for Restaurants & Dining
WITH parent AS (SELECT id FROM public.business_categories WHERE slug = 'restaurants' LIMIT 1)
INSERT INTO public.business_categories (name, slug, icon, parent_id, display_order, description) VALUES
('American', 'american', '🍔', (SELECT id FROM parent), 1, 'Classic American cuisine'),
('Italian', 'italian', '🍝', (SELECT id FROM parent), 2, 'Italian restaurants and pizzerias'),
('Mexican', 'mexican', '🌮', (SELECT id FROM parent), 3, 'Mexican and Tex-Mex cuisine'),
('Asian', 'asian', '🍜', (SELECT id FROM parent), 4, 'Asian cuisine including Chinese, Japanese, Thai'),
('Seafood', 'seafood', '🦐', (SELECT id FROM parent), 5, 'Seafood restaurants and fish markets'),
('Fast Food', 'fast-food', '🍟', (SELECT id FROM parent), 6, 'Quick service restaurants'),
('Coffee & Tea', 'coffee-tea', '☕', (SELECT id FROM parent), 7, 'Coffee shops and tea houses'),
('Bars & Pubs', 'bars-pubs', '🍺', (SELECT id FROM parent), 8, 'Bars, pubs, and nightlife'),
('Bakeries', 'bakeries', '🥐', (SELECT id FROM parent), 9, 'Bakeries and pastry shops')
ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, description = EXCLUDED.description;

-- Seed subcategories for Shopping & Retail
WITH parent AS (SELECT id FROM public.business_categories WHERE slug = 'shopping' LIMIT 1)
INSERT INTO public.business_categories (name, slug, icon, parent_id, display_order, description) VALUES
('Clothing & Fashion', 'clothing-fashion', '👗', (SELECT id FROM parent), 1, 'Clothing stores and fashion boutiques'),
('Electronics', 'electronics', '📱', (SELECT id FROM parent), 2, 'Electronics and tech stores'),
('Home & Garden', 'home-garden', '🌿', (SELECT id FROM parent), 3, 'Home improvement and garden centers'),
('Grocery', 'grocery', '🛒', (SELECT id FROM parent), 4, 'Grocery stores and supermarkets'),
('Specialty Stores', 'specialty-stores', '🎁', (SELECT id FROM parent), 5, 'Unique and specialty retail')
ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, description = EXCLUDED.description;

-- Seed subcategories for Health & Wellness
WITH parent AS (SELECT id FROM public.business_categories WHERE slug = 'health' LIMIT 1)
INSERT INTO public.business_categories (name, slug, icon, parent_id, display_order, description) VALUES
('Gyms & Fitness', 'gyms-fitness', '🏋️', (SELECT id FROM parent), 1, 'Gyms, fitness centers, and studios'),
('Medical Clinics', 'medical-clinics', '🏥', (SELECT id FROM parent), 2, 'Doctors offices and clinics'),
('Dentists', 'dentists', '🦷', (SELECT id FROM parent), 3, 'Dental offices and orthodontists'),
('Pharmacies', 'pharmacies', '💊', (SELECT id FROM parent), 4, 'Pharmacies and drug stores'),
('Mental Health', 'mental-health', '🧠', (SELECT id FROM parent), 5, 'Therapists and counseling services')
ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, description = EXCLUDED.description;

-- Seed subcategories for Services
WITH parent AS (SELECT id FROM public.business_categories WHERE slug = 'services' LIMIT 1)
INSERT INTO public.business_categories (name, slug, icon, parent_id, display_order, description) VALUES
('Auto Services', 'auto-services', '🔧', (SELECT id FROM parent), 1, 'Auto repair and maintenance'),
('Home Services', 'home-services', '🏠', (SELECT id FROM parent), 2, 'Plumbing, electrical, and home repair'),
('Legal Services', 'legal-services', '⚖️', (SELECT id FROM parent), 3, 'Lawyers and legal assistance'),
('Financial Services', 'financial-services', '🏦', (SELECT id FROM parent), 4, 'Banks, accountants, and financial advisors'),
('Pet Services', 'pet-services', '🐾', (SELECT id FROM parent), 5, 'Vets, groomers, and pet care')
ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, description = EXCLUDED.description;

-- Seed subcategories for Beauty
WITH parent AS (SELECT id FROM public.business_categories WHERE slug = 'beauty' LIMIT 1)
INSERT INTO public.business_categories (name, slug, icon, parent_id, display_order, description) VALUES
('Hair Salons', 'hair-salons', '💇', (SELECT id FROM parent), 1, 'Hair salons and barber shops'),
('Nail Salons', 'nail-salons', '💅', (SELECT id FROM parent), 2, 'Nail salons and manicure services'),
('Spas', 'spas', '🧖', (SELECT id FROM parent), 3, 'Day spas and wellness centers'),
('Skincare', 'skincare', '✨', (SELECT id FROM parent), 4, 'Skincare and esthetician services')
ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, description = EXCLUDED.description;

-- Seed subcategories for Entertainment
WITH parent AS (SELECT id FROM public.business_categories WHERE slug = 'entertainment' LIMIT 1)
INSERT INTO public.business_categories (name, slug, icon, parent_id, display_order, description) VALUES
('Movie Theaters', 'movie-theaters', '🎬', (SELECT id FROM parent), 1, 'Cinemas and movie theaters'),
('Live Music', 'live-music', '🎸', (SELECT id FROM parent), 2, 'Venues with live music'),
('Museums & Galleries', 'museums-galleries', '🎨', (SELECT id FROM parent), 3, 'Museums and art galleries'),
('Sports & Recreation', 'sports-recreation', '⚽', (SELECT id FROM parent), 4, 'Sports venues and recreation'),
('Arcades & Games', 'arcades-games', '🎮', (SELECT id FROM parent), 5, 'Arcades and gaming centers')
ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, description = EXCLUDED.description;