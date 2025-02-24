-- Create dance_moves table
CREATE TABLE dance_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) NOT NULL,
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES dancers(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE dance_moves ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view dance moves"
  ON dance_moves FOR SELECT
  TO public
  USING (true);

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
    )
  );