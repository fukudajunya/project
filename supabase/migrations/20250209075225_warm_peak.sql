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

-- Drop storage policies
DROP POLICY IF EXISTS "Anyone can view item images" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can insert item images" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can update item images" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can delete item images" ON storage.objects;

-- Delete all objects in the items bucket
DELETE FROM storage.objects
WHERE bucket_id = 'items';

-- Delete the bucket
DELETE FROM storage.buckets
WHERE id = 'items';

-- Drop items table if exists
DROP TABLE IF EXISTS items CASCADE;