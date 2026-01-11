-- Add source tracking columns to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Create index for deduplication lookups
CREATE INDEX IF NOT EXISTS idx_businesses_external_id ON public.businesses(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_source ON public.businesses(source);
CREATE INDEX IF NOT EXISTS idx_businesses_name_address ON public.businesses(name, address);

-- Create unique constraint on external_id per source
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_source_external_id 
ON public.businesses(source, external_id) 
WHERE external_id IS NOT NULL;