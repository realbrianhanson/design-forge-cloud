import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export interface BusinessFilters {
  search?: string;
  category?: string;
  neighborhood?: string;
  priceLevel?: number;
  sortBy?: 'recommended' | 'rating' | 'reviews' | 'newest';
}

// Fetch businesses with filters and pagination
export const useBusinessDirectory = (filters: BusinessFilters, pageSize: number = 24) => {
  return useInfiniteQuery({
    queryKey: ['business-directory', filters, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('businesses')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.neighborhood) {
        query = query.eq('neighborhood_id', filters.neighborhood);
      }

      if (filters.priceLevel) {
        query = query.eq('price_level', filters.priceLevel);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'rating':
          query = query.order('rating', { ascending: false, nullsFirst: false });
          break;
        case 'reviews':
          query = query.order('review_count', { ascending: false, nullsFirst: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          // Recommended: featured first, then by rating
          query = query
            .order('is_featured', { ascending: false })
            .order('rating', { ascending: false, nullsFirst: false });
      }

      // Apply pagination
      query = query.range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        businesses: data as Tables<'businesses'>[],
        nextPage: data.length === pageSize ? pageParam + 1 : undefined,
        totalCount: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
  });
};

// Fetch category counts
export const useCategoryCounts = () => {
  return useQuery({
    queryKey: ['category-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('category')
        .eq('status', 'active');

      if (error) throw error;

      // Count businesses per category
      const counts: Record<string, number> = {};
      data.forEach((b) => {
        counts[b.category] = (counts[b.category] || 0) + 1;
      });

      return counts;
    },
    staleTime: 1000 * 60 * 10,
  });
};
