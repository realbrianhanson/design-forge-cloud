import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

interface BreakingNewsBannerProps {
  article: Tables<'articles'> | null;
}

const DISMISS_KEY = 'breaking_news_dismissed';

export const BreakingNewsBanner = ({ article }: BreakingNewsBannerProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && article) {
      // Check if the dismissed article is the same as current
      const dismissedData = JSON.parse(dismissed);
      if (dismissedData.id === article.id) {
        setIsDismissed(true);
      }
    }
  }, [article]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (article) {
      localStorage.setItem(DISMISS_KEY, JSON.stringify({ id: article.id, dismissedAt: new Date().toISOString() }));
    }
    setIsDismissed(true);
  };

  if (!article || isDismissed) return null;

  return (
    <Link 
      to={`/news/${article.slug || article.id}`}
      className="block w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
    >
      <div className="container-news py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="shrink-0 bg-white text-destructive px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">
            Breaking
          </span>
          <p className="text-sm font-medium truncate">
            {article.title}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Dismiss breaking news"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </Link>
  );
};
