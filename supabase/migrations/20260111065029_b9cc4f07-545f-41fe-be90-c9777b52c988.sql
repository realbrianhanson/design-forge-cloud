-- Allow authenticated users to submit new businesses
CREATE POLICY "Authenticated users can submit businesses"
ON public.businesses
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must either claim the business or submit without claiming
  (claimed_by = auth.uid()) OR (claimed_by IS NULL)
);

-- Allow users to update their own pending business submissions
CREATE POLICY "Users can update own pending businesses"
ON public.businesses
FOR UPDATE
TO authenticated
USING (
  claimed_by = auth.uid() AND status = 'pending'
)
WITH CHECK (
  claimed_by = auth.uid() AND status = 'pending'
);