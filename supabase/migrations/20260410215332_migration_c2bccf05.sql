-- Create storage bucket for event photos
INSERT INTO storage.buckets (id, name, public) VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view photos (public bucket)
CREATE POLICY "Public read access for event photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-photos');

-- Admins and event managers can upload photos
CREATE POLICY "Admins and managers can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-photos'
  AND auth.role() = 'authenticated'
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.event_managers
      WHERE user_id = auth.uid()
        AND event_id::text = (storage.foldername(name))[1]
    )
  )
);

-- Admins and event managers can update photos
CREATE POLICY "Admins and managers can update photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-photos'
  AND auth.role() = 'authenticated'
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.event_managers
      WHERE user_id = auth.uid()
        AND event_id::text = (storage.foldername(name))[1]
    )
  )
);

-- Admins and event managers can delete photos
CREATE POLICY "Admins and managers can delete photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-photos'
  AND auth.role() = 'authenticated'
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.event_managers
      WHERE user_id = auth.uid()
        AND event_id::text = (storage.foldername(name))[1]
    )
  )
);