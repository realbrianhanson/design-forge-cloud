import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface ArticleCardProps {
  article: Tables<'articles'>;
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  const timeAgo = article.published_at 
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : formatDistanceToNow(new Date(article.created_at || new Date()), { addSuffix: true });

  return (
    <Link 
      to={`/news/${article.slug || article.id}`}
      className="group block bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200"
    >
      <div className="aspect-[16/10] overflow-hidden rounded-t-xl bg-surface">
        {article.image_url ? (
          <img 
            src={article.image_url} 
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-4xl">📰</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <span className="category-pill bg-accent/10 text-accent">
          {article.category}
        </span>
        <h3 className="text-lg font-semibold text-card-foreground line-clamp-2 mt-2 group-hover:text-accent transition-colors">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
          <span>{article.source_name}</span>
          <span>{timeAgo}</span>
        </div>
      </div>
    </Link>
  );
};

export const ArticleCardSkeleton = () => {
  return (
    <div className="bg-card rounded-xl shadow-card">
      <Skeleton className="aspect-[16/10] rounded-t-xl" />
      <div className="p-5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-6 w-full mt-2" />
        <Skeleton className="h-6 w-3/4 mt-1" />
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-2/3 mt-1" />
        <div className="flex items-center justify-between mt-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
};
