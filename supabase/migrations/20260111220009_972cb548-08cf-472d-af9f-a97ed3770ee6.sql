-- Create RSS sources table for Jacksonville news feeds
CREATE TABLE public.rss_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  feed_url TEXT NOT NULL,
  website_url TEXT,
  logo_url TEXT,
  category_default TEXT,
  is_active BOOLEAN DEFAULT true,
  fetch_frequency_minutes INTEGER DEFAULT 30,
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  articles_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on rss_sources
ALTER TABLE public.rss_sources ENABLE ROW LEVEL SECURITY;

-- Anyone can view RSS sources
CREATE POLICY "Anyone can view RSS sources"
ON public.rss_sources FOR SELECT
USING (true);

-- Only admins can manage RSS sources
CREATE POLICY "Admins can manage RSS sources"
ON public.rss_sources FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RSS source tracking columns to articles
ALTER TABLE public.articles 
ADD COLUMN rss_source_id UUID REFERENCES public.rss_sources(id),
ADD COLUMN external_id TEXT;

-- Create unique constraint to prevent duplicate articles from same source
CREATE UNIQUE INDEX idx_articles_rss_source_external_id 
ON public.articles(rss_source_id, external_id) 
WHERE rss_source_id IS NOT NULL AND external_id IS NOT NULL;

-- Create index on external_id for fast duplicate checking
CREATE INDEX idx_articles_external_id ON public.articles(external_id);

-- Seed Jacksonville RSS sources
INSERT INTO public.rss_sources (name, slug, feed_url, website_url, category_default) VALUES
('News4Jax', 'news4jax', 'https://www.news4jax.com/arcio/rss/', 'https://www.news4jax.com', 'local_news'),
('First Coast News', 'first-coast-news', 'https://www.firstcoastnews.com/feeds/syndication/rss/news', 'https://www.firstcoastnews.com', 'local_news'),
('Jacksonville Today', 'jax-today', 'https://jaxtoday.org/feed', 'https://jaxtoday.org', 'local_news'),
('Action News Jax', 'action-news-jax', 'https://www.actionnewsjax.com/rss/', 'https://www.actionnewsjax.com', 'local_news'),
('Jacksonville Business Journal', 'jax-biz-journal', 'https://www.bizjournals.com/jacksonville/news/all.atom', 'https://www.bizjournals.com/jacksonville', 'business'),
('The Jaxson', 'the-jaxson', 'https://thejaxsonmag.com/feed.xml', 'https://thejaxsonmag.com', 'local_news'),
('The Tributary', 'the-tributary', 'https://jaxtrib.org/feed', 'https://jaxtrib.org', 'politics'),
('Jacksonville Free Press', 'jax-free-press', 'https://jacksonvillefreepress.com/feed', 'https://jacksonvillefreepress.com', 'local_news');