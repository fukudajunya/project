-- Drop existing policies
DROP POLICY IF EXISTS "Representatives and staff can create items" ON items;
DROP POLICY IF EXISTS "Representatives and staff can update items" ON items;
DROP POLICY IF EXISTS "Representatives and staff can delete items" ON items;

-- Create new policies for items table with proper auth checks
CREATE POLICY "Representatives and staff can create items"
  ON items FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = items.created_by
      AND dancers.team_id = items.team_id
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );

CREATE POLICY "Representatives and staff can update items"
  ON items FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = items.team_id
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );

CREATE POLICY "Representatives and staff can delete items"
  ON items FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = items.team_id
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public can view items" ON storage.objects;
DROP POLICY IF EXISTS "Team members can upload items" ON storage.objects;
DROP POLICY IF EXISTS "Team members can update items" ON storage.objects;
DROP POLICY IF EXISTS "Team members can delete items" ON storage.objects;

-- Create new storage policies with proper auth checks
CREATE POLICY "Anyone can view items"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'items');

CREATE POLICY "Representatives and staff can upload items"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'items'
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );

CREATE POLICY "Representatives and staff can update items"
  ON storage.objects FOR UPDATE
  TO public
  USING (
    bucket_id = 'items'
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );

CREATE POLICY "Representatives and staff can delete items"
  ON storage.objects FOR DELETE
  TO public
  USING (
    bucket_id = 'items'
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );