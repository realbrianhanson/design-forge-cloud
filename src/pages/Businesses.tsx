import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Plus, Building2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BusinessCard, BusinessCardSkeleton } from '@/components/directory/BusinessCard';
import { CategoryShowcase } from '@/components/directory/CategoryShowcase';
import { FilterBar } from '@/components/directory/FilterBar';
import { useBusinessDirectory, useCategoryCounts, BusinessFilters } from '@/hooks/useBusinessDirectory';
import { useBusinessCategories } from '@/hooks/useBusinesses';
import { useNeighborhoods, useNeighborhoodMap } from '@/hooks/useNeighborhoods';

const Businesses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

  // Get filter values from URL
  const filters: BusinessFilters = useMemo(() => ({
    search: searchParams.get('q') || undefined,
    category: searchParams.get('category') || undefined,
    neighborhood: searchParams.get('neighborhood') || undefined,
    priceLevel: searchParams.get('price') ? parseInt(searchParams.get('price')!) : undefined,
    sortBy: (searchParams.get('sort') as BusinessFilters['sortBy']) || 'recommended',
  }), [searchParams]);

  // Data hooks
  const { data: categories = [], isLoading: categoriesLoading } = useBusinessCategories();
  const { data: neighborhoods = [] } = useNeighborhoods();
  const { data: categoryCounts = {} } = useCategoryCounts();
  const neighborhoodMap = useNeighborhoodMap();

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

  // Update URL params
  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all' && value !== 'any') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('q', searchInput);
  };

  const handleCategorySelect = (category: string) => {
    updateFilter('category', category);
  };

  // Build results text
  const getResultsText = () => {
    let text = `Showing ${totalCount} business${totalCount !== 1 ? 'es' : ''}`;
    
    if (filters.category) {
      const categoryName = categories.find(c => c.slug === filters.category)?.name;
      if (categoryName) {
        text = `${totalCount} ${categoryName.toLowerCase()} business${totalCount !== 1 ? 'es' : ''}`;
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
      const categoryName = categories.find(c => c.slug === filters.category)?.name;
      return categoryName ? `${categoryName} in Jacksonville` : 'Jacksonville Business Directory';
    }
    return 'Jacksonville Business Directory';
  };

  const getSeoDescription = () => {
    if (filters.category) {
      const categoryName = categories.find(c => c.slug === filters.category)?.name;
      return categoryName 
        ? `Find the best ${categoryName.toLowerCase()} businesses in Jacksonville, FL. Browse reviews, hours, and contact info.`
        : 'Discover local businesses in Jacksonville, FL. Browse restaurants, shops, services, and more.';
    }
    return 'Discover local businesses in Jacksonville, FL. Browse restaurants, shops, services, and more. Support local businesses in the 904.';
  };

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

          {/* Category Showcase */}
          <div className="mb-8">
            <CategoryShowcase
              categories={categories}
              categoryCounts={categoryCounts}
              selectedCategory={filters.category || ''}
              onCategorySelect={handleCategorySelect}
              isLoading={categoriesLoading}
            />
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <FilterBar
              neighborhoods={neighborhoods}
              selectedNeighborhood={filters.neighborhood || 'all'}
              onNeighborhoodChange={(value) => updateFilter('neighborhood', value)}
              selectedPriceLevel={filters.priceLevel?.toString() || 'any'}
              onPriceLevelChange={(value) => updateFilter('price', value)}
              selectedSort={filters.sortBy || 'recommended'}
              onSortChange={(value) => updateFilter('sort', value)}
            />

            {/* Results Count */}
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Loading...' : getResultsText()}
            </p>
          </div>

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
                {filters.search || filters.category || filters.neighborhood
                  ? 'Try adjusting your filters or search terms'
                  : 'Be the first to add a local business to our directory!'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {(filters.search || filters.category || filters.neighborhood) && (
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
