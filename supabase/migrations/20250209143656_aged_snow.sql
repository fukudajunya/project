-- Create items table
CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) NOT NULL,
  name text NOT NULL,
  price integer NOT NULL,
  description text,
  created_by uuid REFERENCES dancers(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Create policies for items table
CREATE POLICY "Anyone can view items"
  ON items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Representatives and staff can insert items"
  ON items FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = items.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
      AND items.created_by = auth.uid()
    )
  );

CREATE POLICY "Representatives and staff can update items"
  ON items FOR UPDATE
  TO public
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = items.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );

CREATE POLICY "Representatives and staff can delete items"
  ON items FOR DELETE
  TO public
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = items.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );