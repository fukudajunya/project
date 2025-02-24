-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Team members can view blogs" ON blogs;
DROP POLICY IF EXISTS "Representatives and staff can insert blogs" ON blogs;
DROP POLICY IF EXISTS "Representatives and staff can update blogs" ON blogs;
DROP POLICY IF EXISTS "Representatives and staff can delete blogs" ON blogs;
DROP POLICY IF EXISTS "Team members can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can insert blog images" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can delete blog images" ON storage.objects;

-- Create policies for blogs table
CREATE POLICY "Team members can view blogs"
  ON blogs FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = blogs.team_id
    )
  );

CREATE POLICY "Representatives and staff can insert blogs"
  ON blogs FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = blogs.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
      AND blogs.created_by = auth.uid()
    )
  );

CREATE POLICY "Representatives and staff can update blogs"
  ON blogs FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = blogs.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );

CREATE POLICY "Representatives and staff can delete blogs"
  ON blogs FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = blogs.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );

-- Create storage policies
CREATE POLICY "Team members can view blog images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'blogs');

CREATE POLICY "Representatives and staff can insert blog images"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'blogs'
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );

CREATE POLICY "Representatives and staff can update blog images"
  ON storage.objects FOR UPDATE
  TO public
  USING (
    bucket_id = 'blogs'
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );

CREATE POLICY "Representatives and staff can delete blog images"
  ON storage.objects FOR DELETE
  TO public
  USING (
    bucket_id = 'blogs'
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );