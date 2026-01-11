import { Link } from 'react-router-dom';
import { format, parseISO, isFriday, nextFriday, nextSunday, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ThisWeekendWidgetProps {
  events: Tables<'events'>[];
  isLoading?: boolean;
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    music: 'border-l-purple-500',
    sports: 'border-l-orange-500',
    family: 'border-l-blue-500',
    food: 'border-l-rose-500',
    arts: 'border-l-pink-500',
    community: 'border-l-teal-500',
    business: 'border-l-emerald-500',
    nightlife: 'border-l-indigo-500',
  };
  return colors[category] || 'border-l-muted-foreground';
};

export const ThisWeekendWidget = ({ events, isLoading }: ThisWeekendWidgetProps) => {
  // Filter events to just this weekend (Fri-Sun)
  const weekendEvents = events.filter(event => {
    const eventDate = parseISO(event.start_time);
    const now = new Date();
    const friday = isFriday(now) ? startOfDay(now) : startOfDay(nextFriday(now));
    const sunday = endOfDay(nextSunday(friday));
    
    return isWithinInterval(eventDate, { start: friday, end: sunday });
  }).slice(0, 5);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl shadow-card p-4">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-12 h-12 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (weekendEvents.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-card p-4">
        <h3 className="text-lg font-semibold text-primary flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-accent" />
          This Weekend
        </h3>
        <p className="text-sm text-muted-foreground">
          No events scheduled this weekend yet.
        </p>
        <Link 
          to="/events/submit"
          className="text-accent hover:text-accent/80 text-sm font-medium mt-2 inline-block"
        >
          Submit an event →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-card p-4">
      <h3 className="text-lg font-semibold text-primary flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-accent" />
        This Weekend in Jax
      </h3>

      <div className="space-y-3">
        {weekendEvents.map(event => {
          const startDate = parseISO(event.start_time);
          
          return (
            <Link
              key={event.id}
              to={`/events/${event.slug || event.id}`}
              className={cn(
                "block p-3 rounded-lg border-l-4 bg-muted/30 hover:bg-muted/50 transition-colors",
                getCategoryColor(event.category)
              )}
            >
              <div className="flex gap-3">
                {/* Date Badge */}
                <div className="shrink-0 text-center w-12">
                  <div className="text-xs font-medium text-accent">
                    {format(startDate, 'EEE')}
                  </div>
                  <div className="text-lg font-bold text-primary">
                    {format(startDate, 'd')}
                  </div>
                </div>

                {/* Event Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-card-foreground line-clamp-1 text-sm">
                    {event.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{format(startDate, 'h:mm a')}</span>
                    {event.location_name && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{event.location_name}</span>
                        </span>
                      </>
                    )}
                  </div>
                  {event.price_type === 'free' && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-success/10 text-success text-xs rounded">
                      Free
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* View All Link */}
      <Link
        to="/events?date=weekend"
        className="flex items-center justify-center gap-1 mt-4 pt-3 border-t border-border text-sm font-medium text-accent hover:text-accent/80 transition-colors"
      >
        View all weekend events
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};
