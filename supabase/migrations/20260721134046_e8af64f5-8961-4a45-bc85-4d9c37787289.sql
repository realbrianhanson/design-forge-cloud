-- Hide business contact info (email, phone) from anonymous public visitors.
-- Authenticated users can still view full details via column privileges + existing RLS.
REVOKE SELECT ON public.businesses FROM anon;
GRANT SELECT (
  id, name, slug, description, short_description, category, subcategories,
  address, city, state, zip_code, neighborhood_id, website, hours,
  price_level, rating, review_count, logo_url, cover_image_url, gallery_urls,
  claimed, verified, is_featured, status, view_count, created_at, updated_at,
  source, external_id, last_synced_at, latitude, longitude, amenities
) ON public.businesses TO anon;