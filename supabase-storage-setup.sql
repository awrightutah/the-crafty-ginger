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
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own videos" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can update videos" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete videos" ON storage.objects;

-- 3. Create policy to allow public read access (anyone can view videos)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- 4. Create policy to allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos' 
  AND auth.role() = 'authenticated'
);

-- 5. Create policy to allow authenticated users to update videos
CREATE POLICY "Users can update videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'videos');

-- 6. Create policy to allow authenticated users to delete videos
CREATE POLICY "Users can delete videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos');