-- Drop and recreate the category check constraint to include 'government'
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_category_check;
ALTER TABLE public.events ADD CONSTRAINT events_category_check 
CHECK (category = ANY (ARRAY['music', 'sports', 'family', 'food', 'arts', 'community', 'business', 'nightlife', 'government']));

-- Create a table to track city event imports for logging (if not exists)
CREATE TABLE IF NOT EXISTS public.city_event_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  events_fetched INTEGER NOT NULL DEFAULT 0,
  events_created INTEGER NOT NULL DEFAULT 0,
  events_updated INTEGER NOT NULL DEFAULT 0,
  events_skipped INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  success BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on the imports table
ALTER TABLE public.city_event_imports ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage import logs
CREATE POLICY "Admins can manage city event imports"
ON public.city_event_imports
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view import stats (for transparency)
CREATE POLICY "Anyone can view import stats"
ON public.city_event_imports
FOR SELECT
USING (true);