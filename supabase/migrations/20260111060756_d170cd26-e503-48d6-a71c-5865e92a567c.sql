-- Fix function search_path security issue
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public;

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can submit articles" ON public.articles;

-- Create a more restrictive INSERT policy - users can only insert articles where author_id matches their own ID
CREATE POLICY "Authenticated users can submit their own articles"
ON public.articles FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());