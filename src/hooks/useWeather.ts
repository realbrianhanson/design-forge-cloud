import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WeatherCurrent {
  id: string;
  location: string;
  temperature_f: number | null;
  temperature_c: number | null;
  conditions: string | null;
  conditions_icon: string | null;
  humidity: number | null;
  wind_speed: string | null;
  wind_direction: string | null;
  feels_like_f: number | null;
  updated_at: string | null;
}

export interface WeatherForecast {
  id: string;
  location: string;
  forecast_date: string;
  period_name: string;
  is_daytime: boolean | null;
  temperature: number | null;
  temperature_unit: string | null;
  conditions: string | null;
  conditions_icon: string | null;
  precipitation_chance: number | null;
  detailed_forecast: string | null;
  created_at: string | null;
}

export interface WeatherAlert {
  id: string;
  alert_id: string;
  event: string;
  severity: string | null;
  urgency: string | null;
  headline: string | null;
  description: string | null;
  instruction: string | null;
  areas: string[] | null;
  effective_at: string | null;
  expires_at: string | null;
  status: string | null;
  created_at: string | null;
}

export function useCurrentWeather(location = 'jacksonville') {
  return useQuery({
    queryKey: ['weather', 'current', location],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weather_current')
        .select('*')
        .eq('location', location)
        .single();

      if (error) throw error;
      return data as WeatherCurrent;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useWeatherForecast(location = 'jacksonville', limit?: number) {
  return useQuery({
    queryKey: ['weather', 'forecast', location, limit],
    queryFn: async () => {
      let query = supabase
        .from('weather_forecast')
        .select('*')
        .eq('location', location)
        .order('forecast_date', { ascending: true })
        .order('is_daytime', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as WeatherForecast[];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useWeatherAlerts() {
  return useQuery({
    queryKey: ['weather', 'alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weather_alerts')
        .select('*')
        .eq('status', 'active')
        .order('severity', { ascending: true })
        .order('effective_at', { ascending: false });

      if (error) throw error;
      return data as WeatherAlert[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Map NWS conditions to emoji icons
export function getWeatherEmoji(conditions: string | null): string {
  if (!conditions) return '🌤️';
  
  const lower = conditions.toLowerCase();
  
  if (lower.includes('thunder') || lower.includes('storm')) return '⛈️';
  if (lower.includes('rain') || lower.includes('shower')) return '🌧️';
  if (lower.includes('snow') || lower.includes('flurr')) return '🌨️';
  if (lower.includes('fog') || lower.includes('mist') || lower.includes('haze')) return '🌫️';
  if (lower.includes('cloud') && lower.includes('part')) return '⛅';
  if (lower.includes('cloud') || lower.includes('overcast')) return '☁️';
  if (lower.includes('clear') || lower.includes('sunny') || lower.includes('fair')) return '☀️';
  if (lower.includes('hot')) return '🌡️';
  if (lower.includes('wind')) return '💨';
  
  return '🌤️';
}

// Get alert severity color classes
export function getAlertStyles(severity: string | null): { bg: string; text: string; border: string } {
  switch (severity?.toLowerCase()) {
    case 'extreme':
      return { 
        bg: 'bg-destructive', 
        text: 'text-destructive-foreground', 
        border: 'border-destructive' 
      };
    case 'severe':
      return { 
        bg: 'bg-warning', 
        text: 'text-warning-foreground', 
        border: 'border-warning' 
      };
    case 'moderate':
      return { 
        bg: 'bg-warning/80', 
        text: 'text-warning-foreground', 
        border: 'border-warning/80' 
      };
    default:
      return { 
        bg: 'bg-accent', 
        text: 'text-accent-foreground', 
        border: 'border-accent' 
      };
  }
}
