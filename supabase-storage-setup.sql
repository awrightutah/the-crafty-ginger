-- ============================================
-- Supabase Storage Setup for Video Uploads
-- ============================================
-- Run this SQL in your Supabase SQL Editor

-- 1. Create the 'videos' storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  52428800, -- 50MB in bytes
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create policy to allow public read access (anyone can view videos)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- 3. Create policy to allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos' 
  AND auth.role() = 'authenticated'
);

-- 4. Create policy to allow users to update their own uploaded videos
CREATE POLICY "Users can update own videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Create policy to allow users to delete their own uploaded videos
CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- ALTERNATIVE: Simpler policies for admin-only uploads
-- ============================================
-- If you want only admins to upload, use these policies instead:

/*
-- Drop the above policies first, then run:

CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Admin users can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos' 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admin users can update videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'videos' 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admin users can delete videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos' 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);
*/