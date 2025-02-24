-- First delete all objects in the items bucket
DELETE FROM storage.objects
WHERE bucket_id = 'items';

-- Drop storage policies for items bucket
DROP POLICY IF EXISTS "Team members can view item images" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can insert item images" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can update item images" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can delete item images" ON storage.objects;

-- Delete the bucket
DELETE FROM storage.buckets
WHERE id = 'items';

-- Drop items table and its policies
DROP POLICY IF EXISTS "Anyone can view items" ON items;
DROP POLICY IF EXISTS "Representatives and staff can insert items" ON items;
DROP POLICY IF EXISTS "Representatives and staff can update items" ON items;
DROP POLICY IF EXISTS "Representatives and staff can delete items" ON items;

DROP TABLE IF EXISTS items CASCADE;