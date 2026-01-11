import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CrimeIncident = {
  id: string;
  incident_number: string;
  incident_type: string;
  incident_category: 'violent' | 'property' | 'other' | null;
  description: string | null;
  occurred_at: string | null;
  reported_at: string | null;
  address: string | null;
  neighborhood_id: string | null;
  latitude: number | null;
  longitude: number | null;
  zone: string | null;
  status: string | null;
  created_at: string;
};

export type CrimeFilters = {
  dateRange: 'day' | 'week' | 'month' | 'custom';
  startDate?: Date;
  endDate?: Date;
  categories: ('violent' | 'property' | 'other')[];
  incidentTypes: string[];
  neighborhoodId?: string;
};

export type CrimeStats = {
  total: number;
  violent: number;
  property: number;
  other: number;
  previousTotal?: number;
  trendPercent?: number;
};

function getDateRangeFilter(range: CrimeFilters['dateRange'], startDate?: Date, endDate?: Date) {
  const now = new Date();
  let start: Date;
  let end: Date = endDate || now;

  switch (range) {
    case 'day':
      start = new Date(now);
      start.setHours(now.getHours() - 24);
      break;
    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start = new Date(now);
      start.setDate(now.getDate() - 30);
      break;
    case 'custom':
      start = startDate || new Date(now.setDate(now.getDate() - 7));
      break;
    default:
      start = new Date(now);
      start.setDate(now.getDate() - 7);
  }

  return { start, end };
}

export function useCrimeIncidents(filters: CrimeFilters) {
  return useQuery({
    queryKey: ['crime-incidents', filters],
    queryFn: async () => {
      const { start, end } = getDateRangeFilter(
        filters.dateRange,
        filters.startDate,
        filters.endDate
      );

      let query = supabase
        .from('crime_incidents')
        .select('*')
        .gte('occurred_at', start.toISOString())
        .lte('occurred_at', end.toISOString())
        .order('occurred_at', { ascending: false })
        .limit(1000);

      // Filter by categories
      if (filters.categories.length > 0 && filters.categories.length < 3) {
        query = query.in('incident_category', filters.categories);
      }

      // Filter by incident types
      if (filters.incidentTypes.length > 0) {
        query = query.in('incident_type', filters.incidentTypes);
      }

      // Filter by neighborhood
      if (filters.neighborhoodId) {
        query = query.eq('neighborhood_id', filters.neighborhoodId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CrimeIncident[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCrimeStats(filters: CrimeFilters) {
  return useQuery({
    queryKey: ['crime-stats', filters],
    queryFn: async () => {
      const { start, end } = getDateRangeFilter(
        filters.dateRange,
        filters.startDate,
        filters.endDate
      );

      // Get current period stats
      let query = supabase
        .from('crime_incidents')
        .select('incident_category')
        .gte('occurred_at', start.toISOString())
        .lte('occurred_at', end.toISOString());

      if (filters.neighborhoodId) {
        query = query.eq('neighborhood_id', filters.neighborhoodId);
      }

      const { data: currentData, error: currentError } = await query;
      if (currentError) throw currentError;

      // Calculate current stats
      const stats: CrimeStats = {
        total: currentData?.length || 0,
        violent: currentData?.filter(i => i.incident_category === 'violent').length || 0,
        property: currentData?.filter(i => i.incident_category === 'property').length || 0,
        other: currentData?.filter(i => i.incident_category === 'other').length || 0,
      };

      // Get previous period for trend calculation
      const periodMs = end.getTime() - start.getTime();
      const previousStart = new Date(start.getTime() - periodMs);
      const previousEnd = start;

      let prevQuery = supabase
        .from('crime_incidents')
        .select('id')
        .gte('occurred_at', previousStart.toISOString())
        .lt('occurred_at', previousEnd.toISOString());

      if (filters.neighborhoodId) {
        prevQuery = prevQuery.eq('neighborhood_id', filters.neighborhoodId);
      }

      const { data: prevData } = await prevQuery;
      
      if (prevData && prevData.length > 0) {
        stats.previousTotal = prevData.length;
        stats.trendPercent = Math.round(
          ((stats.total - prevData.length) / prevData.length) * 100
        );
      }

      return stats;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCrimeIncidentTypes() {
  return useQuery({
    queryKey: ['crime-incident-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crime_incidents')
        .select('incident_type')
        .limit(1000);

      if (error) throw error;

      // Get unique types
      const types = [...new Set(data?.map(d => d.incident_type).filter(Boolean))];
      return types.sort();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}