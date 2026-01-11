import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

// Fetch upcoming events
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
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Fetch single event by slug or id
export const useEvent = (slugOrId: string) => {
  return useQuery({
    queryKey: ['event', slugOrId],
    queryFn: async () => {
      // First try by slug
      let { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slugOrId)
        .eq('status', 'approved')
        .maybeSingle();

      if (!data && !error) {
        // Try by id
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
