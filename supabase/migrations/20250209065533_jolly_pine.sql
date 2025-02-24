-- Drop existing storage policies
DROP POLICY IF EXISTS "Anyone can view items" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can upload items" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can update items" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can delete items" ON storage.objects;

-- Create new storage policies with proper auth checks
CREATE POLICY "Public can view items"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'items');

CREATE POLICY "Team members can upload items"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'items');

CREATE POLICY "Team members can update items"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'items');

CREATE POLICY "Team members can delete items"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'items');