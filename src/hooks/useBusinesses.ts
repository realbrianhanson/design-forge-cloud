import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

// Fetch featured businesses
export const useFeaturedBusinesses = (limit: number = 4) => {
  return useQuery({
    queryKey: ['featured-businesses', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('status', 'active')
        .eq('is_featured', true)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Tables<'businesses'>[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Fetch single business by slug
export const useBusiness = (slug: string) => {
  return useQuery({
    queryKey: ['business', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      return data as Tables<'businesses'> | null;
    },
    enabled: !!slug,
  });
};

// Fetch business categories
export const useBusinessCategories = () => {
  return useQuery({
    queryKey: ['business-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Tables<'business_categories'>[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
