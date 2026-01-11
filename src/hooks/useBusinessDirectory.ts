import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export interface BusinessFilters {
  search?: string;
  category?: string;
  subcategories?: string[];
  neighborhood?: string;
  priceLevel?: number;
  minRating?: number;
  amenities?: string[];
  sortBy?: 'recommended' | 'rating' | 'reviews' | 'newest';
}

// Available amenities for filtering
export const AMENITIES = [
  { key: 'outdoor_seating', label: 'Outdoor Seating', icon: '🪑' },
  { key: 'wheelchair_accessible', label: 'Wheelchair Accessible', icon: '♿' },
  { key: 'parking', label: 'Parking', icon: '🅿️' },
  { key: 'wifi', label: 'WiFi', icon: '📶' },
  { key: 'takeout', label: 'Takeout', icon: '🥡' },
  { key: 'delivery', label: 'Delivery', icon: '🚗' },
  { key: 'reservations', label: 'Reservations', icon: '📅' },
] as const;

// Fetch businesses with filters and pagination
export const useBusinessDirectory = (filters: BusinessFilters, pageSize: number = 24) => {
  return useInfiniteQuery({
    queryKey: ['business-directory', filters, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('businesses')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      // Apply search with improved fuzzy matching
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase().trim();
        // Search in name, short_description, description, and category
        query = query.or(
          `name.ilike.%${searchTerm}%,short_description.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`
        );
      }

      // Apply category filter (parent or subcategory)
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      // Apply subcategories filter (if parent selected with specific subcategories)
      if (filters.subcategories && filters.subcategories.length > 0) {
        query = query.overlaps('subcategories', filters.subcategories);
      }

      if (filters.neighborhood) {
        query = query.eq('neighborhood_id', filters.neighborhood);
      }

      if (filters.priceLevel) {
        query = query.eq('price_level', filters.priceLevel);
      }

      // Apply minimum rating filter
      if (filters.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      // Apply amenities filter (business must have ALL selected amenities)
      if (filters.amenities && filters.amenities.length > 0) {
        query = query.contains('amenities', filters.amenities);
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

// Fetch category counts including subcategories
export const useCategoryCounts = () => {
  return useQuery({
    queryKey: ['category-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('category, subcategories')
        .eq('status', 'active');

      if (error) throw error;

      // Count businesses per category
      const counts: Record<string, number> = {};
      data.forEach((b) => {
        counts[b.category] = (counts[b.category] || 0) + 1;
        // Also count subcategories
        if (b.subcategories && Array.isArray(b.subcategories)) {
          b.subcategories.forEach((sub: string) => {
            counts[sub] = (counts[sub] || 0) + 1;
          });
        }
      });

      return counts;
    },
    staleTime: 1000 * 60 * 10,
  });
};

// Extended category type with new fields
interface ExtendedCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  display_order: number | null;
  parent_id: string | null;
  description: string | null;
}

interface CategoryWithChildren extends ExtendedCategory {
  subcategories: ExtendedCategory[];
}

// Fetch hierarchical categories (parent + children)
export const useHierarchicalCategories = () => {
  return useQuery({
    queryKey: ['hierarchical-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_categories')
        .select('id, name, slug, icon, display_order, parent_id, description')
        .order('display_order');

      if (error) throw error;

      const typedData = data as ExtendedCategory[];

      // Separate parent categories and subcategories
      const parents = typedData.filter(c => !c.parent_id);
      const children = typedData.filter(c => c.parent_id);

      // Build hierarchical structure
      const hierarchy: CategoryWithChildren[] = parents.map(parent => ({
        ...parent,
        subcategories: children.filter(c => c.parent_id === parent.id),
      }));

      return {
        all: typedData,
        parents,
        children,
        hierarchy,
      };
    },
    staleTime: 1000 * 60 * 30,
  });
};

// Search suggestions for "Did you mean...?"
export const useSearchSuggestions = (query: string, enabled = false) => {
  return useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      // Get unique business names that are similar
      const { data, error } = await supabase
        .from('businesses')
        .select('name, category')
        .eq('status', 'active')
        .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;

      return data || [];
    },
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
};
