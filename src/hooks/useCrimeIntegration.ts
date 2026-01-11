import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CrimeStats } from '@/hooks/useCrimeData';

export function useNeighborhoodCrimeStats(neighborhoodId: string | undefined, days: number = 7) {
  return useQuery({
    queryKey: ['neighborhood-crime-stats', neighborhoodId, days],
    queryFn: async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Get neighborhood stats
      let query = supabase
        .from('crime_incidents')
        .select('incident_category')
        .gte('occurred_at', cutoffDate.toISOString());

      if (neighborhoodId) {
        query = query.eq('neighborhood_id', neighborhoodId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats: CrimeStats = {
        total: data?.length || 0,
        violent: data?.filter(i => i.incident_category === 'violent').length || 0,
        property: data?.filter(i => i.incident_category === 'property').length || 0,
        other: data?.filter(i => i.incident_category === 'other').length || 0,
      };

      // Get city-wide stats for comparison
      const { data: cityData } = await supabase
        .from('crime_incidents')
        .select('id')
        .gte('occurred_at', cutoffDate.toISOString());

      const cityTotal = cityData?.length || 0;

      // Get neighborhood count for average calculation
      const { data: neighborhoods } = await supabase
        .from('neighborhoods')
        .select('id');

      const neighborhoodCount = neighborhoods?.length || 1;
      const cityAverage = Math.round(cityTotal / neighborhoodCount);

      return {
        stats,
        cityAverage,
        comparisonPercent: cityAverage > 0 
          ? Math.round(((stats.total - cityAverage) / cityAverage) * 100)
          : 0,
      };
    },
    enabled: true,
    staleTime: 1000 * 60 * 10,
  });
}

export function useDailyCrimeDigest(date?: Date) {
  const targetDate = date || new Date();
  
  return useQuery({
    queryKey: ['daily-crime-digest', targetDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all incidents for the day
      const { data: incidents, error } = await supabase
        .from('crime_incidents')
        .select(`
          *,
          neighborhoods:neighborhood_id (name)
        `)
        .gte('occurred_at', startOfDay.toISOString())
        .lte('occurred_at', endOfDay.toISOString())
        .order('occurred_at', { ascending: false });

      if (error) throw error;

      // Category breakdown
      const byCategory = {
        violent: incidents?.filter(i => i.incident_category === 'violent') || [],
        property: incidents?.filter(i => i.incident_category === 'property') || [],
        other: incidents?.filter(i => i.incident_category === 'other') || [],
      };

      // Neighborhood breakdown
      const byNeighborhood: Record<string, number> = {};
      incidents?.forEach(incident => {
        const name = (incident.neighborhoods as { name: string } | null)?.name || 'Unknown';
        byNeighborhood[name] = (byNeighborhood[name] || 0) + 1;
      });

      // Sort neighborhoods by count
      const neighborhoodRanking = Object.entries(byNeighborhood)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Notable incidents (violent crimes)
      const notableIncidents = byCategory.violent.slice(0, 5);

      return {
        date: targetDate,
        total: incidents?.length || 0,
        byCategory: {
          violent: byCategory.violent.length,
          property: byCategory.property.length,
          other: byCategory.other.length,
        },
        neighborhoodRanking,
        notableIncidents,
        allIncidents: incidents || [],
      };
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function useRelatedCrimeIncident(incidentId: string | null | undefined) {
  return useQuery({
    queryKey: ['related-crime-incident', incidentId],
    queryFn: async () => {
      if (!incidentId) return null;

      const { data, error } = await supabase
        .from('crime_incidents')
        .select('*')
        .eq('id', incidentId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!incidentId,
  });
}