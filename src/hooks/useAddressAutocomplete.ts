import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AddressSuggestion {
  place_id: string;
  formatted: string;
  address_line1: string;
  address_line2: string;
  street?: string;
  housenumber?: string;
  city?: string;
  state?: string;
  postcode?: string;
  lat: number;
  lon: number;
}

interface UseAddressAutocompleteOptions {
  debounceMs?: number;
  minChars?: number;
}

export function useAddressAutocomplete(options: UseAddressAutocompleteOptions = {}) {
  const { debounceMs = 300, minChars = 3 } = options;
  
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const searchAddress = useCallback(async (text: string) => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    
    if (!text || text.length < minChars) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      
      abortRef.current = new AbortController();
      
      try {
        // Call the edge function for address autocomplete
        const { data, error: fnError } = await supabase.functions.invoke('geocode-address', {
          body: { text, action: 'autocomplete' },
        });
        
        if (fnError) throw fnError;
        
        setSuggestions(data?.suggestions || []);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Address autocomplete error:', err);
          setError(err.message || 'Failed to fetch suggestions');
        }
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);
  }, [debounceMs, minChars]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    searchAddress,
    clearSuggestions,
  };
}

// Category suggestion based on business name keywords
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  restaurants: ['restaurant', 'grill', 'pizza', 'cafe', 'coffee', 'diner', 'bistro', 'kitchen', 'steakhouse', 'sushi', 'tacos', 'burgers', 'bbq', 'seafood', 'bakery', 'deli'],
  shopping: ['shop', 'store', 'boutique', 'market', 'mall', 'outlet', 'retail', 'clothing', 'apparel', 'fashion', 'gifts', 'antiques'],
  health: ['medical', 'clinic', 'hospital', 'pharmacy', 'dental', 'dentist', 'doctor', 'health', 'wellness', 'therapy', 'chiropractic', 'veterinary', 'vet'],
  beauty: ['salon', 'spa', 'beauty', 'hair', 'nails', 'barber', 'cosmetics', 'aesthetics', 'skincare', 'massage'],
  fitness: ['gym', 'fitness', 'yoga', 'pilates', 'crossfit', 'training', 'workout', 'athletic'],
  automotive: ['auto', 'car', 'tire', 'mechanic', 'repair', 'dealership', 'collision', 'body shop', 'oil change', 'detailing'],
  professional: ['law', 'attorney', 'lawyer', 'accounting', 'cpa', 'insurance', 'financial', 'consulting', 'realtor', 'real estate', 'bank'],
  entertainment: ['theater', 'cinema', 'museum', 'gallery', 'bowling', 'arcade', 'entertainment', 'amusement', 'club', 'bar', 'lounge'],
  'home-services': ['plumber', 'plumbing', 'electric', 'hvac', 'landscaping', 'roofing', 'cleaning', 'painting', 'construction', 'remodeling'],
};

export function suggestCategory(businessName: string): string | null {
  const nameLower = businessName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword)) {
        return category;
      }
    }
  }
  
  return null;
}

// Check for potential duplicate businesses
export async function checkDuplicates(name: string, address?: string): Promise<{
  hasDuplicates: boolean;
  duplicates: Array<{ id: string; name: string; address: string | null; slug: string }>;
}> {
  if (!name || name.length < 3) {
    return { hasDuplicates: false, duplicates: [] };
  }
  
  try {
    // Search by name similarity
    const { data: nameMatches } = await supabase
      .from('businesses')
      .select('id, name, address, slug')
      .ilike('name', `%${name}%`)
      .eq('status', 'active')
      .limit(5);
    
    let duplicates = nameMatches || [];
    
    // If address provided, also search by address
    if (address && address.length > 5) {
      const { data: addressMatches } = await supabase
        .from('businesses')
        .select('id, name, address, slug')
        .ilike('address', `%${address.split(' ').slice(0, 3).join('%')}%`)
        .eq('status', 'active')
        .limit(5);
      
      // Merge and deduplicate
      if (addressMatches) {
        const existingIds = new Set(duplicates.map(d => d.id));
        for (const match of addressMatches) {
          if (!existingIds.has(match.id)) {
            duplicates.push(match);
          }
        }
      }
    }
    
    return {
      hasDuplicates: duplicates.length > 0,
      duplicates: duplicates.slice(0, 5),
    };
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return { hasDuplicates: false, duplicates: [] };
  }
}
