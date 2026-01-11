import { Layout } from '@/components/layout/Layout';
import { BreakingNewsBanner } from '@/components/home/BreakingNewsBanner';
import { HeroSection } from '@/components/home/HeroSection';
import { SectionHeader } from '@/components/home/SectionHeader';
import { ArticleCard, ArticleCardSkeleton } from '@/components/home/ArticleCard';
import { EventCard, EventCardSkeleton } from '@/components/home/EventCard';
import { BusinessCard, BusinessCardSkeleton } from '@/components/home/BusinessCard';
import { useBreakingNews, useFeaturedArticle, useLatestArticles } from '@/hooks/useArticles';
import { useUpcomingEvents } from '@/hooks/useEvents';
import { useFeaturedBusinesses } from '@/hooks/useBusinesses';
import { useNeighborhoodMap } from '@/hooks/useNeighborhoods';

const Index = () => {
  const { data: breakingNews } = useBreakingNews();
  const { data: featuredArticle, isLoading: featuredLoading } = useFeaturedArticle();
  const { data: latestArticles, isLoading: articlesLoading } = useLatestArticles(featuredArticle?.id, 6);
  const { data: upcomingEvents, isLoading: eventsLoading } = useUpcomingEvents(4);
  const { data: featuredBusinesses, isLoading: businessesLoading } = useFeaturedBusinesses(4);
  const neighborhoodMap = useNeighborhoodMap();

  return (
    <Layout>
      {/* Breaking News Banner */}
      <BreakingNewsBanner article={breakingNews || null} />

      {/* Hero Section - Featured Article */}
      <HeroSection article={featuredArticle || null} isLoading={featuredLoading} />

      {/* Top Stories Grid */}
      <section className="section-spacing border-t border-border">
        <div className="container-news">
          <SectionHeader title="Latest News" viewAllLink="/news" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articlesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <ArticleCardSkeleton key={i} />
              ))
            ) : latestArticles && latestArticles.length > 0 ? (
              latestArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No articles available yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="section-spacing bg-surface">
        <div className="container-news">
          <SectionHeader title="Upcoming Events" viewAllLink="/events" />
          
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
            {eventsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))
            ) : upcomingEvents && upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 min-w-full">
                <p className="text-muted-foreground">No upcoming events.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Business Spotlight Section */}
      <section className="section-spacing">
        <div className="container-news">
          <SectionHeader 
            title="Discover Local" 
            viewAllLink="/directory" 
            viewAllText="View Directory"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {businessesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <BusinessCardSkeleton key={i} />
              ))
            ) : featuredBusinesses && featuredBusinesses.length > 0 ? (
              featuredBusinesses.map((business) => (
                <BusinessCard 
                  key={business.id} 
                  business={business} 
                  neighborhoodName={business.neighborhood_id ? neighborhoodMap.get(business.neighborhood_id) : undefined}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No featured businesses yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="section-spacing bg-primary">
        <div className="container-news text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-primary-foreground mb-3">
            Stay Connected to Jacksonville
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-6">
            Get the latest news, events, and local updates delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button className="px-6 py-3 bg-accent text-accent-foreground font-medium rounded-lg hover:bg-accent/90 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
