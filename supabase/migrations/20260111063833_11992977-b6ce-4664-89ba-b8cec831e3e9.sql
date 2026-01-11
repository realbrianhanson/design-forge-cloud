
-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Allow authenticated users to upload event images
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-images');

-- Anyone can view event images (public bucket)
CREATE POLICY "Anyone can view event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

-- Users can update their own uploads
CREATE POLICY "Users can update their own event images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own uploads
CREATE POLICY "Users can delete their own event images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);
