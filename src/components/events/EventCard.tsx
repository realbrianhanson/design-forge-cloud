import { Link } from 'react-router-dom';
import { MapPin, Clock, Star } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: Tables<'events'>;
  variant?: 'horizontal' | 'compact' | 'featured';
}

const getCategoryStyles = (category: string) => {
  const styles: Record<string, { bg: string; text: string }> = {
    music: { bg: 'bg-purple-50', text: 'text-purple-700' },
    sports: { bg: 'bg-orange-50', text: 'text-orange-700' },
    family: { bg: 'bg-blue-50', text: 'text-blue-700' },
    food: { bg: 'bg-rose-50', text: 'text-rose-700' },
    arts: { bg: 'bg-pink-50', text: 'text-pink-700' },
    community: { bg: 'bg-teal-50', text: 'text-teal-700' },
    business: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    nightlife: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  };
  return styles[category.toLowerCase()] || { bg: 'bg-muted', text: 'text-muted-foreground' };
};

export const EventCard = ({ event, variant = 'horizontal' }: EventCardProps) => {
  const startDate = new Date(event.start_time);
  const dayName = format(startDate, 'EEE').toUpperCase();
  const dayNumber = format(startDate, 'd');
  const month = format(startDate, 'MMM').toUpperCase();
  const timeStart = format(startDate, 'h:mm a');
  const timeEnd = event.end_time ? format(new Date(event.end_time), 'h:mm a') : null;
  
  const categoryStyles = getCategoryStyles(event.category);

  const getPriceDisplay = () => {
    if (event.price_type === 'free') return { text: 'Free', className: 'bg-success/10 text-success' };
    if (event.price_type === 'donation') return { text: 'Donation', className: 'bg-accent/10 text-accent' };
    if (event.price_min && event.price_max) {
      return { text: `$${event.price_min}-${event.price_max}`, className: 'bg-muted text-muted-foreground' };
    }
    if (event.price_min) {
      return { text: `From $${event.price_min}`, className: 'bg-muted text-muted-foreground' };
    }
    return { text: 'Paid', className: 'bg-muted text-muted-foreground' };
  };

  const priceDisplay = getPriceDisplay();

  if (variant === 'compact') {
    return (
      <Link 
        to={`/events/${event.slug || event.id}`}
        className="group block bg-card rounded-xl shadow-card hover:shadow-card-hover p-4 transition-all duration-200"
      >
        <div className="flex gap-4">
          <div className="shrink-0 flex flex-col items-center justify-center w-14 text-center">
            <span className="text-xs text-accent font-semibold">{month}</span>
            <span className="text-2xl font-bold text-primary">{dayNumber}</span>
          </div>
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
            <p className="text-sm text-muted-foreground mt-0.5">{timeStart}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      to={`/events/${event.slug || event.id}`}
      className={cn(
        "group flex gap-4 bg-card rounded-xl shadow-card hover:shadow-card-hover p-4 transition-all duration-200",
        event.is_featured && "ring-2 ring-accent/20"
      )}
    >
      {/* Date Badge */}
      <div className="shrink-0 flex flex-col items-center justify-center w-16 text-center">
        <span className="text-xs text-muted-foreground font-medium">{dayName}</span>
        <span className={cn(
          "text-3xl font-bold",
          event.is_featured ? "text-accent" : "text-primary"
        )}>
          {dayNumber}
        </span>
        <span className="text-xs text-muted-foreground font-medium">{month}</span>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <h3 className="text-lg font-semibold text-card-foreground line-clamp-1 group-hover:text-accent transition-colors flex-1">
            {event.title}
          </h3>
          {event.is_featured && (
            <Star className="w-4 h-4 text-warning fill-warning shrink-0" />
          )}
        </div>
        
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {timeStart}{timeEnd && ` - ${timeEnd}`}
          </span>
          {event.location_name && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{event.location_name}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            categoryStyles.bg,
            categoryStyles.text
          )}>
            {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
          </span>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            priceDisplay.className
          )}>
            {priceDisplay.text}
          </span>
        </div>
      </div>

      {/* Image (hidden on mobile) */}
      {event.image_url && (
        <div className="hidden sm:block shrink-0 w-32 h-24 rounded-lg overflow-hidden bg-muted">
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
    </Link>
  );
};

export const EventCardSkeleton = ({ variant = 'horizontal' }: { variant?: 'horizontal' | 'compact' }) => {
  if (variant === 'compact') {
    return (
      <div className="bg-card rounded-xl shadow-card p-4">
        <div className="flex gap-4">
          <div className="shrink-0 w-14 flex flex-col items-center">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-8 w-8 mt-1" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-3/4 mt-2" />
            <Skeleton className="h-4 w-1/2 mt-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 bg-card rounded-xl shadow-card p-4">
      <div className="shrink-0 w-16 flex flex-col items-center">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-10 w-10 mt-1" />
        <Skeleton className="h-3 w-8 mt-1" />
      </div>
      <div className="flex-1">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
        <div className="flex gap-2 mt-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
      <Skeleton className="hidden sm:block w-32 h-24 rounded-lg" />
    </div>
  );
};
