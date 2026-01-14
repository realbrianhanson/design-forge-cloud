-- Add language column to articles table
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'en';

-- Create index for language filtering
CREATE INDEX IF NOT EXISTS idx_articles_language ON public.articles(language);

-- Update existing articles to be marked as English
UPDATE public.articles SET language = 'en' WHERE language IS NULL;