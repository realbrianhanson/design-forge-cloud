import { Link } from 'react-router-dom';
import { MessageCircle, ExternalLink } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { getCategoryStyles, formatTimeAgo, formatCategoryDisplay } from '@/lib/articleUtils';
import { cn } from '@/lib/utils';

type ArticleVariant = 'featured' | 'standard' | 'horizontal' | 'compact';

interface ArticleCardProps {
  article: Tables<'articles'>;
  variant?: ArticleVariant;
  showImage?: boolean;
  showExcerpt?: boolean;
  className?: string;
}

export const ArticleCard = ({ 
  article, 
  variant = 'standard',
  showImage = true,
  showExcerpt = true,
  className 
}: ArticleCardProps) => {
  const categoryStyles = getCategoryStyles(article.category);
  const timeAgo = formatTimeAgo(article.published_at || article.created_at || new Date());
  const articleUrl = `/news/${article.slug || article.id}`;

  if (variant === 'featured') {
    return <FeaturedCard article={article} categoryStyles={categoryStyles} timeAgo={timeAgo} className={className} />;
  }

  if (variant === 'horizontal') {
    return <HorizontalCard article={article} categoryStyles={categoryStyles} timeAgo={timeAgo} showImage={showImage} showExcerpt={showExcerpt} className={className} />;
  }

  if (variant === 'compact') {
    return <CompactCard article={article} timeAgo={timeAgo} className={className} />;
  }

  return <StandardCard article={article} categoryStyles={categoryStyles} timeAgo={timeAgo} showImage={showImage} showExcerpt={showExcerpt} className={className} />;
};

// FEATURED VARIANT
const FeaturedCard = ({ 
  article, 
  categoryStyles, 
  timeAgo,
  className 
}: { 
  article: Tables<'articles'>; 
  categoryStyles: { bg: string; text: string }; 
  timeAgo: string;
  className?: string;
}) => {
  return (
    <Link 
      to={`/news/${article.slug || article.id}`}
      className={cn("group block", className)}
    >
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-0">
        {/* Image - 55% on desktop */}
        <div className="lg:w-[55%]">
          <div className="aspect-[16/10] overflow-hidden rounded-xl bg-surface">
            {article.image_url ? (
              <img 
                src={article.image_url} 
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                <span className="text-6xl">📰</span>
              </div>
            )}
          </div>
        </div>

        {/* Content - 45% on desktop */}
        <div className="lg:w-[45%] lg:pl-8 flex flex-col justify-center">
          <span className={cn(
            "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide w-fit",
            categoryStyles.bg,
            categoryStyles.text
          )}>
            {formatCategoryDisplay(article.category)}
          </span>
          
          <h2 className="text-3xl md:text-4xl font-bold text-primary leading-tight mt-3 group-hover:text-accent transition-colors">
            {article.title}
          </h2>
          
          {article.excerpt && (
            <p className="text-lg text-muted-foreground mt-4 line-clamp-3 leading-relaxed">
              {article.excerpt}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-6">
            <span className="flex items-center gap-1">
              {article.source_name}
              {article.source_url && <ExternalLink className="w-3 h-3" />}
            </span>
            <span>•</span>
            <span>{timeAgo}</span>
            {article.comment_count !== null && article.comment_count > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {article.comment_count}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

// STANDARD VARIANT (Grid Card)
const StandardCard = ({ 
  article, 
  categoryStyles, 
  timeAgo,
  showImage,
  showExcerpt,
  className 
}: { 
  article: Tables<'articles'>; 
  categoryStyles: { bg: string; text: string }; 
  timeAgo: string;
  showImage: boolean;
  showExcerpt: boolean;
  className?: string;
}) => {
  return (
    <Link 
      to={`/news/${article.slug || article.id}`}
      className={cn(
        "group block bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden",
        className
      )}
    >
      {showImage && (
        <div className="aspect-[16/10] overflow-hidden bg-surface">
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
      )}
      <div className="p-5">
        <span className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide",
          categoryStyles.bg,
          categoryStyles.text
        )}>
          {formatCategoryDisplay(article.category)}
        </span>
        
        <h3 className="text-lg font-semibold text-card-foreground line-clamp-2 mt-2 group-hover:text-accent transition-colors">
          {article.title}
        </h3>
        
        {showExcerpt && article.excerpt && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {article.excerpt}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
          <span>{article.source_name}</span>
          <span>{timeAgo}</span>
        </div>
      </div>
    </Link>
  );
};

// HORIZONTAL VARIANT (News Feed List)
const HorizontalCard = ({ 
  article, 
  categoryStyles, 
  timeAgo,
  showImage,
  showExcerpt,
  className 
}: { 
  article: Tables<'articles'>; 
  categoryStyles: { bg: string; text: string }; 
  timeAgo: string;
  showImage: boolean;
  showExcerpt: boolean;
  className?: string;
}) => {
  return (
    <Link 
      to={`/news/${article.slug || article.id}`}
      className={cn(
        "group flex flex-col sm:flex-row gap-4 sm:gap-5 p-4 bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200",
        className
      )}
    >
      {showImage && (
        <div className="w-full sm:w-40 md:w-48 h-40 sm:h-28 md:h-32 shrink-0 overflow-hidden rounded-lg bg-surface">
          {article.image_url ? (
            <img 
              src={article.image_url} 
              alt={article.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-3xl">📰</span>
            </div>
          )}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <span className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide",
          categoryStyles.bg,
          categoryStyles.text
        )}>
          {formatCategoryDisplay(article.category)}
        </span>
        
        <h3 className="text-lg sm:text-xl font-semibold text-card-foreground line-clamp-2 mt-1 group-hover:text-accent transition-colors">
          {article.title}
        </h3>
        
        {showExcerpt && article.excerpt && (
          <p className="text-muted-foreground mt-2 line-clamp-2 text-sm sm:text-base">
            {article.excerpt}
          </p>
        )}
        
        <div className="flex items-center gap-3 sm:gap-4 mt-3 text-xs sm:text-sm text-muted-foreground">
          <span className="truncate">{article.source_name}</span>
          <span>•</span>
          <span>{timeAgo}</span>
          {article.comment_count !== null && article.comment_count > 0 && (
            <>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {article.comment_count}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

// COMPACT VARIANT (Sidebar/Trending)
const CompactCard = ({ 
  article, 
  timeAgo,
  className 
}: { 
  article: Tables<'articles'>; 
  timeAgo: string;
  className?: string;
}) => {
  return (
    <Link 
      to={`/news/${article.slug || article.id}`}
      className={cn(
        "group flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors",
        className
      )}
    >
      <div className="w-20 h-20 shrink-0 overflow-hidden rounded-lg bg-surface">
        {article.image_url ? (
          <img 
            src={article.image_url} 
            alt={article.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-2xl">📰</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-card-foreground line-clamp-2 group-hover:text-accent transition-colors">
          {article.title}
        </h4>
        <p className="text-xs text-muted-foreground mt-1">
          {timeAgo}
        </p>
      </div>
    </Link>
  );
};

// SKELETON VARIANTS
export const ArticleCardSkeleton = ({ variant = 'standard' }: { variant?: ArticleVariant }) => {
  if (variant === 'featured') {
    return (
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-0">
        <div className="lg:w-[55%]">
          <Skeleton className="aspect-[16/10] rounded-xl" />
        </div>
        <div className="lg:w-[45%] lg:pl-8 flex flex-col justify-center">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-10 w-full mt-3" />
          <Skeleton className="h-10 w-3/4 mt-2" />
          <Skeleton className="h-6 w-full mt-4" />
          <Skeleton className="h-6 w-2/3 mt-1" />
          <Skeleton className="h-4 w-48 mt-6" />
        </div>
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className="flex gap-5 p-4 bg-card rounded-xl shadow-card">
        <Skeleton className="w-48 h-32 shrink-0 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-6 w-full mt-2" />
          <Skeleton className="h-6 w-3/4 mt-1" />
          <Skeleton className="h-4 w-full mt-2" />
          <Skeleton className="h-4 w-40 mt-3" />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex gap-3 p-2">
        <Skeleton className="w-20 h-20 shrink-0 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mt-1" />
          <Skeleton className="h-3 w-16 mt-2" />
        </div>
      </div>
    );
  }

  // Standard skeleton
  return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden">
      <Skeleton className="aspect-[16/10]" />
      <div className="p-5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-6 w-full mt-2" />
        <Skeleton className="h-6 w-3/4 mt-1" />
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-2/3 mt-1" />
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
};
