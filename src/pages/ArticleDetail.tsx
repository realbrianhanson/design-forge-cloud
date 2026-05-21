import { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, ArrowRight, Info } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEO, generateArticleSchema } from '@/components/SEO';
import { Breadcrumb } from '@/components/ui/breadcrumb-nav';
import { ArticleCard, ArticleCardSkeleton } from '@/components/home/ArticleCard';
import { EngagementBar } from '@/components/article/EngagementBar';
import { AiSummaryCard } from '@/components/article/AiSummaryCard';
import {
  TldrBullets,
  LocalImpact,
  ArticleFaq,
  buildFaqJsonLd,
  type FaqItem,
} from '@/components/article/ArticleEnrichment';
import { CommentsSection } from '@/components/article/CommentsSection';
import { SourceBadge } from '@/components/article/SourceBadge';
import { RelatedIncidentCard } from '@/components/crime/RelatedIncidentCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
        <SEO 
          title="Article Not Found"
          description="The article you're looking for doesn't exist or has been removed."
          noindex
        />
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
  const isCrimeArticle = article.category?.toLowerCase() === 'crime';
  const hasRelatedIncident = !!(article as { related_incident_id?: string }).related_incident_id;
  // Placeholder for auth - would normally come from auth context
  const isLoggedIn = false;
  const articleUrl = `/news/${article.slug || article.id}`;
  const articleDescription = article.excerpt || article.ai_summary || '';

  // Enrichment fields (added by process-articles enrichment pass)
  const enriched = article as typeof article & {
    tldr_bullets?: string[] | null;
    local_impact?: string[] | null;
    faq?: FaqItem[] | null;
  };
  const tldr = Array.isArray(enriched.tldr_bullets) ? enriched.tldr_bullets : [];
  const localImpact = Array.isArray(enriched.local_impact) ? enriched.local_impact : [];
  const faq: FaqItem[] = Array.isArray(enriched.faq)
    ? (enriched.faq as FaqItem[]).filter(
        (q) => q && typeof q.question === 'string' && typeof q.answer === 'string'
      )
    : [];

  const articleSchema = generateArticleSchema({
    title: article.title,
    description: articleDescription,
    image: article.image_url || undefined,
    publishedAt: article.published_at || article.created_at || undefined,
    updatedAt: article.updated_at || undefined,
    author: article.source_name,
    url: articleUrl,
  });
  const structuredData =
    faq.length > 0 ? [articleSchema, buildFaqJsonLd(faq)] : articleSchema;

  return (
    <Layout>
      <SEO 
        title={article.title}
        description={articleDescription}
        image={article.image_url || undefined}
        url={articleUrl}
        type="article"
        article={{
          publishedTime: article.published_at || article.created_at || undefined,
          modifiedTime: article.updated_at || undefined,
          author: article.source_name,
          section: formatCategoryDisplay(article.category),
        }}
        structuredData={structuredData}
      />
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
                <div className="flex items-center gap-2">
                  <span className="text-sm">Originally published by</span>
                  <SourceBadge
                    source={{
                      name: article.source_name,
                      website_url: article.source_url,
                    }}
                    size="md"
                    showLink={!!article.source_url}
                  />
                </div>
              )}
              <span className="hidden sm:inline">•</span>
              <span>{formatFullDate(article.published_at || article.created_at || new Date())}</span>
              <span className="hidden sm:inline">•</span>
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
            <div className="mt-8 p-6 bg-muted/50 rounded-xl border border-border">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-3">
                    This article was originally published by <strong className="text-foreground">{article.source_name}</strong>
                  </p>
                  <a 
                    href={article.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button 
                      size="lg" 
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      Read Full Article
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </div>

              <Alert className="mt-4 bg-background border-border">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs text-muted-foreground">
                  904News aggregates local news with AI-generated summaries. Support local journalism by visiting the original source.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Related Crime Incident (for crime articles) */}
          {isCrimeArticle && hasRelatedIncident && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-primary mb-4">Related Incident</h3>
              <RelatedIncidentCard 
                incidentId={(article as { related_incident_id: string }).related_incident_id} 
              />
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
