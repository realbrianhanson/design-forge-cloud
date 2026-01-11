import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, DollarSign, Bookmark, Share2, 
  ExternalLink, CalendarPlus, ChevronDown, Navigation,
  User, Mail, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { SEO, generateEventSchema } from '@/components/SEO';
import { EventCard, EventCardSkeleton } from '@/components/events/EventCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEvent, useSimilarEvents } from '@/hooks/useEvents';
import { useNeighborhood } from '@/hooks/useNeighborhoods';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const getCategoryGradient = (category: string) => {
  const gradients: Record<string, string> = {
    music: 'from-purple-600 to-indigo-700',
    sports: 'from-orange-500 to-red-600',
    family: 'from-blue-500 to-cyan-600',
    food: 'from-rose-500 to-pink-600',
    arts: 'from-pink-500 to-purple-600',
    community: 'from-teal-500 to-emerald-600',
    business: 'from-emerald-500 to-teal-600',
    nightlife: 'from-indigo-600 to-purple-700',
  };
  return gradients[category.toLowerCase()] || 'from-accent to-primary';
};

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

const EventDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading, error } = useEvent(slug || '');
  const { data: neighborhood } = useNeighborhood(event?.neighborhood_id ? '' : '');
  const { data: similarEvents, isLoading: similarLoading } = useSimilarEvents(
    event?.category || '',
    event?.id || '',
    event?.neighborhood_id || '',
    4
  );
  
  const [isSaved, setIsSaved] = useState(false);
  const viewTracked = useRef(false);

  // Track view count (once per session)
  useEffect(() => {
    if (event && !viewTracked.current) {
      viewTracked.current = true;
      // TODO: Implement view tracking
    }
  }, [event]);

  const handleSave = () => {
    // TODO: Implement actual save with auth check
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Removed from saved events' : 'Event saved!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: event?.title,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const handleAddToGoogleCalendar = () => {
    if (!event) return;
    const startDate = new Date(event.start_time);
    const endDate = event.end_time ? new Date(event.end_time) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    const formatGoogleDate = (date: Date) => date.toISOString().replace(/-|:|\.\d{3}/g, '');
    
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', event.title);
    url.searchParams.set('dates', `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`);
    if (event.location_name) url.searchParams.set('location', event.location_address || event.location_name);
    if (event.description) url.searchParams.set('details', event.description.substring(0, 500));
    
    window.open(url.toString(), '_blank');
  };

  const handleDownloadICS = () => {
    if (!event) return;
    const startDate = new Date(event.start_time);
    const endDate = event.end_time ? new Date(event.end_time) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    const formatICSDate = (date: Date) => date.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, -1);
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(startDate)}Z`,
      `DTEND:${formatICSDate(endDate)}Z`,
      `SUMMARY:${event.title}`,
      event.location_name ? `LOCATION:${event.location_address || event.location_name}` : '',
      event.description ? `DESCRIPTION:${event.description.substring(0, 500).replace(/\n/g, '\\n')}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.slug || event.id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDirectionsUrl = () => {
    if (!event?.location_address && !event?.location_name) return null;
    const query = encodeURIComponent(event.location_address || event.location_name || '');
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  if (isLoading) {
    return (
      <Layout>
        <EventDetailSkeleton />
      </Layout>
    );
  }

  if (error || !event) {
    return (
      <Layout>
        <SEO 
          title="Event Not Found"
          description="This event doesn't exist or is no longer available."
          noindex
        />
        <div className="section-spacing">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold text-primary mb-4">Event Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This event doesn't exist or is no longer available.
            </p>
            <Link to="/events">
              <Button>Browse Events</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const categoryStyles = getCategoryStyles(event.category);
  const startDate = new Date(event.start_time);
  const endDate = event.end_time ? new Date(event.end_time) : null;
  const eventUrl = `/events/${event.slug || event.id}`;
  
  const getPriceDisplay = () => {
    if (event.price_type === 'free') return 'Free';
    if (event.price_type === 'donation') return 'Donation';
    if (event.price_min && event.price_max) return `$${event.price_min} - $${event.price_max}`;
    if (event.price_min) return `From $${event.price_min}`;
    return 'Paid';
  };

  return (
    <Layout>
      <SEO 
        title={`${event.title} - ${format(startDate, 'MMM d, yyyy')}`}
        description={event.short_description || event.description?.substring(0, 155) || `Join us for ${event.title} in Jacksonville, FL`}
        image={event.image_url || undefined}
        url={eventUrl}
        type="event"
        structuredData={generateEventSchema({
          title: event.title,
          description: event.short_description || event.description || '',
          image: event.image_url || undefined,
          startTime: event.start_time,
          endTime: event.end_time || undefined,
          locationName: event.location_name || undefined,
          locationAddress: event.location_address || undefined,
          priceMin: event.price_min || undefined,
          priceMax: event.price_max || undefined,
          priceType: event.price_type || undefined,
          url: eventUrl,
        })}
      />
      {/* Hero Section */}
      <div className="relative h-64 md:h-80">
        {event.image_url ? (
          <>
            <img 
              src={event.image_url} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <div className={cn(
            "w-full h-full bg-gradient-to-br",
            getCategoryGradient(event.category)
          )}>
            <div className="absolute inset-0 opacity-10" 
              style={{ 
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              }}
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4">
        {/* Main Info Card */}
        <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8 -mt-16 relative z-10">
          {/* Category Badge */}
          <span className={cn(
            "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide",
            categoryStyles.bg,
            categoryStyles.text
          )}>
            {event.category}
          </span>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-primary mt-3">
            {event.title}
          </h1>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium text-card-foreground">
                  {format(startDate, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium text-card-foreground">
                  {format(startDate, 'h:mm a')}
                  {endDate && ` - ${format(endDate, 'h:mm a')}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Venue</p>
                {getDirectionsUrl() ? (
                  <a 
                    href={getDirectionsUrl()!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent hover:text-accent/80 transition-colors"
                  >
                    {event.location_name || 'View Map'}
                  </a>
                ) : (
                  <p className="font-medium text-card-foreground">
                    {event.location_name || 'TBA'}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className={cn(
                  "font-medium",
                  event.price_type === 'free' ? 'text-success' : 'text-card-foreground'
                )}>
                  {getPriceDisplay()}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            {event.ticket_url && (
              <a href={event.ticket_url} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Get Tickets
                </Button>
              </a>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleSave}
              className={cn(isSaved && "bg-accent/10 border-accent text-accent")}
            >
              <Bookmark className={cn("w-4 h-4 mr-2", isSaved && "fill-current")} />
              {isSaved ? 'Saved' : 'Save'}
            </Button>
            
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Add to Calendar
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAddToGoogleCalendar}>
                  Google Calendar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadICS}>
                  Apple Calendar / Outlook
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="about" className="mt-8">
          <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none p-0">
            <TabsTrigger 
              value="about"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-4 py-3"
            >
              About
            </TabsTrigger>
            <TabsTrigger 
              value="location"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-4 py-3"
            >
              Location
            </TabsTrigger>
            <TabsTrigger 
              value="organizer"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-4 py-3"
            >
              Organizer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            {event.description ? (
              <div className="prose prose-slate max-w-none">
                {event.description.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-foreground leading-relaxed mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No description available.</p>
            )}
          </TabsContent>

          <TabsContent value="location" className="mt-6">
            <div className="space-y-4">
              {/* Map Placeholder */}
              <div className="aspect-[16/9] bg-muted rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Map coming soon</p>
                </div>
              </div>
              
              {/* Address */}
              {(event.location_name || event.location_address) && (
                <div className="bg-muted/50 rounded-xl p-4">
                  <h3 className="font-semibold text-card-foreground mb-2">
                    {event.location_name}
                  </h3>
                  {event.location_address && (
                    <p className="text-muted-foreground">{event.location_address}</p>
                  )}
                  
                  {getDirectionsUrl() && (
                    <a 
                      href={getDirectionsUrl()!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-accent hover:text-accent/80 mt-3 font-medium"
                    >
                      <Navigation className="w-4 h-4" />
                      Get Directions
                    </a>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="organizer" className="mt-6">
            <div className="bg-muted/50 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">
                    {event.organizer_name || 'Event Organizer'}
                  </h3>
                  <p className="text-sm text-muted-foreground">Organizer</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 mt-4">
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Organizer
                </Button>
                <Button variant="ghost" size="sm" className="text-accent">
                  View more events
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Similar Events */}
        <section className="mt-12 pb-12">
          <h2 className="text-xl font-semibold text-primary mb-6">
            More {event.category.charAt(0).toUpperCase() + event.category.slice(1)} Events
          </h2>
          
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
            {similarLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-[280px] sm:min-w-0">
                  <EventCardSkeleton variant="compact" />
                </div>
              ))
            ) : similarEvents && similarEvents.length > 0 ? (
              similarEvents.map(e => (
                <div key={e.id} className="min-w-[280px] sm:min-w-0">
                  <EventCard event={e} variant="compact" />
                </div>
              ))
            ) : (
              <p className="col-span-full text-muted-foreground text-center py-8">
                No similar events found.
              </p>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

const EventDetailSkeleton = () => (
  <>
    <Skeleton className="h-64 md:h-80 w-full" />
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8 -mt-16 relative z-10">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-10 w-3/4 mt-3" />
        <Skeleton className="h-10 w-1/2 mt-2" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-full mt-1" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  </>
);

export default EventDetail;
