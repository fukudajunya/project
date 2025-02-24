/*
  # Remove items feature

  1. Changes
    - Delete items table and all related policies
    - Remove items storage bucket and policies
    - Clean up all related data

  2. Security
    - Remove all RLS policies for items
    - Remove all storage policies for items bucket
*/

-- First delete all objects in the items bucket if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'items'
  ) THEN
    DELETE FROM storage.objects WHERE bucket_id = 'items';
  END IF;
END $$;

-- Drop storage policies if they exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname LIKE '%items%'
  ) THEN
    DROP POLICY IF EXISTS "Anyone can view item images" ON storage.objects;
    DROP POLICY IF EXISTS "Representatives and staff can insert item images" ON storage.objects;
    DROP POLICY IF EXISTS "Representatives and staff can update item images" ON storage.objects;
    DROP POLICY IF EXISTS "Representatives and staff can delete item images" ON storage.objects;
  END IF;
END $$;

-- Delete the bucket if it exists
DELETE FROM storage.buckets WHERE id = 'items';

-- Drop items table and its policies if they exist
DROP TABLE IF EXISTS items CASCADE;