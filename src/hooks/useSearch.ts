import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type SearchResultType = 'article' | 'event' | 'business';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  excerpt?: string;
  date?: string;
  category?: string;
  neighborhood?: string;
  slug?: string;
  image_url?: string;
}

export interface SearchResults {
  articles: SearchResult[];
  events: SearchResult[];
  businesses: SearchResult[];
  totalCount: number;
}

async function searchDatabase(query: string, type: 'all' | SearchResultType = 'all'): Promise<SearchResults> {
  if (!query || query.trim().length < 2) {
    return { articles: [], events: [], businesses: [], totalCount: 0 };
  }

  const searchPattern = `%${query.trim()}%`;
  const results: SearchResults = { articles: [], events: [], businesses: [], totalCount: 0 };

  // Search articles
  if (type === 'all' || type === 'article') {
    const { data: articles } = await supabase
      .from('articles')
      .select('id, title, excerpt, ai_summary, slug, category, published_at, image_url')
      .eq('status', 'active')
      .or(`title.ilike.${searchPattern},excerpt.ilike.${searchPattern},ai_summary.ilike.${searchPattern}`)
      .order('published_at', { ascending: false })
      .limit(type === 'all' ? 5 : 20);

    if (articles) {
      results.articles = articles.map((article) => ({
        id: article.id,
        type: 'article' as SearchResultType,
        title: article.title,
        excerpt: article.excerpt || article.ai_summary || undefined,
        date: article.published_at || undefined,
        category: article.category,
        slug: article.slug || undefined,
        image_url: article.image_url || undefined,
      }));
    }
  }

  // Search events
  if (type === 'all' || type === 'event') {
    const now = new Date().toISOString();
    const { data: events } = await supabase
      .from('events')
      .select('id, title, short_description, description, slug, category, start_time, location_name, image_url')
      .eq('status', 'approved')
      .gte('start_time', now)
      .or(`title.ilike.${searchPattern},short_description.ilike.${searchPattern},description.ilike.${searchPattern}`)
      .order('start_time', { ascending: true })
      .limit(type === 'all' ? 3 : 20);

    if (events) {
      results.events = events.map((event) => ({
        id: event.id,
        type: 'event' as SearchResultType,
        title: event.title,
        excerpt: event.short_description || event.description?.substring(0, 150) || undefined,
        date: event.start_time,
        category: event.category,
        slug: event.slug || undefined,
        neighborhood: event.location_name || undefined,
        image_url: event.image_url || undefined,
      }));
    }
  }

  // Search businesses
  if (type === 'all' || type === 'business') {
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, name, short_description, description, slug, category, logo_url, cover_image_url')
      .eq('status', 'active')
      .or(`name.ilike.${searchPattern},short_description.ilike.${searchPattern},description.ilike.${searchPattern},category.ilike.${searchPattern}`)
      .order('rating', { ascending: false })
      .limit(type === 'all' ? 3 : 20);

    if (businesses) {
      results.businesses = businesses.map((business) => ({
        id: business.id,
        type: 'business' as SearchResultType,
        title: business.name,
        excerpt: business.short_description || business.description?.substring(0, 150) || undefined,
        category: business.category,
        slug: business.slug,
        image_url: business.logo_url || business.cover_image_url || undefined,
      }));
    }
  }

  results.totalCount = results.articles.length + results.events.length + results.businesses.length;
  return results;
}

export function useSearch(query: string, type: 'all' | SearchResultType = 'all', enabled = true) {
  return useQuery({
    queryKey: ['search', query, type],
    queryFn: () => searchDatabase(query, type),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 30000, // 30 seconds
  });
}
