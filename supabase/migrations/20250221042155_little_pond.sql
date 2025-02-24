-- Drop existing policies
DROP POLICY IF EXISTS "Team members can view inventory" ON inventory;
DROP POLICY IF EXISTS "Representatives and staff can insert inventory" ON inventory;
DROP POLICY IF EXISTS "Representatives and staff can update inventory" ON inventory;
DROP POLICY IF EXISTS "Representatives and staff can delete inventory" ON inventory;

-- Create simplified policies
CREATE POLICY "Anyone can view inventory"
  ON inventory FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Representatives and staff can manage inventory"
  ON inventory FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM items i
      JOIN dancers d ON d.team_id = i.team_id
      WHERE i.id = inventory.item_id
      AND d.id = auth.uid()
      AND d.role IN ('代表', 'スタッフ')
      AND d.is_approved = true
    )
  );