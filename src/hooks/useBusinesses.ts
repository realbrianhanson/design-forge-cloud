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

// Fetch similar businesses (same category, same neighborhood)
export const useSimilarBusinesses = (
  category: string,
  neighborhoodId: string | null,
  excludeId: string,
  limit: number = 4
) => {
  return useQuery({
    queryKey: ['similar-businesses', category, neighborhoodId, excludeId, limit],
    queryFn: async () => {
      let query = supabase
        .from('businesses')
        .select('*')
        .eq('status', 'active')
        .eq('category', category)
        .neq('id', excludeId)
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(limit);

      if (neighborhoodId) {
        query = query.eq('neighborhood_id', neighborhoodId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // If not enough results with same neighborhood, fetch more from same category
      if (data.length < limit && neighborhoodId) {
        const { data: moreData, error: moreError } = await supabase
          .from('businesses')
          .select('*')
          .eq('status', 'active')
          .eq('category', category)
          .neq('id', excludeId)
          .not('id', 'in', `(${data.map(b => b.id).join(',')})`)
          .order('rating', { ascending: false, nullsFirst: false })
          .limit(limit - data.length);

        if (!moreError && moreData) {
          return [...data, ...moreData] as Tables<'businesses'>[];
        }
      }

      return data as Tables<'businesses'>[];
    },
    enabled: !!category && !!excludeId,
    staleTime: 1000 * 60 * 10,
  });
};

// Increment view count
export const incrementBusinessViewCount = async (businessId: string) => {
  // Use raw SQL to increment - silently fail if error
  try {
    const { data: business } = await supabase
      .from('businesses')
      .select('view_count')
      .eq('id', businessId)
      .single();

    if (business) {
      await supabase
        .from('businesses')
        .update({ view_count: (business.view_count || 0) + 1 })
        .eq('id', businessId);
    }
  } catch (err) {
    // Silently fail - not critical
    console.error('Failed to increment view count:', err);
  }
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
