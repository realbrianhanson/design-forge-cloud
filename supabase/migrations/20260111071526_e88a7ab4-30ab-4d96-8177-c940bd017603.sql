-- Create AI processing logs table
CREATE TABLE public.ai_processing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  category_result TEXT,
  neighborhood_result TEXT,
  summary_result TEXT,
  is_breaking_result BOOLEAN DEFAULT false,
  tokens_used INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_processing_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view AI processing logs
CREATE POLICY "Admins can view AI processing logs"
ON public.ai_processing_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert AI processing logs (through edge function)
CREATE POLICY "Admins can insert AI processing logs"
ON public.ai_processing_logs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create index for performance
CREATE INDEX idx_ai_processing_logs_article_id ON public.ai_processing_logs(article_id);
CREATE INDEX idx_ai_processing_logs_created_at ON public.ai_processing_logs(created_at DESC);