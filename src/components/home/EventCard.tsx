import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface EventCardProps {
  event: Tables<'events'>;
}

export const EventCard = ({ event }: EventCardProps) => {
  const startDate = new Date(event.start_time);
  const month = format(startDate, 'MMM').toUpperCase();
  const day = format(startDate, 'd');
  const time = format(startDate, 'h:mm a');

  return (
    <Link 
      to={`/events/${event.slug || event.id}`}
      className="group block bg-card rounded-xl shadow-card hover:shadow-card-hover p-4 min-w-[280px] border border-transparent hover:border-accent/20 transition-all duration-200"
    >
      <div className="flex gap-4">
        {/* Date Badge */}
        <div className="shrink-0 flex flex-col items-center justify-center w-14">
          <span className="text-xs uppercase text-accent font-semibold tracking-wide">
            {month}
          </span>
          <span className="text-2xl font-bold text-primary">
            {day}
          </span>
        </div>

        {/* Event Info */}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-card-foreground line-clamp-1 group-hover:text-accent transition-colors">
            {event.title}
          </h3>
          
          {event.location_name && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{event.location_name}</span>
            </p>
          )}
          
          <p className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {time}
          </p>
        </div>
      </div>
    </Link>
  );
};

export const EventCardSkeleton = () => {
  return (
    <div className="bg-card rounded-xl shadow-card p-4 min-w-[280px]">
      <div className="flex gap-4">
        <div className="shrink-0 flex flex-col items-center justify-center w-14">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-8 w-8 mt-1" />
        </div>
        <div className="min-w-0 flex-1">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-3/4 mt-2" />
          <Skeleton className="h-4 w-1/2 mt-1" />
        </div>
      </div>
    </div>
  );
};
