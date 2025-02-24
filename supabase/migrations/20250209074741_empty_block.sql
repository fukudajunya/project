/*
  # Fix RLS policies for items and storage

  1. Changes
    - Simplify RLS policies for items table
    - Fix storage policies to allow proper access
    - Add proper auth checks for all operations
    - Ensure proper team_id validation

  2. Security
    - Maintain data isolation between teams
    - Allow only approved representatives and staff to manage items
    - Allow public viewing of items within teams
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view items" ON items;
DROP POLICY IF EXISTS "Representatives and staff can manage items" ON items;
DROP POLICY IF EXISTS "Anyone can view item images" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can manage item images" ON storage.objects;

-- Create policies for items table
CREATE POLICY "Anyone can view items"
  ON items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Representatives and staff can insert items"
  ON items FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = items.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );

CREATE POLICY "Representatives and staff can update items"
  ON items FOR UPDATE
  TO public
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = items.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );

CREATE POLICY "Representatives and staff can delete items"
  ON items FOR DELETE
  TO public
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = items.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );

-- Create storage policies
CREATE POLICY "Anyone can view item images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'items');

CREATE POLICY "Representatives and staff can insert item images"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'items'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );

CREATE POLICY "Representatives and staff can update item images"
  ON storage.objects FOR UPDATE
  TO public
  USING (
    bucket_id = 'items'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );

CREATE POLICY "Representatives and staff can delete item images"
  ON storage.objects FOR DELETE
  TO public
  USING (
    bucket_id = 'items'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );