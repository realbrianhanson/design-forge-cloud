import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { CrimeIncident } from '@/hooks/useCrimeData';
import { subDays } from 'date-fns';

// Fetch all neighborhoods
export const useNeighborhoods = () => {
  return useQuery({
    queryKey: ['neighborhoods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Tables<'neighborhoods'>[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour - neighborhoods rarely change
  });
};

// Fetch single neighborhood by slug
export const useNeighborhood = (slug: string) => {
  return useQuery({
    queryKey: ['neighborhood', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data as Tables<'neighborhoods'> | null;
    },
    enabled: !!slug,
  });
};

// Create a map of neighborhood id to name for quick lookups
export const useNeighborhoodMap = () => {
  const { data: neighborhoods } = useNeighborhoods();
  
  const map = new Map<string, string>();
  neighborhoods?.forEach(n => {
    map.set(n.id, n.name);
  });
  
  return map;
};

// Fetch neighborhood stats (articles, events, businesses counts)
export const useNeighborhoodStats = (neighborhoodId: string | undefined) => {
  return useQuery({
    queryKey: ['neighborhood-stats', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return { articleCount: 0, eventCount: 0, businessCount: 0 };

      const oneWeekAgo = subDays(new Date(), 7).toISOString();
      
      // Fetch counts in parallel
      const [articlesRes, eventsRes, businessesRes] = await Promise.all([
        supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .eq('neighborhood_id', neighborhoodId)
          .eq('status', 'active')
          .gte('published_at', oneWeekAgo),
        supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('neighborhood_id', neighborhoodId)
          .eq('status', 'approved')
          .gte('start_time', new Date().toISOString()),
        supabase
          .from('businesses')
          .select('id', { count: 'exact', head: true })
          .eq('neighborhood_id', neighborhoodId)
          .eq('status', 'active'),
      ]);

      return {
        articleCount: articlesRes.count || 0,
        eventCount: eventsRes.count || 0,
        businessCount: businessesRes.count || 0,
      };
    },
    enabled: !!neighborhoodId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Fetch articles for a neighborhood
export const useNeighborhoodArticles = (neighborhoodId: string | undefined, limit = 10) => {
  return useQuery({
    queryKey: ['neighborhood-articles', neighborhoodId, limit],
    queryFn: async () => {
      if (!neighborhoodId) return [];

      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .eq('status', 'active')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Tables<'articles'>[];
    },
    enabled: !!neighborhoodId,
  });
};

// Fetch events for a neighborhood
export const useNeighborhoodEvents = (neighborhoodId: string | undefined, limit = 10) => {
  return useQuery({
    queryKey: ['neighborhood-events', neighborhoodId, limit],
    queryFn: async () => {
      if (!neighborhoodId) return [];

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .eq('status', 'approved')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as Tables<'events'>[];
    },
    enabled: !!neighborhoodId,
  });
};

// Fetch businesses for a neighborhood
export const useNeighborhoodBusinesses = (neighborhoodId: string | undefined, limit = 20) => {
  return useQuery({
    queryKey: ['neighborhood-businesses', neighborhoodId, limit],
    queryFn: async () => {
      if (!neighborhoodId) return [];

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .eq('status', 'active')
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(limit);

      if (error) throw error;
      return data as Tables<'businesses'>[];
    },
    enabled: !!neighborhoodId,
  });
};

// Fetch top-rated businesses for sidebar
export const useNeighborhoodTopBusinesses = (neighborhoodId: string | undefined) => {
  return useQuery({
    queryKey: ['neighborhood-top-businesses', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return [];

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .eq('status', 'active')
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(3);

      if (error) throw error;
      return data as Tables<'businesses'>[];
    },
    enabled: !!neighborhoodId,
  });
};

// Fetch crime incidents for a neighborhood
export const useNeighborhoodCrimeStats = (neighborhoodId: string | undefined) => {
  return useQuery({
    queryKey: ['neighborhood-crime-stats', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return { incidents: [] as CrimeIncident[], totalCount: 0 };

      const sevenDaysAgo = subDays(new Date(), 7).toISOString();

      const { data, error, count } = await supabase
        .from('crime_incidents')
        .select('*', { count: 'exact' })
        .eq('neighborhood_id', neighborhoodId)
        .gte('occurred_at', sevenDaysAgo)
        .order('occurred_at', { ascending: false });

      if (error) throw error;
      
      // Map to CrimeIncident type with proper category typing
      const incidents: CrimeIncident[] = (data || []).map(item => ({
        ...item,
        incident_category: (item.incident_category as 'violent' | 'property' | 'other') || null,
      }));
      
      return {
        incidents,
        totalCount: count || 0,
      };
    },
    enabled: !!neighborhoodId,
  });
};

// Fetch all neighborhoods with their stats for the index page
export const useNeighborhoodsWithStats = () => {
  return useQuery({
    queryKey: ['neighborhoods-with-stats'],
    queryFn: async () => {
      // First get all neighborhoods
      const { data: neighborhoods, error: neighborhoodsError } = await supabase
        .from('neighborhoods')
        .select('*')
        .order('display_order', { ascending: true });

      if (neighborhoodsError) throw neighborhoodsError;

      // Get counts for each neighborhood in parallel
      const statsPromises = neighborhoods.map(async (n) => {
        const oneWeekAgo = subDays(new Date(), 7).toISOString();
        
        const [articlesRes, eventsRes, businessesRes] = await Promise.all([
          supabase
            .from('articles')
            .select('id', { count: 'exact', head: true })
            .eq('neighborhood_id', n.id)
            .eq('status', 'active')
            .gte('published_at', oneWeekAgo),
          supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .eq('neighborhood_id', n.id)
            .eq('status', 'approved')
            .gte('start_time', new Date().toISOString()),
          supabase
            .from('businesses')
            .select('id', { count: 'exact', head: true })
            .eq('neighborhood_id', n.id)
            .eq('status', 'active'),
        ]);

        return {
          neighborhood: n as Tables<'neighborhoods'>,
          stats: {
            articleCount: articlesRes.count || 0,
            eventCount: eventsRes.count || 0,
            businessCount: businessesRes.count || 0,
          },
        };
      });

      return Promise.all(statsPromises);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
