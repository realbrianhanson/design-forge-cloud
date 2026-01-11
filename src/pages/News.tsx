import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Loader2, Mail, Cloud, Sun } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ArticleCard, ArticleCardSkeleton } from '@/components/home/ArticleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInfiniteArticles, useTrendingArticles } from '@/hooks/useArticles';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'local', label: 'Local' },
  { value: 'crime', label: 'Crime' },
  { value: 'politics', label: 'Politics' },
  { value: 'business', label: 'Business' },
  { value: 'sports', label: 'Sports' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'weather', label: 'Weather' },
];

const News = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeCategory = searchParams.get('category') || '';
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteArticles(activeCategory, 10);

  const { data: trendingArticles, isLoading: trendingLoading } = useTrendingArticles(5);

  const articles = data?.pages.flatMap(page => page.articles) ?? [];

  const handleCategoryChange = (category: string) => {
    if (category) {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <Layout>
      <div className="section-spacing">
        <div className="container-news">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Column */}
            <main className="flex-1 lg:max-w-[65%]">
              {/* Page Header */}
              <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-primary">Latest News</h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                  Stay informed with Jacksonville's top stories
                </p>
              </div>

              {/* Category Filter Bar */}
              <div className="sticky top-14 md:top-0 z-10 bg-background border-b border-border py-3 -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 snap-x-mandatory">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => handleCategoryChange(category.value)}
                      className={cn(
                        "px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-colors snap-start",
                        activeCategory === category.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Article List */}
              <div className="space-y-0">
                {isLoading ? (
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
                  <EmptyState category={activeCategory} />
                )}
              </div>

              {/* Load More Button */}
              {hasNextPage && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="min-w-[200px] min-h-[48px]"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More Articles'
                    )}
                  </Button>
                </div>
              )}
            </main>

            {/* Sidebar */}
            <aside className="lg:w-[35%] space-y-6">
              {/* Search Box */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 shadow-sm"
                />
              </form>

              {/* Trending Section */}
              <div className="bg-card rounded-xl p-5 shadow-card">
                <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                  Trending <span>🔥</span>
                </h3>
                <div className="space-y-1">
                  {trendingLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-2xl font-bold text-accent/30 w-6">{i + 1}</span>
                        <div className="flex-1">
                          <ArticleCardSkeleton variant="compact" />
                        </div>
                      </div>
                    ))
                  ) : trendingArticles && trendingArticles.length > 0 ? (
                    trendingArticles.map((article, index) => (
                      <div key={article.id} className="flex items-start gap-3">
                        <span className="text-2xl font-bold text-accent w-6 shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <ArticleCard article={article} variant="compact" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No trending articles yet.</p>
                  )}
                </div>
              </div>

              {/* Newsletter Signup */}
              <div className="bg-gradient-to-br from-muted to-muted/50 rounded-xl p-6">
                <div className="text-3xl mb-3">✉️</div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  Daily Jacksonville Digest
                </h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Top stories delivered every morning
                </p>
                <form className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="bg-background"
                  />
                  <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    Subscribe
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-3">
                  No spam, ever. Unsubscribe anytime.
                </p>
              </div>

              {/* Weather Widget */}
              <div className="bg-card rounded-xl p-5 shadow-card">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Jacksonville Weather
                </h3>
                <div className="flex items-center gap-3">
                  <Sun className="w-10 h-10 text-warning" />
                  <div>
                    <span className="text-3xl font-semibold text-card-foreground">78°F</span>
                    <p className="text-sm text-muted-foreground">Sunny</p>
                  </div>
                </div>
                <a 
                  href="#" 
                  className="text-sm text-accent hover:text-accent/80 mt-3 inline-block transition-colors"
                >
                  View Forecast →
                </a>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const EmptyState = ({ category }: { category: string }) => {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">📭</div>
      <h3 className="text-xl font-semibold text-primary mb-2">No articles found</h3>
      <p className="text-muted-foreground">
        {category 
          ? `No articles in the "${category}" category yet.`
          : 'No articles available at the moment.'}
      </p>
      <p className="text-muted-foreground mt-1">
        Try a different category or check back later.
      </p>
    </div>
  );
};

export default News;
