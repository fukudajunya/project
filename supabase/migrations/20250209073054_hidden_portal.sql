/*
  # Add image support for items

  1. Changes
    - Create items bucket for storing images
    - Add storage policies for image management
*/

-- Create items bucket for storing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('items', 'items', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Anyone can view items"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'items');

CREATE POLICY "Representatives and staff can manage storage"
  ON storage.objects FOR ALL
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