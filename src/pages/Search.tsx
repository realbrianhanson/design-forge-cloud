import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Search as SearchIcon, FileText, Calendar, Building2, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/SEO';
import { useSearch, SearchResult, SearchResultType } from '@/hooks/useSearch';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() 
      ? <mark key={i} className="bg-accent/20 text-foreground px-0.5 rounded">{part}</mark>
      : part
  );
}

function getTypeIcon(type: SearchResultType) {
  switch (type) {
    case 'article':
      return <FileText className="w-4 h-4" />;
    case 'event':
      return <Calendar className="w-4 h-4" />;
    case 'business':
      return <Building2 className="w-4 h-4" />;
  }
}

function getTypeLabel(type: SearchResultType) {
  switch (type) {
    case 'article':
      return 'News';
    case 'event':
      return 'Event';
    case 'business':
      return 'Business';
  }
}

function getResultPath(result: SearchResult): string {
  switch (result.type) {
    case 'article':
      return `/article/${result.slug || result.id}`;
    case 'event':
      return `/event/${result.slug || result.id}`;
    case 'business':
      return `/business/${result.slug || result.id}`;
  }
}

const tabs = [
  { id: 'all', label: 'All Results' },
  { id: 'article', label: 'News' },
  { id: 'event', label: 'Events' },
  { id: 'business', label: 'Businesses' },
] as const;

type TabType = typeof tabs[number]['id'];

interface SearchResultCardProps {
  result: SearchResult;
  query: string;
}

function SearchResultCard({ result, query }: SearchResultCardProps) {
  return (
    <Link
      to={getResultPath(result)}
      className="flex gap-4 p-4 bg-card rounded-xl hover:shadow-md transition-all duration-200 border border-border/50 hover:border-border group"
    >
      {result.image_url && (
        <div className="hidden sm:block w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          <img
            src={result.image_url}
            alt={result.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
            result.type === 'article' && "bg-blue-100 text-blue-700",
            result.type === 'event' && "bg-purple-100 text-purple-700",
            result.type === 'business' && "bg-emerald-100 text-emerald-700"
          )}>
            {getTypeIcon(result.type)}
            {getTypeLabel(result.type)}
          </span>
          {result.category && (
            <span className="text-xs text-muted-foreground">{result.category}</span>
          )}
        </div>
        <h3 className="font-semibold text-primary group-hover:text-accent transition-colors mb-1 line-clamp-2">
          {highlightMatch(result.title, query)}
        </h3>
        {result.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {highlightMatch(result.excerpt, query)}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {result.date && (
            <span>
              {format(new Date(result.date), result.type === 'event' ? 'MMM d, yyyy • h:mm a' : 'MMM d, yyyy')}
            </span>
          )}
          {result.neighborhood && (
            <span>{result.neighborhood}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  const initialType = (searchParams.get('type') as TabType) || 'all';
  
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<TabType>(initialType);
  
  const searchType = activeTab === 'all' ? 'all' : activeTab as SearchResultType;
  const { data: results, isLoading } = useSearch(query, searchType);

  // Update URL when query or tab changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (activeTab !== 'all') params.set('type', activeTab);
    setSearchParams(params, { replace: true });
  }, [query, activeTab, setSearchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const allResults = results
    ? activeTab === 'all'
      ? [...results.articles, ...results.events, ...results.businesses]
      : activeTab === 'article'
      ? results.articles
      : activeTab === 'event'
      ? results.events
      : results.businesses
    : [];

  const getTabCount = (tabId: TabType): number => {
    if (!results) return 0;
    switch (tabId) {
      case 'all':
        return results.totalCount;
      case 'article':
        return results.articles.length;
      case 'event':
        return results.events.length;
      case 'business':
        return results.businesses.length;
    }
  };

  return (
    <Layout>
      <SEO 
        title={query ? `Search results for "${query}"` : 'Search'}
        description={query ? `Find news, events, and businesses in Jacksonville matching "${query}".` : 'Search 904News for local news, events, and businesses in Jacksonville, FL.'}
        url={query ? `/search?q=${encodeURIComponent(query)}` : '/search'}
        noindex
      />
      <div className="container-news py-8">
        {/* Search Header */}
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search news, events, businesses..."
                className="w-full pl-12 pr-4 py-4 text-lg bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                autoFocus
              />
            </div>
          </form>
        </div>

        {/* Results Section */}
        {query && (
          <>
            {/* Results Count */}
            <div className="mb-4">
              <p className="text-muted-foreground">
                {isLoading ? (
                  'Searching...'
                ) : (
                  <>
                    <span className="font-medium text-foreground">{allResults.length}</span> results for "{query}"
                  </>
                )}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    activeTab === tab.id
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {tab.label}
                  {results && (
                    <span className="ml-1.5 text-xs opacity-70">
                      ({getTabCount(tab.id)})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Results List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : allResults.length > 0 ? (
              <div className="space-y-4">
                {allResults.map((result) => (
                  <SearchResultCard key={`${result.type}-${result.id}`} result={result} query={query} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <SearchIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-primary mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  We couldn't find anything matching "{query}". Try different keywords.
                </p>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!query && (
          <div className="text-center py-16">
            <SearchIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-primary mb-2">Search 904News</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Find local news, upcoming events, and businesses in Jacksonville.
              Start typing to search across all content.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
