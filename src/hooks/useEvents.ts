import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, isFriday, nextFriday, nextSunday } from 'date-fns';

export type DateFilter = 'all' | 'today' | 'weekend' | 'week' | 'month';

interface EventFilters {
  dateFilter?: DateFilter;
  category?: string;
  neighborhoodId?: string;
  priceType?: string;
}

const getDateRange = (filter: DateFilter) => {
  const now = new Date();
  
  switch (filter) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'weekend': {
      // Weekend is Friday 6pm to Sunday 11:59pm
      const friday = isFriday(now) ? now : nextFriday(now);
      const sunday = nextSunday(friday);
      return { start: friday, end: endOfDay(sunday) };
    }
    case 'week':
      return { start: startOfDay(now), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'month':
      return { start: startOfDay(now), end: endOfMonth(now) };
    case 'all':
    default:
      return { start: startOfDay(now), end: null };
  }
};

// Fetch upcoming events with filters
export const useUpcomingEvents = (limit: number = 4) => {
  return useQuery({
    queryKey: ['upcoming-events', limit],
    queryFn: async () => {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'approved')
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as Tables<'events'>[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

// Infinite scroll events with filters
export const useInfiniteEvents = (filters: EventFilters, pageSize: number = 20) => {
  return useInfiniteQuery({
    queryKey: ['infinite-events', filters, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      const dateRange = filters.dateFilter ? getDateRange(filters.dateFilter) : getDateRange('all');
      
      let query = supabase
        .from('events')
        .select('*', { count: 'exact' })
        .eq('status', 'approved')
        .gte('start_time', dateRange.start.toISOString())
        .order('start_time', { ascending: true })
        .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

      if (dateRange.end) {
        query = query.lte('start_time', dateRange.end.toISOString());
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.neighborhoodId) {
        query = query.eq('neighborhood_id', filters.neighborhoodId);
      }

      if (filters.priceType === 'free') {
        query = query.eq('price_type', 'free');
      } else if (filters.priceType === 'paid') {
        query = query.neq('price_type', 'free');
      }

      const { data, error, count } = await query;

      if (error) throw error;
      
      return {
        events: data as Tables<'events'>[],
        nextPage: data.length === pageSize ? pageParam + 1 : undefined,
        totalCount: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
  });
};

// Fetch featured events
export const useFeaturedEvents = (limit: number = 5) => {
  return useQuery({
    queryKey: ['featured-events', limit],
    queryFn: async () => {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'approved')
        .eq('is_featured', true)
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as Tables<'events'>[];
    },
    staleTime: 1000 * 60 * 10,
  });
};

// Fetch single event by slug or id
export const useEvent = (slugOrId: string) => {
  return useQuery({
    queryKey: ['event', slugOrId],
    queryFn: async () => {
      let { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slugOrId)
        .eq('status', 'approved')
        .maybeSingle();

      if (!data && !error) {
        const result = await supabase
          .from('events')
          .select('*')
          .eq('id', slugOrId)
          .eq('status', 'approved')
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      return data as Tables<'events'> | null;
    },
    enabled: !!slugOrId,
  });
};

// Fetch similar events (same category or neighborhood, excluding current)
export const useSimilarEvents = (
  category: string, 
  excludeId: string, 
  neighborhoodId: string,
  limit: number = 4
) => {
  return useQuery({
    queryKey: ['similar-events', category, excludeId, neighborhoodId, limit],
    queryFn: async () => {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'approved')
        .eq('category', category)
        .neq('id', excludeId)
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as Tables<'events'>[];
    },
    enabled: !!category && !!excludeId,
    staleTime: 1000 * 60 * 10,
  });
};
