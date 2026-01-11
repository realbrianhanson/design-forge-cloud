import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/SEO';
import { ArticleCard, ArticleCardSkeleton } from '@/components/home/ArticleCard';
import { CrimeMap } from '@/components/crime/CrimeMap';
import { CrimeStatsBar } from '@/components/crime/CrimeStatsBar';
import { DailyCrimeDigest } from '@/components/crime/DailyCrimeDigest';
import { useInfiniteArticles } from '@/hooks/useArticles';
import { useCrimeIncidents, useCrimeStats, CrimeFilters } from '@/hooks/useCrimeData';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const CrimeSection = () => {
  const [searchParams] = useSearchParams();
  
  // Crime data with 7-day filter
  const [filters] = useState<CrimeFilters>({
    dateRange: 'week',
    categories: ['violent', 'property', 'other'],
    incidentTypes: [],
  });

  const { data: incidents = [], isLoading: incidentsLoading } = useCrimeIncidents(filters);
  const { data: stats, isLoading: statsLoading } = useCrimeStats(filters);

  // Crime articles
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: articlesLoading,
  } = useInfiniteArticles('crime', 10);

  const articles = data?.pages.flatMap(page => page.articles) ?? [];

  return (
    <Layout>
      <SEO 
        title="Crime & Safety"
        description="Jacksonville crime news, incident reports, and safety information. Stay informed about crime trends in your neighborhood."
        url="/news/crime"
      />

      <div className="section-spacing">
        <div className="container-news">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-primary">
              Crime & Safety
            </h1>
            <p className="text-muted-foreground mt-1">
              Stay informed about crime in Jacksonville
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <main className="flex-1 lg:max-w-[65%]">
              {/* Crime Map Embed */}
              <div className="bg-card rounded-xl shadow-card overflow-hidden mb-8">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-card-foreground">
                    Crime Map - Last 7 Days
                  </h2>
                </div>
                <div className="h-[400px]">
                  <CrimeMap 
                    incidents={incidents} 
                    isLoading={incidentsLoading}
                  />
                </div>
                <div className="p-4 border-t border-border bg-muted/30">
                  <CrimeStatsBar 
                    stats={stats}
                    isLoading={statsLoading}
                    className="shadow-none p-0 bg-transparent"
                  />
                </div>
              </div>

              {/* Crime News */}
              <div>
                <h2 className="text-xl font-bold text-primary mb-4">
                  Latest Crime News
                </h2>
                
                <div className="space-y-0">
                  {articlesLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="border-b border-border pb-6 mb-6">
                        <ArticleCardSkeleton variant="horizontal" />
                      </div>
                    ))
                  ) : articles.length > 0 ? (
                    articles.map((article, index) => (
                      <div 
                        key={article.id} 
                        className={cn(
                          index !== articles.length - 1 && "border-b border-border pb-6 mb-6"
                        )}
                      >
                        <ArticleCard article={article} variant="horizontal" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-3">📰</div>
                      <p className="text-muted-foreground">No crime articles found</p>
                    </div>
                  )}
                </div>

                {hasNextPage && (
                  <div className="flex justify-center mt-8">
                    <Button
                      variant="outline"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </main>

            {/* Sidebar */}
            <aside className="lg:w-[35%] space-y-6">
              {/* Daily Digest */}
              <DailyCrimeDigest />

              {/* Safety Tips */}
              <div className="bg-card rounded-xl p-5 shadow-card">
                <h3 className="font-semibold text-card-foreground mb-3">
                  🛡️ Safety Resources
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a 
                      href="https://www.jaxsheriff.org" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-accent transition-colors"
                    >
                      → Jacksonville Sheriff's Office
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://transparency.jaxsheriff.org" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-accent transition-colors"
                    >
                      → JSO Transparency Portal
                    </a>
                  </li>
                  <li>
                    <a 
                      href="tel:911" 
                      className="hover:text-accent transition-colors"
                    >
                      → Emergency: 911
                    </a>
                  </li>
                  <li>
                    <a 
                      href="tel:904-630-0500" 
                      className="hover:text-accent transition-colors"
                    >
                      → Non-Emergency: 904-630-0500
                    </a>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CrimeSection;