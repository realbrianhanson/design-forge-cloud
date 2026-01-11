import { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Breadcrumb } from '@/components/ui/breadcrumb-nav';
import { ArticleCard, ArticleCardSkeleton } from '@/components/home/ArticleCard';
import { EngagementBar } from '@/components/article/EngagementBar';
import { AiSummaryCard } from '@/components/article/AiSummaryCard';
import { CommentsSection } from '@/components/article/CommentsSection';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useArticle, useRelatedArticles } from '@/hooks/useArticles';
import { useArticleComments } from '@/hooks/useComments';
import { getCategoryStyles, formatCategoryDisplay } from '@/lib/articleUtils';
import { estimateReadingTime, formatFullDate } from '@/lib/readingUtils';
import { cn } from '@/lib/utils';

const ArticleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = useArticle(slug || '');
  const { data: relatedArticles, isLoading: relatedLoading } = useRelatedArticles(
    article?.category || '',
    article?.id || '',
    3
  );
  const { data: comments, isLoading: commentsLoading } = useArticleComments(article?.id || '');
  const viewTracked = useRef(false);

  // Track view count (once per session)
  useEffect(() => {
    if (article && !viewTracked.current) {
      viewTracked.current = true;
      // TODO: Implement view tracking mutation
    }
  }, [article]);

  const scrollToComments = () => {
    document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <Layout>
        <ArticleDetailSkeleton />
      </Layout>
    );
  }

  if (error || !article) {
    return (
      <Layout>
        <div className="section-spacing">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold text-primary mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/news">
              <Button>Back to News</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const categoryStyles = getCategoryStyles(article.category);
  const isAggregated = article.content_type === 'aggregated';
  // Placeholder for auth - would normally come from auth context
  const isLoggedIn = false;

  return (
    <Layout>
      <article className="section-spacing">
        <div className="max-w-3xl mx-auto px-4">
          {/* Breadcrumb */}
          <Breadcrumb 
            items={[
              { label: 'News', href: '/news' },
              { label: formatCategoryDisplay(article.category), href: `/news?category=${article.category}` },
            ]} 
          />

          {/* Article Header */}
          <header>
            <span className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide",
              categoryStyles.bg,
              categoryStyles.text
            )}>
              {formatCategoryDisplay(article.category)}
            </span>

            <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mt-4">
              {article.title}
            </h1>

            <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-6 text-muted-foreground">
              {article.source_name && (
                <span className="flex items-center gap-1">
                  via{' '}
                  {article.source_url ? (
                    <a 
                      href={article.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-accent hover:text-accent/80 inline-flex items-center gap-1"
                    >
                      {article.source_name}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    article.source_name
                  )}
                </span>
              )}
              <span>{formatFullDate(article.published_at || article.created_at || new Date())}</span>
              <span>{estimateReadingTime(article.content || article.excerpt || '')}</span>
            </div>

            <div className="border-b border-border mt-6" />
          </header>

          {/* Featured Image */}
          {article.image_url && (
            <figure className="mt-8">
              <div className="aspect-[16/9] rounded-xl overflow-hidden bg-muted">
                <img 
                  src={article.image_url} 
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </figure>
          )}

          {/* AI Summary Card */}
          {isAggregated && article.ai_summary && (
            <AiSummaryCard summary={article.ai_summary} />
          )}

          {/* Excerpt as Lead Paragraph */}
          {article.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed mt-8">
              {article.excerpt}
            </p>
          )}

          {/* Article Content (for original content) */}
          {article.content && !isAggregated && (
            <div className="prose prose-slate max-w-none mt-8">
              {article.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-foreground leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {/* Read Full Article CTA (for aggregated content) */}
          {isAggregated && article.source_url && (
            <div className="mt-8">
              <a 
                href={article.source_url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button 
                  size="lg" 
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg font-semibold"
                >
                  Read Full Article at {article.source_name}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <p className="text-sm text-muted-foreground mt-3">
                904News provides summaries and links to original reporting. We encourage you to support local journalism.
              </p>
            </div>
          )}

          {/* Engagement Bar */}
          <EngagementBar
            articleId={article.id}
            upvotes={article.upvotes || 0}
            commentCount={article.comment_count || 0}
            isLoggedIn={isLoggedIn}
            onCommentClick={scrollToComments}
          />

          {/* Related Articles */}
          <section className="mt-12 pt-8 border-t border-border">
            <h2 className="text-xl font-semibold text-primary mb-6">Related Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <ArticleCardSkeleton key={i} variant="standard" />
                ))
              ) : relatedArticles && relatedArticles.length > 0 ? (
                relatedArticles.map((relatedArticle) => (
                  <ArticleCard 
                    key={relatedArticle.id} 
                    article={relatedArticle} 
                    variant="standard"
                    showExcerpt={false}
                  />
                ))
              ) : (
                <p className="col-span-full text-muted-foreground text-center py-4">
                  No related articles found.
                </p>
              )}
            </div>
          </section>

          {/* Comments Section */}
          <CommentsSection
            articleId={article.id}
            comments={comments || []}
            commentCount={article.comment_count || 0}
            isLoggedIn={isLoggedIn}
            isLoading={commentsLoading}
          />
        </div>
      </article>
    </Layout>
  );
};

const ArticleDetailSkeleton = () => (
  <div className="section-spacing">
    <div className="max-w-3xl mx-auto px-4">
      <Skeleton className="h-4 w-48 mb-6" />
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-12 w-full mt-4" />
      <Skeleton className="h-12 w-3/4 mt-2" />
      <Skeleton className="h-4 w-64 mt-6" />
      <div className="border-b border-border mt-6" />
      <Skeleton className="aspect-[16/9] rounded-xl mt-8" />
      <Skeleton className="h-6 w-full mt-8" />
      <Skeleton className="h-6 w-full mt-2" />
      <Skeleton className="h-6 w-2/3 mt-2" />
    </div>
  </div>
);

export default ArticleDetail;
