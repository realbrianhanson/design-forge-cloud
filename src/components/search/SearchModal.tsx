import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, FileText, Calendar, Building2 } from 'lucide-react';
import { useSearch, SearchResult, SearchResultType } from '@/hooks/useSearch';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

interface ResultItemProps {
  result: SearchResult;
  query: string;
  onClick: () => void;
  isSelected: boolean;
}

function ResultItem({ result, query, onClick, isSelected }: ResultItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors duration-150",
        isSelected ? "bg-accent/10" : "hover:bg-muted"
      )}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
        {getTypeIcon(result.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium text-accent uppercase tracking-wide">
            {getTypeLabel(result.type)}
          </span>
          {result.category && (
            <span className="text-xs text-muted-foreground">• {result.category}</span>
          )}
        </div>
        <h4 className="font-medium text-primary truncate">
          {highlightMatch(result.title, query)}
        </h4>
        {result.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
            {highlightMatch(result.excerpt, query)}
          </p>
        )}
        {result.date && (
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(result.date), result.type === 'event' ? 'MMM d, yyyy • h:mm a' : 'MMM d, yyyy')}
          </p>
        )}
      </div>
    </button>
  );
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: results, isLoading } = useSearch(debouncedQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setDebouncedQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const allResults = results
    ? [...results.articles, ...results.events, ...results.businesses]
    : [];

  const handleResultClick = useCallback((result: SearchResult) => {
    navigate(getResultPath(result));
    onClose();
  }, [navigate, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      e.preventDefault();
      handleResultClick(allResults[selectedIndex]);
    }
  };

  const handleViewAll = () => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative bg-background rounded-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search news, events, businesses..."
            className="flex-1 bg-transparent text-lg placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">
            ESC
          </span>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {!debouncedQuery && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-10 h-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Type to start searching</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Search across news, events, and businesses
              </p>
            </div>
          )}

          {debouncedQuery && isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          )}

          {debouncedQuery && !isLoading && results && (
            <>
              {results.totalCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">
                    No results found for "<span className="font-medium text-foreground">{debouncedQuery}</span>"
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Try different keywords or check your spelling
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Articles */}
                  {results.articles.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mb-2">
                        News ({results.articles.length})
                      </h3>
                      <div className="space-y-1">
                        {results.articles.map((result, index) => (
                          <ResultItem
                            key={result.id}
                            result={result}
                            query={debouncedQuery}
                            onClick={() => handleResultClick(result)}
                            isSelected={selectedIndex === index}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Events */}
                  {results.events.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mb-2">
                        Events ({results.events.length})
                      </h3>
                      <div className="space-y-1">
                        {results.events.map((result, index) => (
                          <ResultItem
                            key={result.id}
                            result={result}
                            query={debouncedQuery}
                            onClick={() => handleResultClick(result)}
                            isSelected={selectedIndex === results.articles.length + index}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Businesses */}
                  {results.businesses.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mb-2">
                        Businesses ({results.businesses.length})
                      </h3>
                      <div className="space-y-1">
                        {results.businesses.map((result, index) => (
                          <ResultItem
                            key={result.id}
                            result={result}
                            query={debouncedQuery}
                            onClick={() => handleResultClick(result)}
                            isSelected={selectedIndex === results.articles.length + results.events.length + index}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {debouncedQuery && results && results.totalCount > 0 && (
          <div className="border-t border-border p-3">
            <button
              onClick={handleViewAll}
              className="w-full text-center text-sm font-medium text-accent hover:text-accent/80 transition-colors py-2"
            >
              View all results →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
