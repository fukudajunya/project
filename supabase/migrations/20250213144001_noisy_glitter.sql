-- Create dance_move_completions table
CREATE TABLE dance_move_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dance_move_id uuid REFERENCES dance_moves(id) NOT NULL,
  dancer_id uuid REFERENCES dancers(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(dance_move_id, dancer_id)
);

-- Enable RLS
ALTER TABLE dance_move_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Team members can view completions"
  ON dance_move_completions FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dance_moves d
      JOIN dancers da ON da.team_id = d.team_id
      WHERE d.id = dance_move_completions.dance_move_id
    )
  );

CREATE POLICY "Dancers can mark completion"
  ON dance_move_completions FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dance_moves d
      JOIN dancers da ON da.team_id = d.team_id
      WHERE d.id = dance_move_completions.dance_move_id
      AND da.id = dance_move_completions.dancer_id
      AND da.id = auth.uid()
    )
  );