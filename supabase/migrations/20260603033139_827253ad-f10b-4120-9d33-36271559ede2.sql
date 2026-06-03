
-- 1. user_profiles: restrict public read
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. newsletter_subscribers: explicit restrictive policy blocking anon SELECT
CREATE POLICY "Block anon from reading subscribers"
  ON public.newsletter_subscribers AS RESTRICTIVE
  FOR SELECT
  TO anon
  USING (false);

-- 3. businesses: tighten claim policy with WITH CHECK
DROP POLICY IF EXISTS "Authenticated users can claim businesses" ON public.businesses;
CREATE POLICY "Authenticated users can claim businesses"
  ON public.businesses FOR UPDATE
  TO authenticated
  USING ((claimed_by = auth.uid()) OR ((claimed = false) AND (claimed_by IS NULL)))
  WITH CHECK (claimed_by = auth.uid() AND claimed = true);

-- 4. business-photos storage: allow owners (who have claimed a business) to upload
CREATE POLICY "Business owners can upload photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-photos'
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.claimed_by = auth.uid()
        AND (storage.foldername(name))[1] = b.id::text
    )
  );

CREATE POLICY "Business owners can update own photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'business-photos'
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.claimed_by = auth.uid()
        AND (storage.foldername(name))[1] = b.id::text
    )
  );

CREATE POLICY "Business owners can delete own photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'business-photos'
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.claimed_by = auth.uid()
        AND (storage.foldername(name))[1] = b.id::text
    )
  );
