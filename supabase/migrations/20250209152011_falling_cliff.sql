-- Drop existing policies
DROP POLICY IF EXISTS "Team members can view purchases" ON item_purchases;
DROP POLICY IF EXISTS "Dancers can create purchases" ON item_purchases;

-- Create new policies
CREATE POLICY "Anyone can view purchases"
  ON item_purchases FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Dancers can create purchases"
  ON item_purchases FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = dancer_id
  );