-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Dancers can delete their own account" ON dancers;

-- Create new policy for account deletion
CREATE POLICY "Dancers can delete their own account"
  ON dancers FOR DELETE
  TO public
  USING (
    auth.uid() = id
  );