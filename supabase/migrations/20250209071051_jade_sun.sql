/*
  # Fix RLS policies for items deletion

  1. Changes
    - Drop existing policies
    - Create new policies with proper auth checks
    - Simplify policy conditions

  2. Security
    - Only approved representatives and staff can manage items
    - Anyone can view items
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view items" ON items;
DROP POLICY IF EXISTS "Representatives and staff can create items" ON items;
DROP POLICY IF EXISTS "Representatives and staff can update items" ON items;
DROP POLICY IF EXISTS "Representatives and staff can delete items" ON items;

-- Create new policies for items table
CREATE POLICY "Anyone can view items"
  ON items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Representatives and staff can manage items"
  ON items FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = items.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );