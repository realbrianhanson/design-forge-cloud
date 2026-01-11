import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
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
    staleTime: 1000 * 60 * 5,
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

// Infinite scroll articles with optional category filter
export const useInfiniteArticles = (category: string = '', pageSize: number = 10) => {
  return useInfiniteQuery({
    queryKey: ['infinite-articles', category, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('articles')
        .select('*', { count: 'exact' })
        .eq('status', 'active')
        .order('published_at', { ascending: false })
        .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

      if (category) {
        // Case-insensitive category match
        query = query.ilike('category', category);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      
      return {
        articles: data as Tables<'articles'>[],
        nextPage: data.length === pageSize ? pageParam + 1 : undefined,
        totalCount: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
  });
};

// Fetch trending articles (by view_count in last 7 days)
export const useTrendingArticles = (limit: number = 5) => {
  return useQuery({
    queryKey: ['trending-articles', limit],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'active')
        .gte('published_at', sevenDaysAgo.toISOString())
        .order('view_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Tables<'articles'>[];
    },
    staleTime: 1000 * 60 * 10,
  });
};

// Fetch single article by slug or id
export const useArticle = (slugOrId: string) => {
  return useQuery({
    queryKey: ['article', slugOrId],
    queryFn: async () => {
      // First try by slug
      let { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slugOrId)
        .eq('status', 'active')
        .maybeSingle();

      if (!data && !error) {
        // Try by id
        const result = await supabase
          .from('articles')
          .select('*')
          .eq('id', slugOrId)
          .eq('status', 'active')
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      return data as Tables<'articles'> | null;
    },
    enabled: !!slugOrId,
  });
};

// Fetch related articles (same category, excluding current)
export const useRelatedArticles = (category: string, excludeId: string, limit: number = 3) => {
  return useQuery({
    queryKey: ['related-articles', category, excludeId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'active')
        .eq('category', category)
        .neq('id', excludeId)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Tables<'articles'>[];
    },
    enabled: !!category && !!excludeId,
    staleTime: 1000 * 60 * 10,
  });
};
