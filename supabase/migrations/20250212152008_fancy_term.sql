-- Create team_infos table
CREATE TABLE team_infos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) NOT NULL,
  title text NOT NULL,
  content text,
  created_by uuid REFERENCES dancers(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE team_infos ENABLE ROW LEVEL SECURITY;

-- Create policies for team_infos table
CREATE POLICY "Team members can view team infos"
  ON team_infos FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = team_infos.team_id
    )
  );

CREATE POLICY "Representatives and staff can insert team infos"
  ON team_infos FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = team_infos.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
      AND team_infos.created_by = auth.uid()
    )
  );

CREATE POLICY "Representatives and staff can update team infos"
  ON team_infos FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = team_infos.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );

CREATE POLICY "Representatives and staff can delete team infos"
  ON team_infos FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = team_infos.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );