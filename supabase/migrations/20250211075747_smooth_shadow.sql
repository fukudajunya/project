-- Drop existing storage policies
DROP POLICY IF EXISTS "Team members can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can insert blog images" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can delete blog images" ON storage.objects;

-- Create new storage policies with team-specific paths
CREATE POLICY "Team members can view blog images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'blogs');

CREATE POLICY "Representatives and staff can insert blog images"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'blogs'
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
      AND split_part(objects.name, '/', 1) = dancers.team_id::text
    )
  );

CREATE POLICY "Representatives and staff can update blog images"
  ON storage.objects FOR UPDATE
  TO public
  USING (
    bucket_id = 'blogs'
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
      AND split_part(objects.name, '/', 1) = dancers.team_id::text
    )
  );

CREATE POLICY "Representatives and staff can delete blog images"
  ON storage.objects FOR DELETE
  TO public
  USING (
    bucket_id = 'blogs'
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
      AND split_part(objects.name, '/', 1) = dancers.team_id::text
    )
  );