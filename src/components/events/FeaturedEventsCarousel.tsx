import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, differenceInDays, differenceInHours } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, MapPin, Ticket } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FeaturedEventsCarouselProps {
  events: Tables<'events'>[];
  autoPlay?: boolean;
  interval?: number;
}

const getCountdown = (startTime: string) => {
  const now = new Date();
  const eventDate = parseISO(startTime);
  const daysUntil = differenceInDays(eventDate, now);
  const hoursUntil = differenceInHours(eventDate, now);

  if (daysUntil > 0) {
    return `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
  } else if (hoursUntil > 0) {
    return `In ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`;
  } else if (hoursUntil === 0) {
    return 'Starting soon!';
  } else {
    return 'Happening now';
  }
};

export const FeaturedEventsCarousel = ({
  events,
  autoPlay = true,
  interval = 5000,
}: FeaturedEventsCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay || events.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % events.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, events.length]);

  if (events.length === 0) return null;

  const currentEvent = events[currentIndex];
  const countdown = getCountdown(currentEvent.start_time);

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + events.length) % events.length);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % events.length);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ 
          backgroundImage: currentEvent.image_url 
            ? `url(${currentEvent.image_url})` 
            : 'none' 
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />

      {/* Content */}
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Event Image */}
          {currentEvent.image_url && (
            <div className="shrink-0 w-full md:w-64 h-48 md:h-40 rounded-xl overflow-hidden bg-muted">
              <img
                src={currentEvent.image_url}
                alt={currentEvent.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Event Details */}
          <div className="flex-1 min-w-0">
            {/* Countdown Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-3">
              <Clock className="w-4 h-4" />
              {countdown}
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-primary mb-2 line-clamp-2">
              {currentEvent.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <span>
                {format(parseISO(currentEvent.start_time), 'EEEE, MMMM d · h:mm a')}
              </span>
              {currentEvent.location_name && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {currentEvent.location_name}
                </span>
              )}
            </div>

            {currentEvent.short_description && (
              <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                {currentEvent.short_description}
              </p>
            )}

            <div className="flex items-center gap-3">
              <Link to={`/events/${currentEvent.slug || currentEvent.id}`}>
                <Button>View Event</Button>
              </Link>
              {currentEvent.ticket_url && (
                <a 
                  href={currentEvent.ticket_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-2">
                    <Ticket className="w-4 h-4" />
                    Get Tickets
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        {events.length > 1 && (
          <>
            {/* Arrow Buttons */}
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow-md transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow-md transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {events.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentIndex
                      ? "bg-accent w-6"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
