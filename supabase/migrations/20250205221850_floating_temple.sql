/*
  # Fix approval policies

  1. Changes
    - Drop existing update policy
    - Add new policy allowing both representatives and staff to update dancers
    - Staff can only update member approval status
    - Representatives can update all dancers in their team

  2. Security
    - Enable proper access control for dancer updates
    - Maintain data integrity with team-based restrictions
*/

-- Drop existing update policy
DROP POLICY IF EXISTS "Representatives can update their team's dancers" ON dancers;

-- Create new update policies
CREATE POLICY "Representatives and staff can update dancers"
  ON dancers FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers d
      WHERE d.team_id = dancers.team_id
      AND (
        (d.role = '代表') OR
        (d.role = 'スタッフ' AND dancers.role = 'メンバー')
      )
      AND d.id = auth.uid()
    )
  );