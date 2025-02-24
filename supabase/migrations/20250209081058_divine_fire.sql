-- Drop existing policies
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage avatars" ON storage.objects;

-- Update avatars bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'avatars';

-- Create new storage policies
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can manage avatars"
  ON storage.objects FOR ALL
  TO public
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');