-- Create item_purchases table
CREATE TABLE item_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) NOT NULL,
  dancer_id uuid REFERENCES dancers(id) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE item_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Team members can view purchases"
  ON item_purchases FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM items i
      JOIN dancers d ON d.team_id = i.team_id
      WHERE i.id = item_purchases.item_id
    )
  );

CREATE POLICY "Dancers can create purchases"
  ON item_purchases FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM items i
      JOIN dancers d ON d.team_id = i.team_id
      WHERE i.id = item_purchases.item_id
      AND d.id = item_purchases.dancer_id
      AND d.id = auth.uid()
    )
  );