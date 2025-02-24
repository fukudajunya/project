/*
  # Fix item images storage policies

  1. Changes
    - Drop existing storage policies for items bucket
    - Create new policies that allow public access to item images
    - Allow representatives and staff to manage item images

  2. Security
    - Anyone can view item images
    - Only representatives and staff can upload/update/delete images
*/

-- Drop existing storage policies for items bucket
DROP POLICY IF EXISTS "Public can view item images" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can manage item images" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Anyone can view items bucket"
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

-- Update bucket to allow public access
UPDATE storage.buckets
SET public = true
WHERE id = 'items';