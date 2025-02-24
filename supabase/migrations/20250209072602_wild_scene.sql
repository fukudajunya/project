/*
  # Drop items feature

  1. Changes
    - Delete all objects in items bucket
    - Drop storage policies for items bucket
    - Drop items bucket
    - Drop items table
*/

-- First delete all objects in the items bucket
DELETE FROM storage.objects
WHERE bucket_id = 'items';

-- Drop storage policies for items bucket
DROP POLICY IF EXISTS "Anyone can view items" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can manage storage" ON storage.objects;

-- Now we can safely delete the bucket
DELETE FROM storage.buckets
WHERE id = 'items';

-- Drop items table if exists
DROP TABLE IF EXISTS items;