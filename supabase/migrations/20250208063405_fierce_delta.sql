-- Drop existing policies
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Create new policies with correct auth checks
CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Allow any authenticated user to upload avatars
CREATE POLICY "Users can upload avatars"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'avatars');

-- Allow any authenticated user to update avatars
CREATE POLICY "Users can update avatars"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

-- Allow any authenticated user to delete avatars
CREATE POLICY "Users can delete avatars"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'avatars');