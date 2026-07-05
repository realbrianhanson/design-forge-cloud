import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useLanguage } from '@/hooks/useLanguage';

// Fetch breaking news (is_breaking = true within last 24 hours)
export const useBreakingNews = () => {
  const { language } = useLanguage();
  
  return useQuery({
    queryKey: ['breaking-news', language],
    queryFn: async () => {
      const seventyTwoHoursAgo = new Date();
      seventyTwoHoursAgo.setHours(seventyTwoHoursAgo.getHours() - 72);

      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('is_breaking', true)
        .eq('status', 'active')
        .eq('language', language)
        .gte('published_at', seventyTwoHoursAgo.toISOString())
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
  const { language } = useLanguage();
  
  return useQuery({
    queryKey: ['featured-article', language],
    queryFn: async () => {
      const seventyTwoHoursAgo = new Date();
      seventyTwoHoursAgo.setHours(seventyTwoHoursAgo.getHours() - 72);

      // Prefer the most recent featured article published in the last 72h
      const { data: featured, error: featuredError } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'active')
        .eq('language', language)
        .eq('is_featured', true)
        .gte('published_at', seventyTwoHoursAgo.toISOString())
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (featuredError) throw featuredError;
      if (featured) return featured as Tables<'articles'>;

      // Fallback: newest active article
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'active')
        .eq('language', language)
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
  const { language } = useLanguage();
  
  return useQuery({
    queryKey: ['latest-articles', excludeId, limit, language],
    queryFn: async () => {
      let query = supabase
        .from('articles')
        .select('*')
        .eq('status', 'active')
        .eq('language', language)
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
  const { language } = useLanguage();
  
  return useInfiniteQuery({
    queryKey: ['infinite-articles', category, pageSize, language],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('articles')
        .select('*', { count: 'exact' })
        .eq('status', 'active')
        .eq('language', language)
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
  const { language } = useLanguage();
  
  return useQuery({
    queryKey: ['trending-articles', limit, language],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'active')
        .eq('language', language)
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
