-- Drop existing policies
DROP POLICY IF EXISTS "Team members can view completions" ON dance_move_completions;
DROP POLICY IF EXISTS "Dancers can mark completion" ON dance_move_completions;

-- Create new policies
CREATE POLICY "Anyone can view completions"
  ON dance_move_completions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Dancers can mark completion"
  ON dance_move_completions FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = dancer_id
    AND EXISTS (
      SELECT 1 FROM dance_moves d
      JOIN dancers da ON da.team_id = d.team_id
      WHERE d.id = dance_move_completions.dance_move_id
      AND da.id = dance_move_completions.dancer_id
    )
  );