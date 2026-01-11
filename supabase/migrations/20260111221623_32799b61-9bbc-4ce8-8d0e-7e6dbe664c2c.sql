-- Create crime_incidents table
CREATE TABLE public.crime_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number TEXT UNIQUE NOT NULL,
  incident_type TEXT NOT NULL,
  incident_category TEXT CHECK (incident_category IN ('violent', 'property', 'other')),
  description TEXT,
  occurred_at TIMESTAMP WITH TIME ZONE,
  reported_at TIMESTAMP WITH TIME ZONE,
  address TEXT,
  neighborhood_id UUID REFERENCES public.neighborhoods(id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  zone TEXT,
  status TEXT CHECK (status IN ('open', 'closed', 'arrest_made')) DEFAULT 'open',
  source_url TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for crime_incidents
CREATE INDEX idx_crime_incidents_type ON public.crime_incidents(incident_type);
CREATE INDEX idx_crime_incidents_occurred_at ON public.crime_incidents(occurred_at DESC);
CREATE INDEX idx_crime_incidents_neighborhood ON public.crime_incidents(neighborhood_id);
CREATE INDEX idx_crime_incidents_location ON public.crime_incidents(latitude, longitude);
CREATE INDEX idx_crime_incidents_category ON public.crime_incidents(incident_category);

-- Create crime_stats_daily table for aggregated statistics
CREATE TABLE public.crime_stats_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  neighborhood_id UUID REFERENCES public.neighborhoods(id),
  incident_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (date, neighborhood_id, incident_type)
);

-- Create index for stats queries
CREATE INDEX idx_crime_stats_daily_date ON public.crime_stats_daily(date DESC);
CREATE INDEX idx_crime_stats_daily_neighborhood ON public.crime_stats_daily(neighborhood_id);

-- Enable RLS
ALTER TABLE public.crime_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crime_stats_daily ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read access for crime data
CREATE POLICY "Anyone can view crime incidents"
  ON public.crime_incidents
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage crime incidents"
  ON public.crime_incidents
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view crime stats"
  ON public.crime_stats_daily
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage crime stats"
  ON public.crime_stats_daily
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_crime_incidents_updated_at
  BEFORE UPDATE ON public.crime_incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();