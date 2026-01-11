-- Add related_incident_id to articles table
ALTER TABLE public.articles 
ADD COLUMN related_incident_id UUID REFERENCES public.crime_incidents(id);

-- Create index for the foreign key
CREATE INDEX idx_articles_related_incident ON public.articles(related_incident_id) WHERE related_incident_id IS NOT NULL;