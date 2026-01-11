-- Add enhanced fields to neighborhoods table
ALTER TABLE public.neighborhoods 
ADD COLUMN IF NOT EXISTS hero_image_url text,
ADD COLUMN IF NOT EXISTS thumbnail_url text,
ADD COLUMN IF NOT EXISTS population integer,
ADD COLUMN IF NOT EXISTS established text,
ADD COLUMN IF NOT EXISTS vibe text,
ADD COLUMN IF NOT EXISTS highlights text[],
ADD COLUMN IF NOT EXISTS external_links jsonb,
ADD COLUMN IF NOT EXISTS boundaries jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.neighborhoods.vibe IS 'Short description of neighborhood character, e.g. "Artsy & Historic"';
COMMENT ON COLUMN public.neighborhoods.highlights IS 'Array of notable landmarks and features';
COMMENT ON COLUMN public.neighborhoods.external_links IS 'JSON object with links like {neighborhood_association: "url", wikipedia: "url"}';
COMMENT ON COLUMN public.neighborhoods.boundaries IS 'GeoJSON polygon for neighborhood boundaries';