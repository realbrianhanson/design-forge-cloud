import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface HeroSectionProps {
  article: Tables<'articles'> | null;
  isLoading: boolean;
}

export const HeroSection = ({ article, isLoading }: HeroSectionProps) => {
  if (isLoading) {
    return <HeroSkeleton />;
  }

  if (!article) {
    return null;
  }

  const timeAgo = article.published_at 
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : formatDistanceToNow(new Date(article.created_at || new Date()), { addSuffix: true });

  return (
    <section className="section-spacing">
      <div className="container-news">
        <Link 
          to={`/news/${article.slug || article.id}`}
          className="group block"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Image - 55% on desktop */}
            <div className="lg:col-span-7">
              <div className="aspect-[16/10] overflow-hidden rounded-xl bg-surface">
                {article.image_url ? (
                  <img 
                    src={article.image_url} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <span className="text-6xl">📰</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content - 45% on desktop */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <span className="category-pill bg-accent/10 text-accent w-fit">
                {article.category}
              </span>
              
              <h1 className="text-3xl md:text-4xl font-bold text-primary leading-tight mt-3 group-hover:text-accent transition-colors">
                {article.title}
              </h1>
              
              {article.excerpt && (
                <p className="text-lg text-muted-foreground mt-4 line-clamp-3">
                  {article.excerpt}
                </p>
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                <span>{article.source_name}</span>
                <span>•</span>
                <span>{timeAgo}</span>
                {article.comment_count !== null && article.comment_count > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {article.comment_count} comments
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};

const HeroSkeleton = () => {
  return (
    <section className="section-spacing">
      <div className="container-news">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-7">
            <Skeleton className="aspect-[16/10] rounded-xl" />
          </div>
          <div className="lg:col-span-5 flex flex-col justify-center">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-10 w-full mt-3" />
            <Skeleton className="h-10 w-3/4 mt-2" />
            <Skeleton className="h-6 w-full mt-4" />
            <Skeleton className="h-6 w-2/3 mt-1" />
            <Skeleton className="h-4 w-48 mt-4" />
          </div>
        </div>
      </div>
    </section>
  );
};
