/*
  # Fix RLS policies for soft delete

  1. Changes
    - Update RLS policies to properly handle soft delete
    - Add new policy for self-deletion
    - Fix existing policies to work with soft delete

  2. Security
    - Ensure dancers can only soft delete their own account
    - Maintain proper access control for deleted accounts
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read dancers" ON dancers;
DROP POLICY IF EXISTS "Dancers can soft delete their own account" ON dancers;

-- Create new policies for dancers table
CREATE POLICY "Anyone can read non-deleted dancers"
  ON dancers FOR SELECT
  TO public
  USING (NOT is_deleted);

CREATE POLICY "Dancers can update their own account"
  ON dancers FOR UPDATE
  TO public
  USING (
    auth.uid() = id
    AND NOT is_deleted
  );

-- Update team-related policies to exclude deleted dancers
DROP POLICY IF EXISTS "Team members can view items" ON items;
CREATE POLICY "Team members can view items"
  ON items FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = items.team_id
      AND NOT dancers.is_deleted
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
      AND NOT dancers.is_deleted
    )
  );

-- Update schedule-related policies
DROP POLICY IF EXISTS "Team members can view schedules" ON schedules;
CREATE POLICY "Team members can view schedules"
  ON schedules FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = schedules.team_id
      AND NOT dancers.is_deleted
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
      AND NOT dancers.is_deleted
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
      AND NOT dancers.is_deleted
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
      AND NOT dancers.is_deleted
    )
  );

-- Update video-related policies
DROP POLICY IF EXISTS "Team members can view videos" ON videos;
CREATE POLICY "Team members can view videos"
  ON videos FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = videos.team_id
      AND NOT dancers.is_deleted
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
      AND NOT dancers.is_deleted
    )
  );

-- Update blog-related policies
DROP POLICY IF EXISTS "Team members can view blogs" ON blogs;
CREATE POLICY "Team members can view blogs"
  ON blogs FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = blogs.team_id
      AND NOT dancers.is_deleted
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
      AND NOT dancers.is_deleted
    )
  );

-- Update team info policies
DROP POLICY IF EXISTS "Team members can view team infos" ON team_infos;
CREATE POLICY "Team members can view team infos"
  ON team_infos FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = team_infos.team_id
      AND NOT dancers.is_deleted
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
      AND NOT dancers.is_deleted
    )
  );

-- Update dance moves policies
DROP POLICY IF EXISTS "Team members can view dance moves" ON dance_moves;
CREATE POLICY "Team members can view dance moves"
  ON dance_moves FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = dance_moves.team_id
      AND NOT dancers.is_deleted
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
      AND NOT dancers.is_deleted
    )
  );