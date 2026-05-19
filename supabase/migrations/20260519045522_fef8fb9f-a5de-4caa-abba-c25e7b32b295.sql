INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('business-photos', 'business-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view business photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-photos');

CREATE POLICY "Admins can manage business photos"
ON storage.objects FOR ALL
USING (bucket_id = 'business-photos' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'business-photos' AND has_role(auth.uid(), 'admin'::app_role));