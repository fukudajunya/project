-- First remove storage related policies
DROP POLICY IF EXISTS "Anyone can view item images" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can manage item images" ON storage.objects;

-- Delete items bucket
DELETE FROM storage.buckets WHERE id = 'items';

-- Drop image column
ALTER TABLE items DROP COLUMN IF EXISTS image;