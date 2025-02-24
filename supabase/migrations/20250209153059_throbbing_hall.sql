-- Drop existing item_purchases table if exists
DROP TABLE IF EXISTS item_purchases CASCADE;

-- Create item_purchases table with delivery management fields
CREATE TABLE item_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) NOT NULL,
  dancer_id uuid REFERENCES dancers(id) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  is_delivered boolean DEFAULT false,
  delivered_at timestamptz,
  delivered_by uuid REFERENCES dancers(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE item_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies
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

CREATE POLICY "Representatives and staff can update delivery status"
  ON item_purchases FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers d
      JOIN items i ON i.team_id = d.team_id
      WHERE d.id = auth.uid()
      AND i.id = item_purchases.item_id
      AND d.role IN ('代表', 'スタッフ')
      AND d.is_approved = true
    )
  );