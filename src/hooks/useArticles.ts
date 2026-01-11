import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

// Fetch breaking news (is_breaking = true within last 24 hours)
export const useBreakingNews = () => {
  return useQuery({
    queryKey: ['breaking-news'],
    queryFn: async () => {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('is_breaking', true)
        .eq('status', 'active')
        .gte('published_at', twentyFourHoursAgo.toISOString())
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Tables<'articles'> | null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Fetch featured article
export const useFeaturedArticle = () => {
  return useQuery({
    queryKey: ['featured-article'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('is_featured', true)
        .eq('status', 'active')
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Tables<'articles'> | null;
    },
    staleTime: 1000 * 60 * 5,
  });
};

// Fetch latest articles (excluding featured)
export const useLatestArticles = (excludeId?: string, limit: number = 6) => {
  return useQuery({
    queryKey: ['latest-articles', excludeId, limit],
    queryFn: async () => {
      let query = supabase
        .from('articles')
        .select('*')
        .eq('status', 'active')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Tables<'articles'>[];
    },
    staleTime: 1000 * 60 * 5,
  });
};
