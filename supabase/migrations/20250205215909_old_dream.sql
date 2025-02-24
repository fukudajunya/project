/*
  # Update database policies

  1. Changes
    - Drop existing policies on dancers table
    - Create new policies for dancers table:
      - Allow anyone to read dancers
      - Allow representatives to update their team's dancers
  
  2. Security
    - Maintain RLS on both tables
    - Update policies to fix infinite recursion issue
*/

-- Drop existing policies on dancers table
DROP POLICY IF EXISTS "Dancers can read their own team's data" ON dancers;
DROP POLICY IF EXISTS "Representatives can update their team's dancers" ON dancers;

-- Create new policies
CREATE POLICY "Anyone can read dancers"
  ON dancers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Representatives can update their team's dancers"
  ON dancers FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers d
      WHERE d.team_id = dancers.team_id
      AND d.role = '代表'
      AND d.id = auth.uid()
    )
  );