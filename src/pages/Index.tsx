import { Layout } from '@/components/layout/Layout';
import { SEO, generateWebsiteSchema } from '@/components/SEO';
import { BreakingNewsBanner } from '@/components/home/BreakingNewsBanner';
import { HeroSection } from '@/components/home/HeroSection';
import { SectionHeader } from '@/components/home/SectionHeader';
import { ArticleCard, ArticleCardSkeleton } from '@/components/home/ArticleCard';
import { EventCard, EventCardSkeleton } from '@/components/home/EventCard';
import { BusinessCard, BusinessCardSkeleton } from '@/components/home/BusinessCard';
import { NewsletterSignupForm } from '@/components/newsletter/NewsletterSignupForm';
import { EmptyArticles, EmptyEvents, EmptyBusinesses } from '@/components/ui/empty-state';
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
      <SEO 
        url="/"
        type="website"
        structuredData={generateWebsiteSchema()}
      />
      {/* Breaking News Banner */}
      <BreakingNewsBanner article={breakingNews || null} />

      {/* Hero Section - Featured Article */}
      <HeroSection article={featuredArticle || null} isLoading={featuredLoading} />

      {/* Top Stories Grid */}
      <section className="section-spacing border-t border-border">
        <div className="container-news">
          <SectionHeader title="Latest News" viewAllLink="/news" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {articlesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <ArticleCardSkeleton key={i} />
              ))
            ) : latestArticles && latestArticles.length > 0 ? (
              latestArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))
            ) : (
              <div className="col-span-full">
                <EmptyArticles />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="section-spacing bg-surface">
        <div className="container-news">
          <SectionHeader title="Upcoming Events" viewAllLink="/events" />
          
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible snap-x-mandatory">
            {eventsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-[280px] sm:min-w-0 snap-start">
                  <EventCardSkeleton />
                </div>
              ))
            ) : upcomingEvents && upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div key={event.id} className="min-w-[280px] sm:min-w-0 snap-start">
                  <EventCard event={event} />
                </div>
              ))
            ) : (
              <div className="col-span-full min-w-full">
                <EmptyEvents />
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
            viewAllLink="/businesses" 
            viewAllText="View Directory"
          />
          
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible snap-x-mandatory">
            {businessesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-[280px] sm:min-w-0 snap-start">
                  <BusinessCardSkeleton />
                </div>
              ))
            ) : featuredBusinesses && featuredBusinesses.length > 0 ? (
              featuredBusinesses.map((business) => (
                <div key={business.id} className="min-w-[280px] sm:min-w-0 snap-start">
                  <BusinessCard 
                    business={business} 
                    neighborhoodName={business.neighborhood_id ? neighborhoodMap.get(business.neighborhood_id) : undefined}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full">
                <EmptyBusinesses />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="section-spacing bg-primary">
        <div className="container-news">
          <div className="max-w-2xl mx-auto">
            <NewsletterSignupForm variant="inline" source="homepage" />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
