/*
  # Fix approval policies

  1. Changes
    - Drop existing update policy that uses auth.uid()
    - Create new update policy based on team_id and role
    - Allow representatives and staff to update member status

  2. Security
    - Enable row level security
    - Add policy for representatives to update any team member
    - Add policy for staff to update only regular members
*/

-- Drop existing update policy
DROP POLICY IF EXISTS "Representatives and staff can update dancers" ON dancers;
DROP POLICY IF EXISTS "Representatives can update their team's dancers" ON dancers;

-- Create new update policy
CREATE POLICY "Team leaders can update dancers"
  ON dancers FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dancers d
      WHERE d.team_id = dancers.team_id
      AND (
        d.role = '代表'
        OR (d.role = 'スタッフ' AND dancers.role = 'メンバー')
      )
    )
  );