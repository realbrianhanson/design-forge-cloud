import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Phone, Globe, MapPin, Navigation, Bookmark, Share2, 
  Star, Clock, ChevronDown, ChevronUp, BadgeCheck, 
  ExternalLink, ImageOff, Building2
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEO, generateLocalBusinessSchema } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { BusinessCard, BusinessCardSkeleton } from '@/components/directory/BusinessCard';
import { useBusiness, useSimilarBusinesses, incrementBusinessViewCount } from '@/hooks/useBusinesses';
import { useNeighborhoodMap } from '@/hooks/useNeighborhoods';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const categoryIcons: Record<string, string> = {
  'restaurants': '🍽️',
  'food-drink': '🍔',
  'shopping': '🛍️',
  'services': '🔧',
  'health': '💊',
  'beauty': '💅',
  'fitness': '💪',
  'entertainment': '🎭',
  'nightlife': '🍸',
  'professional': '💼',
  'automotive': '🚗',
  'home': '🏠',
};

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const BusinessDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const neighborhoodMap = useNeighborhoodMap();
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: business, isLoading, error } = useBusiness(slug || '');
  const { data: similarBusinesses = [], isLoading: similarLoading } = useSimilarBusinesses(
    business?.category || '',
    business?.neighborhood_id || null,
    business?.id || '',
    4
  );

  // Increment view count on mount
  useEffect(() => {
    if (business?.id) {
      incrementBusinessViewCount(business.id);
    }
  }, [business?.id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-surface">
          <Skeleton className="w-full h-48 md:h-64" />
          <div className="container-news max-w-5xl py-8">
            <div className="flex gap-6 mb-8">
              <Skeleton className="w-20 h-20 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !business) {
    return (
      <Layout>
        <SEO 
          title="Business Not Found"
          description="This business doesn't exist or may have been removed."
          noindex
        />
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="text-center">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h1 className="text-2xl font-bold text-primary mb-2">Business Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This business doesn't exist or may have been removed.
            </p>
            <Link to="/businesses">
              <Button>Browse Directory</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const icon = categoryIcons[business.category.toLowerCase()] || '🏢';
  const neighborhoodName = business.neighborhood_id 
    ? neighborhoodMap.get(business.neighborhood_id) 
    : null;
  const priceSymbol = business.price_level ? '$'.repeat(business.price_level) : null;
  const fullAddress = [
    business.address,
    business.city,
    business.state,
    business.zip_code,
  ].filter(Boolean).join(', ');

  // Parse hours (JSON format expected: {"monday": "9:00 AM - 9:00 PM", ...})
  const hours = business.hours as Record<string, string> | null;
  const today = dayNames[new Date().getDay()].toLowerCase();
  const todayHours = hours?.[today] || null;

  const handleShare = async () => {
    const shareData = {
      title: business.name,
      text: business.short_description || `Check out ${business.name}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied!',
        description: 'Business link copied to clipboard',
      });
    }
  };

  const handleSave = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save businesses',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Business saved!',
      description: `${business.name} has been saved to your list`,
    });
  };

  const getGoogleMapsUrl = () => {
    const query = encodeURIComponent(fullAddress || business.name);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const businessUrl = `/businesses/${business.slug || business.id}`;

  return (
    <Layout>
      <SEO 
        title={`${business.name} - ${business.category.replace(/-/g, ' ')} in Jacksonville`}
        description={business.short_description || business.description?.substring(0, 155) || `${business.name} is a ${business.category} business in Jacksonville, FL`}
        image={business.cover_image_url || business.logo_url || undefined}
        url={businessUrl}
        type="place"
        structuredData={generateLocalBusinessSchema({
          name: business.name,
          description: business.short_description || business.description || undefined,
          image: business.cover_image_url || business.logo_url || undefined,
          category: business.category,
          address: business.address || undefined,
          city: business.city || undefined,
          state: business.state || undefined,
          zipCode: business.zip_code || undefined,
          phone: business.phone || undefined,
          website: business.website || undefined,
          rating: business.rating ? Number(business.rating) : undefined,
          reviewCount: business.review_count || undefined,
          priceLevel: business.price_level || undefined,
          url: businessUrl,
        })}
      />
      <div className="min-h-screen bg-surface">
        {/* Cover Image */}
        {business.cover_image_url ? (
          <div className="relative h-48 md:h-64">
            <img
              src={business.cover_image_url}
              alt={business.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        ) : (
          <div className="h-48 md:h-64 bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
            <span className="text-8xl">{icon}</span>
          </div>
        )}

        <div className="container-news max-w-5xl py-8">
          {/* Business Info Card */}
          <div className={`bg-card rounded-xl shadow-sm p-6 mb-8 ${business.cover_image_url ? '-mt-20 relative z-10' : ''}`}>
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Logo */}
              <div className="w-20 h-20 rounded-xl bg-muted shadow-md p-2 flex-shrink-0 flex items-center justify-center">
                {business.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt={business.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-4xl">{icon}</span>
                )}
              </div>

              {/* Details */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1">
                      {business.name}
                    </h1>
                    <p className="text-muted-foreground capitalize mb-2">
                      {business.category.replace(/-/g, ' ')}
                    </p>
                  </div>
                  {business.verified && (
                    <div className="flex items-center gap-1 text-accent text-sm font-medium bg-accent/10 px-2 py-1 rounded-full">
                      <BadgeCheck className="w-4 h-4" />
                      Verified
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {business.rating && (
                    <button className="flex items-center gap-1 hover:underline">
                      <Star className="w-4 h-4 text-warning fill-warning" />
                      <span className="font-medium">{business.rating.toFixed(1)}</span>
                      {business.review_count && business.review_count > 0 && (
                        <span className="text-muted-foreground">
                          ({business.review_count} reviews)
                        </span>
                      )}
                    </button>
                  )}
                  {priceSymbol && (
                    <span className="text-muted-foreground">{priceSymbol}</span>
                  )}
                  {todayHours && (
                    <span className="text-muted-foreground">
                      {todayHours.toLowerCase().includes('closed') ? (
                        <span className="text-destructive">Closed</span>
                      ) : (
                        <span className="text-success">Open · {todayHours}</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border">
              {business.phone && (
                <a href={`tel:${business.phone}`}>
                  <Button variant="outline" className="gap-2">
                    <Phone className="w-4 h-4" />
                    Call
                  </Button>
                </a>
              )}
              {business.website && (
                <a href={business.website} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="gap-2">
                    <Globe className="w-4 h-4" />
                    Website
                  </Button>
                </a>
              )}
              {fullAddress && (
                <a href={getGoogleMapsUrl()} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="gap-2">
                    <Navigation className="w-4 h-4" />
                    Directions
                  </Button>
                </a>
              )}
              <Button variant="outline" className="gap-2" onClick={handleSave}>
                <Bookmark className="w-4 h-4" />
                Save
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>

          {/* Info Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Contact Card */}
            <div className="bg-card rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-primary mb-4">Contact</h3>
              <div className="space-y-3">
                {fullAddress && (
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <a
                      href={getGoogleMapsUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-accent"
                    >
                      {fullAddress}
                    </a>
                  </div>
                )}
                {business.phone && (
                  <div className="flex gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <a
                      href={`tel:${business.phone}`}
                      className="text-sm text-muted-foreground hover:text-accent"
                    >
                      {business.phone}
                    </a>
                  </div>
                )}
                {business.website && (
                  <div className="flex gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-accent truncate"
                    >
                      {business.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Hours Card */}
            <div className="bg-card rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-primary mb-4">Hours</h3>
              {hours ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary">Today</span>
                    <span className="text-sm text-muted-foreground">
                      {todayHours || 'Hours not set'}
                    </span>
                  </div>
                  <button
                    onClick={() => setHoursExpanded(!hoursExpanded)}
                    className="flex items-center gap-1 text-sm text-accent hover:underline"
                  >
                    {hoursExpanded ? 'Hide' : 'Show'} all hours
                    {hoursExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {hoursExpanded && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      {dayNames.map((day) => (
                        <div key={day} className="flex justify-between text-sm">
                          <span className={day.toLowerCase() === today ? 'font-medium text-primary' : 'text-muted-foreground'}>
                            {day}
                          </span>
                          <span className="text-muted-foreground">
                            {hours[day.toLowerCase()] || 'Closed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Hours not available
                </div>
              )}
            </div>

            {/* Quick Facts Card */}
            <div className="bg-card rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-primary mb-4">Quick Facts</h3>
              <div className="space-y-3 text-sm">
                {priceSymbol && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-medium text-primary">{priceSymbol}</span>
                  </div>
                )}
                {neighborhoodName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Neighborhood</span>
                    <span className="font-medium text-primary">{neighborhoodName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium text-primary capitalize">
                    {business.category.replace(/-/g, ' ')}
                  </span>
                </div>
                {business.subcategories && business.subcategories.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {business.subcategories.map((sub) => (
                      <span
                        key={sub}
                        className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="overview" className="mb-12">
            <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 mb-6">
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-6 py-3"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="photos"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-6 py-3"
              >
                Photos
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-6 py-3"
              >
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="bg-card rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-lg text-primary mb-4">About</h3>
                {business.description ? (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {business.description}
                  </p>
                ) : business.short_description ? (
                  <p className="text-muted-foreground leading-relaxed">
                    {business.short_description}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    No description available for this business.
                  </p>
                )}

                {/* Map Placeholder */}
                {fullAddress && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <h4 className="font-medium text-primary mb-4">Location</h4>
                    <a
                      href={getGoogleMapsUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-muted rounded-lg h-48 flex items-center justify-center hover:bg-muted/80 transition-colors"
                    >
                      <div className="text-center">
                        <MapPin className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">{fullAddress}</p>
                        <p className="text-sm text-accent mt-2 flex items-center justify-center gap-1">
                          View on Google Maps
                          <ExternalLink className="w-3 h-3" />
                        </p>
                      </div>
                    </a>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="photos">
              <div className="bg-card rounded-xl shadow-sm p-6">
                {business.gallery_urls && business.gallery_urls.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {business.gallery_urls.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(url)}
                        className="aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={url}
                          alt={`${business.name} photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ImageOff className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h4 className="font-medium text-primary mb-2">No photos yet</h4>
                    <p className="text-muted-foreground text-sm">
                      {business.claimed
                        ? 'Add photos to showcase your business'
                        : 'The owner hasn\'t added photos yet'}
                    </p>
                  </div>
                )}
              </div>

              {/* Lightbox */}
              {selectedImage && (
                <div
                  className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                  onClick={() => setSelectedImage(null)}
                >
                  <img
                    src={selectedImage}
                    alt="Full size"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews">
              <div className="bg-card rounded-xl shadow-sm p-6">
                {/* Review Summary */}
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  <div className="text-center md:text-left">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {business.rating?.toFixed(1) || '—'}
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            business.rating && star <= Math.round(business.rating)
                              ? 'text-warning fill-warning'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {business.review_count || 0} reviews
                    </p>
                  </div>

                  <div className="flex-1">
                    <Button className="bg-accent hover:bg-accent/90 gap-2 mb-4">
                      <Star className="w-4 h-4" />
                      Write a Review
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Share your experience with this business
                    </p>
                  </div>
                </div>

                {/* Reviews Placeholder */}
                <div className="border-t border-border pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    No reviews yet. Be the first to review!
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Similar Businesses */}
          {similarBusinesses.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-primary mb-6">
                More {business.category.replace(/-/g, ' ')}
                {neighborhoodName ? ` in ${neighborhoodName}` : ''}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {similarLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <BusinessCardSkeleton key={i} />
                    ))
                  : similarBusinesses.map((b) => (
                      <BusinessCard
                        key={b.id}
                        business={b}
                        neighborhoodName={b.neighborhood_id ? neighborhoodMap.get(b.neighborhood_id) : undefined}
                      />
                    ))}
              </div>
            </section>
          )}

          {/* Claim Section */}
          {!business.claimed && (
            <div className="bg-card rounded-xl shadow-sm p-6 text-center">
              <Building2 className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-primary mb-2">
                Own this business?
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Claim it to update info, respond to reviews, and more.
              </p>
              <Link to={`/businesses/${business.slug}/claim`}>
                <Button className="bg-accent hover:bg-accent/90">
                  Claim This Business
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BusinessDetail;
