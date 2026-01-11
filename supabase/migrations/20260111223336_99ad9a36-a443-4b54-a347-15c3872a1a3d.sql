-- Create weather_current table
CREATE TABLE public.weather_current (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL DEFAULT 'jacksonville',
  temperature_f INTEGER,
  temperature_c INTEGER,
  conditions TEXT,
  conditions_icon TEXT,
  humidity INTEGER,
  wind_speed TEXT,
  wind_direction TEXT,
  feels_like_f INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(location)
);

-- Create weather_forecast table
CREATE TABLE public.weather_forecast (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL DEFAULT 'jacksonville',
  forecast_date DATE NOT NULL,
  period_name TEXT NOT NULL,
  is_daytime BOOLEAN DEFAULT true,
  temperature INTEGER,
  temperature_unit TEXT DEFAULT 'F',
  conditions TEXT,
  conditions_icon TEXT,
  precipitation_chance INTEGER,
  detailed_forecast TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(location, forecast_date, period_name)
);

-- Create weather_alerts table
CREATE TABLE public.weather_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id TEXT UNIQUE NOT NULL,
  event TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('extreme', 'severe', 'moderate', 'minor', 'unknown')),
  urgency TEXT CHECK (urgency IN ('immediate', 'expected', 'future', 'past', 'unknown')),
  headline TEXT,
  description TEXT,
  instruction TEXT,
  areas TEXT[],
  effective_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_weather_forecast_date ON public.weather_forecast(forecast_date);
CREATE INDEX idx_weather_forecast_location ON public.weather_forecast(location);
CREATE INDEX idx_weather_alerts_status ON public.weather_alerts(status);
CREATE INDEX idx_weather_alerts_expires ON public.weather_alerts(expires_at);

-- Enable RLS
ALTER TABLE public.weather_current ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_forecast ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;

-- Public read access for weather data
CREATE POLICY "Anyone can view current weather"
  ON public.weather_current FOR SELECT USING (true);

CREATE POLICY "Anyone can view weather forecast"
  ON public.weather_forecast FOR SELECT USING (true);

CREATE POLICY "Anyone can view weather alerts"
  ON public.weather_alerts FOR SELECT USING (true);

-- Admin management
CREATE POLICY "Admins can manage current weather"
  ON public.weather_current FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage weather forecast"
  ON public.weather_forecast FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage weather alerts"
  ON public.weather_alerts FOR ALL USING (has_role(auth.uid(), 'admin'));