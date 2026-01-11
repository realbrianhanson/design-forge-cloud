import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Loader2, X, Calendar, ChevronDown } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/SEO';
import { EventCard, EventCardSkeleton } from '@/components/events/EventCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInfiniteEvents, useFeaturedEvents, DateFilter } from '@/hooks/useEvents';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { cn } from '@/lib/utils';
import { Tables } from '@/integrations/supabase/types';

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'all', label: 'All Upcoming' },
  { value: 'today', label: 'Today' },
  { value: 'weekend', label: 'This Weekend' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'music', label: 'Music' },
  { value: 'sports', label: 'Sports' },
  { value: 'family', label: 'Family' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'arts', label: 'Arts' },
  { value: 'community', label: 'Community' },
  { value: 'business', label: 'Business' },
  { value: 'nightlife', label: 'Nightlife' },
];

const PRICE_FILTERS = [
  { value: '', label: 'All Prices' },
  { value: 'free', label: 'Free Only' },
  { value: 'paid', label: 'Paid' },
];

const Events = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const dateFilter = (searchParams.get('date') as DateFilter) || 'all';
  const category = searchParams.get('category') || '';
  const neighborhoodId = searchParams.get('neighborhood') || '';
  const priceType = searchParams.get('price') || '';

  const { data: neighborhoods } = useNeighborhoods();
  const { data: featuredEvents } = useFeaturedEvents(3);
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteEvents({ dateFilter, category, neighborhoodId, priceType }, 20);

  const events = data?.pages.flatMap(page => page.events) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  const hasActiveFilters = !!(category || neighborhoodId || priceType) || dateFilter !== 'all';

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { date: string; label: string; events: Tables<'events'>[] }[] = [];
    const dateMap = new Map<string, Tables<'events'>[]>();

    events.forEach(event => {
      const dateKey = format(parseISO(event.start_time), 'yyyy-MM-dd');
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(event);
    });

    dateMap.forEach((dateEvents, dateKey) => {
      const date = parseISO(dateKey);
      let label: string;
      
      if (isToday(date)) {
        label = `Today - ${format(date, 'EEEE, MMMM d')}`;
      } else if (isTomorrow(date)) {
        label = `Tomorrow - ${format(date, 'EEEE, MMMM d')}`;
      } else {
        label = format(date, 'EEEE, MMMM d');
      }

      groups.push({ date: dateKey, label, events: dateEvents });
    });

    return groups.sort((a, b) => a.date.localeCompare(b.date));
  }, [events]);

  const getResultsText = () => {
    let text = `${totalCount} event${totalCount !== 1 ? 's' : ''}`;
    
    if (dateFilter !== 'all') {
      const dateLabel = DATE_FILTERS.find(f => f.value === dateFilter)?.label.toLowerCase() || '';
      text += ` ${dateLabel}`;
    }
    
    if (neighborhoodId && neighborhoods) {
      const neighborhood = neighborhoods.find(n => n.id === neighborhoodId);
      if (neighborhood) {
        text += ` in ${neighborhood.name}`;
      }
    }
    
    return text;
  };

  return (
    <Layout>
      <SEO 
        title="Jacksonville Events"
        description="Discover concerts, festivals, sports, family events, and more happening in Jacksonville, FL. Find what to do in the 904."
        url="/events"
      />
      <div className="section-spacing">
        <div className="container-news">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary">Jacksonville Events</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Discover what's happening in the 904
              </p>
            </div>
            <Link to="/events/submit">
              <Button variant="outline" className="shrink-0 min-h-[44px]">
                <Plus className="w-4 h-4 mr-2" />
                Submit an Event
              </Button>
            </Link>
          </div>

          {/* Featured Events Carousel (if any) */}
          {featuredEvents && featuredEvents.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Featured Events
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x-mandatory">
                {featuredEvents.map(event => (
                  <div key={event.id} className="min-w-[280px] sm:min-w-[350px] snap-start">
                    <EventCard event={event} variant="horizontal" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-card rounded-xl shadow-card p-4 mb-6">
            {/* Date Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-3 border-b border-border scrollbar-hide snap-x-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
              {DATE_FILTERS.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => updateFilter('date', filter.value === 'all' ? '' : filter.value)}
                  className={cn(
                    "px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-colors snap-start",
                    dateFilter === filter.value || (filter.value === 'all' && !dateFilter)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Dropdown Filters - stacked on mobile */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={category} onValueChange={(v) => updateFilter('category', v)}>
                <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value || 'all'}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={neighborhoodId} onValueChange={(v) => updateFilter('neighborhood', v)}>
                <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
                  <SelectValue placeholder="All Neighborhoods" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">All Neighborhoods</SelectItem>
                  {neighborhoods?.map(n => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceType} onValueChange={(v) => updateFilter('price', v)}>
                <SelectTrigger className="w-full sm:w-[140px] min-h-[44px]">
                  <SelectValue placeholder="All Prices" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {PRICE_FILTERS.map(p => (
                    <SelectItem key={p.value} value={p.value || 'all'}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Info */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              Showing {getResultsText()}
            </p>
            {hasActiveFilters && (
              <button 
                onClick={clearFilters}
                className="text-sm text-accent hover:text-accent/80 flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            )}
          </div>

          {/* Events List */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : groupedEvents.length > 0 ? (
            <div className="space-y-6">
              {groupedEvents.map(group => (
                <div key={group.date}>
                  {/* Date Group Header */}
                  <div className="sticky top-0 z-10 bg-surface py-2 px-4 -mx-4 sm:mx-0 sm:px-0 sm:bg-transparent mb-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {group.label}
                    </h3>
                  </div>
                  
                  {/* Events in Group */}
                  <div className="space-y-3">
                    {group.events.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState hasFilters={hasActiveFilters} onClearFilters={clearFilters} />
          )}

          {/* Load More Button */}
          {hasNextPage && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="min-w-[200px]"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Show More Events'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const EmptyState = ({ hasFilters, onClearFilters }: { hasFilters: boolean; onClearFilters: () => void }) => {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">📅</div>
      <h3 className="text-xl font-semibold text-primary mb-2">No events found</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        {hasFilters 
          ? "No events match your current filters. Try adjusting your search criteria."
          : "There are no upcoming events at the moment. Check back soon!"}
      </p>
      {hasFilters && (
        <Button variant="outline" onClick={onClearFilters} className="mt-4">
          Clear all filters
        </Button>
      )}
      <div className="mt-6">
        <Link to="/events/submit" className="text-accent hover:text-accent/80 text-sm font-medium">
          Know of an event? Submit it →
        </Link>
      </div>
    </div>
  );
};

export default Events;
