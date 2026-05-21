ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS tldr_bullets text[],
  ADD COLUMN IF NOT EXISTS local_impact text[],
  ADD COLUMN IF NOT EXISTS faq jsonb,
  ADD COLUMN IF NOT EXISTS enrichment_status text DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_articles_enrichment_status
  ON public.articles(enrichment_status)
  WHERE enrichment_status = 'pending';