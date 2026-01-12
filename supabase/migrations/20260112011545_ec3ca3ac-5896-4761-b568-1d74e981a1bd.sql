-- Add external_id column to events table for deduplication
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Create unique index for external_id to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_external_id ON public.events(external_id) WHERE external_id IS NOT NULL;