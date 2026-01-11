import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/SEO';
import { NeighborhoodCard, NeighborhoodCardSkeleton } from '@/components/neighborhood/NeighborhoodCard';
import { useNeighborhoodsWithStats } from '@/hooks/useNeighborhoods';
import { MapPin } from 'lucide-react';

const Neighborhoods = () => {
  const { data: neighborhoodsWithStats, isLoading } = useNeighborhoodsWithStats();

  return (
    <Layout>
      <SEO
        title="Explore Jacksonville Neighborhoods"
        description="Discover local news, events, businesses, and crime stats for Jacksonville's diverse neighborhoods. Find your community."
        url="/neighborhoods"
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-12 md:py-16">
        <div className="container-news">
          <div className="flex items-center gap-3 text-accent mb-4">
            <MapPin className="w-6 h-6" />
            <span className="text-sm font-semibold uppercase tracking-wide">Explore</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Jacksonville Neighborhoods
          </h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl">
            Explore what's happening in your neighborhood. Get local news, upcoming events, 
            discover businesses, and stay informed about crime in your area.
          </p>
        </div>
      </section>

      {/* Neighborhoods Grid */}
      <section className="section-spacing">
        <div className="container-news">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 12 }).map((_, i) => (
                <NeighborhoodCardSkeleton key={i} />
              ))
            ) : neighborhoodsWithStats && neighborhoodsWithStats.length > 0 ? (
              neighborhoodsWithStats.map(({ neighborhood, stats }) => (
                <NeighborhoodCard
                  key={neighborhood.id}
                  neighborhood={neighborhood}
                  stats={stats}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No neighborhoods found.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Neighborhoods;
