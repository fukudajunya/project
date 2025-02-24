-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view dance moves" ON dance_moves;
DROP POLICY IF EXISTS "Representatives and staff can manage dance moves" ON dance_moves;

-- Create new policies
CREATE POLICY "Team members can view dance moves"
  ON dance_moves FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = dance_moves.team_id
    )
  );

CREATE POLICY "Representatives and staff can insert dance moves"
  ON dance_moves FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = dance_moves.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
      AND dance_moves.created_by = auth.uid()
    )
  );

CREATE POLICY "Representatives and staff can update dance moves"
  ON dance_moves FOR UPDATE
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

CREATE POLICY "Representatives and staff can delete dance moves"
  ON dance_moves FOR DELETE
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