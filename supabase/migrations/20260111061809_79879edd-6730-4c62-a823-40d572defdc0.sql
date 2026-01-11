
-- Fix permissive newsletter INSERT policy
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;

-- Create a more restrictive policy that requires email to be provided
-- and optionally links to authenticated user
CREATE POLICY "Anyone can subscribe with email"
ON public.newsletter_subscribers FOR INSERT
WITH CHECK (
  email IS NOT NULL 
  AND char_length(email) > 0
  AND (user_id IS NULL OR user_id = auth.uid())
);
