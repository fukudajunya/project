-- First update all policies to remove is_deleted dependency
DROP POLICY IF EXISTS "Team members can view items" ON items;
CREATE POLICY "Team members can view items"
  ON items FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = items.team_id
    )
  );

DROP POLICY IF EXISTS "Representatives and staff can manage items" ON items;
CREATE POLICY "Representatives and staff can manage items"
  ON items FOR ALL
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

DROP POLICY IF EXISTS "Team members can view schedules" ON schedules;
CREATE POLICY "Team members can view schedules"
  ON schedules FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = schedules.team_id
    )
  );

DROP POLICY IF EXISTS "Representatives and staff can create schedules" ON schedules;
CREATE POLICY "Representatives and staff can create schedules"
  ON schedules FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = schedules.created_by
      AND dancers.team_id = schedules.team_id
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );

DROP POLICY IF EXISTS "Representatives and staff can update schedules" ON schedules;
CREATE POLICY "Representatives and staff can update schedules"
  ON schedules FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = schedules.created_by
      AND dancers.team_id = schedules.team_id
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );

DROP POLICY IF EXISTS "Representatives and staff can delete schedules" ON schedules;
CREATE POLICY "Representatives and staff can delete schedules"
  ON schedules FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = schedules.created_by
      AND dancers.team_id = schedules.team_id
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );

DROP POLICY IF EXISTS "Team members can view videos" ON videos;
CREATE POLICY "Team members can view videos"
  ON videos FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = videos.team_id
    )
  );

DROP POLICY IF EXISTS "Representatives and staff can manage videos" ON videos;
CREATE POLICY "Representatives and staff can manage videos"
  ON videos FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = videos.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );

DROP POLICY IF EXISTS "Team members can view blogs" ON blogs;
CREATE POLICY "Team members can view blogs"
  ON blogs FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = blogs.team_id
    )
  );

DROP POLICY IF EXISTS "Representatives and staff can manage blogs" ON blogs;
CREATE POLICY "Representatives and staff can manage blogs"
  ON blogs FOR ALL
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

DROP POLICY IF EXISTS "Team members can view team infos" ON team_infos;
CREATE POLICY "Team members can view team infos"
  ON team_infos FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = team_infos.team_id
    )
  );

DROP POLICY IF EXISTS "Representatives and staff can manage team infos" ON team_infos;
CREATE POLICY "Representatives and staff can manage team infos"
  ON team_infos FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = team_infos.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );

DROP POLICY IF EXISTS "Team members can view dance moves" ON dance_moves;
CREATE POLICY "Team members can view dance moves"
  ON dance_moves FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = dance_moves.team_id
    )
  );

DROP POLICY IF EXISTS "Representatives and staff can manage dance moves" ON dance_moves;
CREATE POLICY "Representatives and staff can manage dance moves"
  ON dance_moves FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = dance_moves.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );

-- Now we can safely drop the policies and column on dancers table
DROP POLICY IF EXISTS "Anyone can read non-deleted dancers" ON dancers;
DROP POLICY IF EXISTS "Dancers can update their own account" ON dancers;
DROP POLICY IF EXISTS "Dancers can delete their own account" ON dancers;

-- Drop is_deleted column
ALTER TABLE dancers DROP COLUMN is_deleted;

-- Create new policy for physical deletion
CREATE POLICY "Dancers can delete their own account"
  ON dancers FOR DELETE
  TO public
  USING (auth.uid() = id);

-- Create new policy for reading dancers
CREATE POLICY "Anyone can read dancers"
  ON dancers FOR SELECT
  TO public
  USING (true);