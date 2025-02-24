/*
  # Fix inventory RLS policies

  1. Changes
    - Drop existing policies
    - Create new simplified policies with proper auth checks
    - Ensure proper team context for inventory management
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view inventory" ON inventory;
DROP POLICY IF EXISTS "Representatives and staff can manage inventory" ON inventory;

-- Create new policies
CREATE POLICY "Team members can view inventory"
  ON inventory FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM items i
      JOIN dancers d ON d.team_id = i.team_id
      WHERE i.id = inventory.item_id
      AND d.id = auth.uid()
    )
  );

CREATE POLICY "Representatives and staff can insert inventory"
  ON inventory FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM items i
      JOIN dancers d ON d.team_id = i.team_id
      WHERE i.id = inventory.item_id
      AND d.id = auth.uid()
      AND d.role IN ('代表', 'スタッフ')
      AND d.is_approved = true
    )
  );

CREATE POLICY "Representatives and staff can update inventory"
  ON inventory FOR UPDATE
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

CREATE POLICY "Representatives and staff can delete inventory"
  ON inventory FOR DELETE
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