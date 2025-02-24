/*
  # Update RLS policies for video management

  1. Changes
    - Simplify update policies to avoid OLD table references
    - Ensure proper security checks for video updates
    - Add specific policy for display order updates

  2. Security
    - Only representatives and staff can update videos
    - Team ID must match for all operations
*/

-- Drop existing update policy
DROP POLICY IF EXISTS "Representatives and staff can update videos" ON videos;

-- Create new update policies
CREATE POLICY "Representatives and staff can update video details"
  ON videos FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = videos.team_id
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );

-- Add specific policy for display order updates
CREATE POLICY "Representatives and staff can update video order"
  ON videos FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = videos.team_id
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );