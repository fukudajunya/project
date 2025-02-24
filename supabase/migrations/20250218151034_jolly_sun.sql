-- Add is_deleted column to dancers table
ALTER TABLE dancers ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;

-- Update existing policies to exclude deleted dancers
DROP POLICY IF EXISTS "Anyone can read dancers" ON dancers;
CREATE POLICY "Anyone can read dancers"
  ON dancers FOR SELECT
  TO public
  USING (NOT is_deleted);

-- Update other policies to prevent deleted dancers from performing actions
DROP POLICY IF EXISTS "Team members can view items" ON items;
CREATE POLICY "Team members can view items"
  ON items FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = items.team_id
      AND NOT dancers.is_deleted
    )
  );

-- Add policy for soft delete
CREATE POLICY "Dancers can soft delete their own account"
  ON dancers FOR UPDATE
  TO public
  USING (
    auth.uid() = id
    AND NOT is_deleted
  )
  WITH CHECK (
    auth.uid() = id
    AND is_deleted = true
  );