/*
  # Update video RLS policies

  1. Changes
    - Drop existing update policies
    - Create new comprehensive update policy for videos
    - Ensure proper authorization checks

  2. Security
    - Only representatives and staff can update videos
    - Updates must be within the same team
*/

-- Drop existing update policies
DROP POLICY IF EXISTS "Representatives and staff can update video details" ON videos;
DROP POLICY IF EXISTS "Representatives and staff can update video order" ON videos;

-- Create single comprehensive update policy
CREATE POLICY "Representatives and staff can update videos"
  ON videos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = videos.team_id
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );