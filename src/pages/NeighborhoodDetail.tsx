import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Newspaper, Calendar, Building2, Shield, Info, Plus, ChevronRight, ExternalLink, Users, Clock, MapPin } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/SEO';
import { NeighborhoodHero, NeighborhoodHeroSkeleton } from '@/components/neighborhood/NeighborhoodHero';
import { NeighborhoodSelector } from '@/components/neighborhood/NeighborhoodSelector';
import { NeighborhoodSidebar } from '@/components/neighborhood/NeighborhoodSidebar';
import { ArticleCard, ArticleCardSkeleton } from '@/components/home/ArticleCard';
import { EventCard, EventCardSkeleton } from '@/components/events/EventCard';
import { BusinessCard } from '@/components/directory/BusinessCard';
import { CrimeMap } from '@/components/crime/CrimeMap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useNeighborhood,
  useNeighborhoodStats,
  useNeighborhoodArticles,
  useNeighborhoodEvents,
  useNeighborhoodBusinesses,
  useNeighborhoodTopBusinesses,
  useNeighborhoodCrimeStats,
} from '@/hooks/useNeighborhoods';
import { EmptyState } from '@/components/ui/empty-state';

const NeighborhoodDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState('news');
  
  const { data: neighborhood, isLoading: neighborhoodLoading } = useNeighborhood(slug || '');
  const { data: stats, isLoading: statsLoading } = useNeighborhoodStats(neighborhood?.id);
  const { data: articles, isLoading: articlesLoading } = useNeighborhoodArticles(neighborhood?.id, 12);
  const { data: events, isLoading: eventsLoading } = useNeighborhoodEvents(neighborhood?.id, 12);
  const { data: businesses, isLoading: businessesLoading } = useNeighborhoodBusinesses(neighborhood?.id, 24);
  const { data: topBusinesses } = useNeighborhoodTopBusinesses(neighborhood?.id);
  const { data: crimeData, isLoading: crimeLoading } = useNeighborhoodCrimeStats(neighborhood?.id);

  if (neighborhoodLoading) {
    return (
      <Layout>
        <NeighborhoodHeroSkeleton />
        <div className="container-news section-spacing">
          <Skeleton className="h-12 w-full max-w-md" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ArticleCardSkeleton key={i} variant="horizontal" />
              ))}
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!neighborhood) {
    return (
      <Layout>
        <SEO title="Neighborhood Not Found" url={`/neighborhoods/${slug}`} />
        <div className="container-news section-spacing text-center">
          <h1 className="text-3xl font-bold text-foreground">Neighborhood Not Found</h1>
          <p className="text-muted-foreground mt-2">
            The neighborhood you're looking for doesn't exist.
          </p>
          <Button asChild className="mt-4">
            <Link to="/neighborhoods">View All Neighborhoods</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title={`${neighborhood.name} - Local News, Events & Businesses`}
        description={neighborhood.description || `Discover what's happening in ${neighborhood.name}. Get local news, upcoming events, business directory, and crime stats.`}
        url={`/neighborhoods/${neighborhood.slug}`}
        image={neighborhood.image_url || undefined}
      />

      {/* Hero */}
      <NeighborhoodHero 
        neighborhood={neighborhood} 
        stats={stats || { articleCount: 0, eventCount: 0, businessCount: 0 }} 
      />

      {/* Neighborhood Selector */}
      <div className="container-news py-4 flex items-center justify-between border-b border-border">
        <NeighborhoodSelector currentSlug={neighborhood.slug} />
      </div>

      {/* Main Content */}
      <div className="container-news section-spacing">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start mb-6 bg-surface">
                <TabsTrigger value="news" className="gap-2">
                  <Newspaper className="w-4 h-4" />
                  News
                </TabsTrigger>
                <TabsTrigger value="events" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Events
                </TabsTrigger>
                <TabsTrigger value="businesses" className="gap-2">
                  <Building2 className="w-4 h-4" />
                  Businesses
                </TabsTrigger>
                <TabsTrigger value="crime" className="gap-2">
                  <Shield className="w-4 h-4" />
                  Crime
                </TabsTrigger>
                <TabsTrigger value="about" className="gap-2">
                  <Info className="w-4 h-4" />
                  About
                </TabsTrigger>
              </TabsList>

              {/* News Tab */}
              <TabsContent value="news" className="space-y-4">
                {articlesLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <ArticleCardSkeleton key={i} variant="horizontal" />
                  ))
                ) : articles && articles.length > 0 ? (
                  <>
                    {articles.map((article) => (
                      <ArticleCard key={article.id} article={article} variant="horizontal" />
                    ))}
                    <Link 
                      to={`/news?neighborhood=${neighborhood.slug}`}
                      className="inline-flex items-center gap-1 text-accent hover:text-accent/80 font-medium"
                    >
                      View all {neighborhood.name} news
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </>
                ) : (
                  <EmptyState
                    icon={<Newspaper className="w-8 h-8" />}
                    title="No news yet"
                    description={`There are no news articles for ${neighborhood.name} yet. Check back soon!`}
                  />
                )}
              </TabsContent>

              {/* Events Tab */}
              <TabsContent value="events" className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">
                    {events?.length || 0} upcoming events in {neighborhood.name}
                  </p>
                  <Button asChild size="sm">
                    <Link to="/events/submit">
                      <Plus className="w-4 h-4 mr-1" />
                      Submit Event
                    </Link>
                  </Button>
                </div>
                
                {eventsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <EventCardSkeleton key={i} />
                    ))}
                  </div>
                ) : events && events.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {events.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Calendar className="w-8 h-8" />}
                    title="No upcoming events"
                    description={`There are no upcoming events in ${neighborhood.name}. Be the first to submit one!`}
                    action={{
                      label: "Submit an Event",
                      href: "/events/submit"
                    }}
                  />
                )}
              </TabsContent>

              {/* Businesses Tab */}
              <TabsContent value="businesses" className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">
                    {businesses?.length || 0} businesses in {neighborhood.name}
                  </p>
                  <Button asChild size="sm">
                    <Link to="/businesses/add">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Business
                    </Link>
                  </Button>
                </div>

                {businessesLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-48" />
                    ))}
                  </div>
                ) : businesses && businesses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {businesses.map((business) => (
                      <BusinessCard 
                        key={business.id} 
                        business={business}
                        neighborhoodName={neighborhood.name}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Building2 className="w-8 h-8" />}
                    title="No businesses listed"
                    description={`There are no businesses listed in ${neighborhood.name} yet. Add your business!`}
                    action={{
                      label: "Add a Business",
                      href: "/businesses/add"
                    }}
                  />
                )}
              </TabsContent>

              {/* Crime Tab */}
              <TabsContent value="crime" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Last 7 Days</span>
                      <Badge variant="outline">
                        {crimeData?.totalCount || 0} incidents
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {crimeLoading ? (
                      <Skeleton className="h-96" />
                    ) : crimeData && crimeData.incidents.length > 0 ? (
                      <div className="h-96 rounded-lg overflow-hidden">
                        <CrimeMap incidents={crimeData.incidents} />
                      </div>
                    ) : (
                      <div className="h-96 flex items-center justify-center bg-surface rounded-lg">
                        <div className="text-center">
                          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No incidents reported in the last 7 days</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Link 
                  to="/crime"
                  className="inline-flex items-center gap-1 text-accent hover:text-accent/80 font-medium"
                >
                  View full crime map
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      About {neighborhood.name}
                      {neighborhood.vibe && (
                        <Badge variant="secondary">{neighborhood.vibe}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {neighborhood.description ? (
                      <p className="text-muted-foreground leading-relaxed text-lg">
                        {neighborhood.description}
                      </p>
                    ) : (
                      <p className="text-muted-foreground italic">
                        No description available for this neighborhood.
                      </p>
                    )}

                    {/* Key Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {neighborhood.population && (
                        <div className="bg-surface rounded-lg p-4">
                          <div className="flex items-center gap-2 text-accent mb-1">
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-medium">Population</span>
                          </div>
                          <p className="text-xl font-bold text-foreground">
                            ~{neighborhood.population.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {neighborhood.established && (
                        <div className="bg-surface rounded-lg p-4">
                          <div className="flex items-center gap-2 text-accent mb-1">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">Established</span>
                          </div>
                          <p className="text-xl font-bold text-foreground">
                            {neighborhood.established}
                          </p>
                        </div>
                      )}
                      {neighborhood.zip_codes && neighborhood.zip_codes.length > 0 && (
                        <div className="bg-surface rounded-lg p-4">
                          <div className="flex items-center gap-2 text-accent mb-1">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm font-medium">ZIP Codes</span>
                          </div>
                          <p className="text-lg font-bold text-foreground">
                            {neighborhood.zip_codes.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Highlights */}
                    {neighborhood.highlights && neighborhood.highlights.length > 0 && (
                      <div>
                        <h4 className="font-medium text-foreground mb-3">Notable Landmarks & Features</h4>
                        <div className="flex flex-wrap gap-2">
                          {neighborhood.highlights.map((highlight, i) => (
                            <Badge key={i} variant="outline" className="text-sm py-1.5 px-3">
                              {highlight}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* External Links */}
                    {neighborhood.external_links && Object.keys(neighborhood.external_links).length > 0 && (
                      <div>
                        <h4 className="font-medium text-foreground mb-3">Learn More</h4>
                        <div className="flex flex-wrap gap-3">
                          {Object.entries(neighborhood.external_links as Record<string, string>).map(([key, url]) => (
                            <a
                              key={key}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-accent hover:text-accent/80 text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activity Stats */}
                    <div className="pt-4 border-t border-border">
                      <h4 className="font-medium text-foreground mb-3">Community Activity</h4>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-surface rounded-lg p-4">
                          <p className="text-2xl font-bold text-foreground">{stats?.articleCount || 0}</p>
                          <p className="text-sm text-muted-foreground">Articles this week</p>
                        </div>
                        <div className="bg-surface rounded-lg p-4">
                          <p className="text-2xl font-bold text-foreground">{stats?.eventCount || 0}</p>
                          <p className="text-sm text-muted-foreground">Upcoming events</p>
                        </div>
                        <div className="bg-surface rounded-lg p-4">
                          <p className="text-2xl font-bold text-foreground">{stats?.businessCount || 0}</p>
                          <p className="text-sm text-muted-foreground">Local businesses</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <NeighborhoodSidebar
              neighborhoodName={neighborhood.name}
              topBusinesses={topBusinesses}
              upcomingEvents={events?.slice(0, 3)}
              isLoading={statsLoading}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NeighborhoodDetail;
