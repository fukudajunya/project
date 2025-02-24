-- Drop existing policies
DROP POLICY IF EXISTS "Team members can view team infos" ON team_infos;
DROP POLICY IF EXISTS "Representatives and staff can insert team infos" ON team_infos;
DROP POLICY IF EXISTS "Representatives and staff can update team infos" ON team_infos;
DROP POLICY IF EXISTS "Representatives and staff can delete team infos" ON team_infos;

-- Create new simplified policies
CREATE POLICY "Anyone can view team infos"
  ON team_infos FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Representatives and staff can manage team infos"
  ON team_infos FOR ALL
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