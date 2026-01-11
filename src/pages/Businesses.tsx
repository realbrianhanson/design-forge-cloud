import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Plus, Building2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BusinessCard, BusinessCardSkeleton } from '@/components/directory/BusinessCard';
import { CategoryTabs } from '@/components/directory/CategoryTabs';
import { EnhancedFilterBar } from '@/components/directory/EnhancedFilterBar';
import { SearchSuggestions } from '@/components/directory/SearchSuggestions';
import { 
  useBusinessDirectory, 
  useCategoryCounts, 
  useHierarchicalCategories,
  useSearchSuggestions,
  BusinessFilters 
} from '@/hooks/useBusinessDirectory';
import { useNeighborhoods, useNeighborhoodMap } from '@/hooks/useNeighborhoods';

const Businesses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

  // Get filter values from URL
  const filters: BusinessFilters = useMemo(() => ({
    search: searchParams.get('q') || undefined,
    category: searchParams.get('category') || undefined,
    subcategories: searchParams.get('subcategories')?.split(',').filter(Boolean) || [],
    neighborhood: searchParams.get('neighborhood') || undefined,
    priceLevel: searchParams.get('price') ? parseInt(searchParams.get('price')!) : undefined,
    minRating: searchParams.get('rating') ? parseFloat(searchParams.get('rating')!) : undefined,
    amenities: searchParams.get('amenities')?.split(',').filter(Boolean) || [],
    sortBy: (searchParams.get('sort') as BusinessFilters['sortBy']) || 'recommended',
  }), [searchParams]);

  // Data hooks
  const { data: hierarchicalData, isLoading: categoriesLoading } = useHierarchicalCategories();
  const { data: neighborhoods = [] } = useNeighborhoods();
  const { data: categoryCounts = {} } = useCategoryCounts();
  const neighborhoodMap = useNeighborhoodMap();

  // Search suggestions for "did you mean"
  const { data: searchSuggestions = [] } = useSearchSuggestions(
    filters.search || '', 
    // Only show suggestions when we have a search with no results
    !!filters.search
  );

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useBusinessDirectory(filters);

  // Flatten paginated results
  const businesses = useMemo(() => {
    return data?.pages.flatMap(page => page.businesses) || [];
  }, [data]);

  const totalCount = data?.pages[0]?.totalCount || 0;

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.neighborhood) count++;
    if (filters.priceLevel) count++;
    if (filters.minRating) count++;
    if (filters.amenities && filters.amenities.length > 0) count += filters.amenities.length;
    if (filters.subcategories && filters.subcategories.length > 0) count += filters.subcategories.length;
    return count;
  }, [filters]);

  // Update URL params
  const updateFilter = useCallback((key: string, value: string | string[] | undefined) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (Array.isArray(value)) {
      if (value.length > 0) {
        newParams.set(key, value.join(','));
      } else {
        newParams.delete(key);
      }
    } else if (value && value !== 'all' && value !== 'any') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('q', searchInput);
  };

  const handleCategorySelect = (category: string) => {
    updateFilter('category', category);
    // Clear subcategories when switching parent category
    updateFilter('subcategories', []);
  };

  const handleSubcategoryToggle = (subcategory: string) => {
    const current = filters.subcategories || [];
    const updated = current.includes(subcategory)
      ? current.filter(s => s !== subcategory)
      : [...current, subcategory];
    updateFilter('subcategories', updated);
  };

  const handleAmenityToggle = (amenity: string) => {
    const current = filters.amenities || [];
    const updated = current.includes(amenity)
      ? current.filter(a => a !== amenity)
      : [...current, amenity];
    updateFilter('amenities', updated);
  };

  const handleClearFilters = () => {
    const newParams = new URLSearchParams();
    // Keep category and search
    if (filters.category) newParams.set('category', filters.category);
    if (filters.search) newParams.set('q', filters.search);
    setSearchParams(newParams);
  };

  const handleSuggestionClick = (query: string) => {
    setSearchInput(query);
    updateFilter('q', query);
  };

  // Build results text
  const getResultsText = () => {
    let text = `Showing ${totalCount} business${totalCount !== 1 ? 'es' : ''}`;
    
    if (filters.category) {
      const category = hierarchicalData?.parents.find(c => c.slug === filters.category);
      if (category) {
        text = `${totalCount} ${category.name.toLowerCase()} business${totalCount !== 1 ? 'es' : ''}`;
      }
    }
    
    if (filters.neighborhood) {
      const neighborhoodName = neighborhoodMap.get(filters.neighborhood);
      if (neighborhoodName) {
        text += ` in ${neighborhoodName}`;
      }
    }

    if (filters.search) {
      text += ` for "${filters.search}"`;
    }

    return text;
  };

  const getSeoTitle = () => {
    if (filters.category) {
      const category = hierarchicalData?.parents.find(c => c.slug === filters.category);
      return category ? `${category.name} in Jacksonville` : 'Jacksonville Business Directory';
    }
    return 'Jacksonville Business Directory';
  };

  const getSeoDescription = () => {
    if (filters.category) {
      const category = hierarchicalData?.parents.find(c => c.slug === filters.category);
      return category 
        ? `Find the best ${category.name.toLowerCase()} businesses in Jacksonville, FL. Browse reviews, hours, and contact info.`
        : 'Discover local businesses in Jacksonville, FL. Browse restaurants, shops, services, and more.';
    }
    return 'Discover local businesses in Jacksonville, FL. Browse restaurants, shops, services, and more. Support local businesses in the 904.';
  };

  const showSuggestions = totalCount === 0 && searchSuggestions.length > 0 && filters.search;

  return (
    <Layout>
      <SEO 
        title={getSeoTitle()}
        description={getSeoDescription()}
        url={filters.category ? `/businesses?category=${filters.category}` : '/businesses'}
      />
      <div className="bg-surface min-h-screen">
        <div className="container-news py-8 md:py-12">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
                Jacksonville Business Directory
              </h1>
              <p className="text-muted-foreground">
                Discover and support local businesses in the 904
              </p>
            </div>
            <Link to="/businesses/add">
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your Business
              </Button>
            </Link>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search restaurants, shops, services..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg bg-card border-border shadow-sm"
              />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent hover:bg-accent/90"
              >
                Search
              </Button>
            </div>
          </form>

          {/* Category Tabs with Subcategories */}
          <div className="mb-8">
            <CategoryTabs
              hierarchy={hierarchicalData?.hierarchy || []}
              categoryCounts={categoryCounts}
              selectedCategory={filters.category || ''}
              selectedSubcategories={filters.subcategories || []}
              onCategorySelect={handleCategorySelect}
              onSubcategoryToggle={handleSubcategoryToggle}
              isLoading={categoriesLoading}
            />
          </div>

          {/* Enhanced Filter Bar */}
          <div className="mb-6">
            <EnhancedFilterBar
              neighborhoods={neighborhoods}
              selectedNeighborhood={filters.neighborhood || 'all'}
              onNeighborhoodChange={(value) => updateFilter('neighborhood', value)}
              selectedPriceLevel={filters.priceLevel?.toString() || 'any'}
              onPriceLevelChange={(value) => updateFilter('price', value)}
              selectedSort={filters.sortBy || 'recommended'}
              onSortChange={(value) => updateFilter('sort', value)}
              selectedAmenities={filters.amenities || []}
              onAmenityToggle={handleAmenityToggle}
              selectedRating={filters.minRating}
              onRatingChange={(rating) => updateFilter('rating', rating?.toString())}
              onClearFilters={handleClearFilters}
              activeFilterCount={activeFilterCount}
            />
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-6">
            {isLoading ? 'Loading...' : getResultsText()}
          </p>

          {/* Search Suggestions */}
          {showSuggestions && (
            <SearchSuggestions
              suggestions={searchSuggestions}
              onSuggestionClick={handleSuggestionClick}
            />
          )}

          {/* Business Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <BusinessCardSkeleton key={i} />
              ))}
            </div>
          ) : businesses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {businesses.map((business) => (
                  <BusinessCard
                    key={business.id}
                    business={business}
                    neighborhoodName={business.neighborhood_id ? neighborhoodMap.get(business.neighborhood_id) : undefined}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasNextPage && (
                <div className="flex justify-center mt-10">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="text-center py-16 bg-card rounded-xl">
              <Building2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">No businesses found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {filters.search || filters.category || filters.neighborhood || activeFilterCount > 0
                  ? 'Try adjusting your filters or search terms'
                  : 'Be the first to add a local business to our directory!'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {(filters.search || filters.category || filters.neighborhood || activeFilterCount > 0) && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchParams(new URLSearchParams())}
                  >
                    Clear Filters
                  </Button>
                )}
                <Link to="/businesses/add">
                  <Button className="gap-2 bg-accent hover:bg-accent/90">
                    <Plus className="w-4 h-4" />
                    Add a Business
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Businesses;
