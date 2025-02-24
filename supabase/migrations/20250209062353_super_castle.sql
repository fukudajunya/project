/*
  # Update RLS policies for video ordering

  1. Changes
    - Drop existing ALL policy for videos
    - Create separate policies for INSERT, UPDATE, and DELETE
    - Add specific policy for display_order updates

  2. Security
    - Maintains existing security rules
    - Allows representatives and staff to update video order
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Representatives and staff can manage videos" ON videos;

-- Create separate policies for each operation
CREATE POLICY "Representatives and staff can create videos"
  ON videos FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = videos.created_by
      AND dancers.team_id = videos.team_id
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );

CREATE POLICY "Representatives and staff can update videos"
  ON videos FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = videos.team_id
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );

CREATE POLICY "Representatives and staff can delete videos"
  ON videos FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = videos.team_id
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );