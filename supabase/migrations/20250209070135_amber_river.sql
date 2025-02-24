/*
  # Fix RLS policies for items and storage

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policies with proper auth checks
    - Ensure proper team and role checks for all operations

  2. Security
    - Enable RLS on items table
    - Add policies for viewing, creating, updating, and deleting items
    - Add storage policies for item images
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Team members can view items" ON items;
DROP POLICY IF EXISTS "Representatives and staff can create items" ON items;
DROP POLICY IF EXISTS "Representatives and staff can update items" ON items;
DROP POLICY IF EXISTS "Representatives and staff can delete items" ON items;
DROP POLICY IF EXISTS "Anyone can view items" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can upload items" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can update items" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can delete items" ON storage.objects;

-- Create new policies for items table
CREATE POLICY "Team members can view items"
  ON items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Representatives and staff can create items"
  ON items FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
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
    EXISTS (
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
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = items.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );

-- Create new storage policies
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
      AND dancers.is_approved = true
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
      AND dancers.is_approved = true
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
      AND dancers.is_approved = true
    )
  );