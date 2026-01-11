import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

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
