-- Drop existing storage policies
DROP POLICY IF EXISTS "Team members can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can insert blog images" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view blog images" ON storage.objects;

-- Create simplified storage policies
CREATE POLICY "Anyone can manage blog images"
  ON storage.objects FOR ALL
  TO public
  USING (bucket_id = 'blogs')
  WITH CHECK (bucket_id = 'blogs');