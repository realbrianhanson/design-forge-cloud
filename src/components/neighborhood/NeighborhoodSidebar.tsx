import { Link } from 'react-router-dom';
import { Star, Calendar, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { WeatherWidget } from '@/components/weather/WeatherWidget';
import { Tables } from '@/integrations/supabase/types';
import { format, parseISO } from 'date-fns';

interface NeighborhoodSidebarProps {
  neighborhoodName: string;
  topBusinesses?: Tables<'businesses'>[];
  upcomingEvents?: Tables<'events'>[];
  isLoading?: boolean;
}

export function NeighborhoodSidebar({
  neighborhoodName,
  topBusinesses,
  upcomingEvents,
  isLoading,
}: NeighborhoodSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Weather */}
      <WeatherWidget variant="full" showForecast={false} />

      {/* Top Businesses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-accent" />
            Popular in {neighborhoodName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16 mt-1" />
                </div>
              </div>
            ))
          ) : topBusinesses && topBusinesses.length > 0 ? (
            topBusinesses.slice(0, 3).map((business) => (
              <Link
                key={business.id}
                to={`/businesses/${business.slug}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                  {business.logo_url || business.cover_image_url ? (
                    <img
                      src={business.logo_url || business.cover_image_url || ''}
                      alt={business.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      🏢
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground group-hover:text-accent transition-colors truncate">
                    {business.name}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {business.rating && (
                      <>
                        <Star className="w-3 h-3 fill-warning text-warning" />
                        <span>{business.rating}</span>
                      </>
                    )}
                    <span className="capitalize">{business.category}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No businesses yet</p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            Next Up
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24 mt-1" />
              </div>
            ))
          ) : upcomingEvents && upcomingEvents.length > 0 ? (
            upcomingEvents.slice(0, 3).map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.slug || event.id}`}
                className="block group"
              >
                <p className="text-sm font-medium text-card-foreground group-hover:text-accent transition-colors line-clamp-1">
                  {event.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(event.start_time), 'EEE, MMM d • h:mm a')}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming events</p>
          )}

          <Link
            to="/events"
            className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent/80 mt-2"
          >
            View all events
            <ChevronRight className="w-4 h-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
