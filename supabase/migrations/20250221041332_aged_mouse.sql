-- Create inventory table
CREATE TABLE inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) NOT NULL,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(item_id)
);

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view inventory"
  ON inventory FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Representatives and staff can manage inventory"
  ON inventory FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers d
      JOIN items i ON i.team_id = d.team_id
      WHERE d.id = auth.uid()
      AND i.id = inventory.item_id
      AND d.role IN ('代表', 'スタッフ')
      AND d.is_approved = true
    )
  );

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_updated_at();

-- Create trigger to automatically create inventory record when item is created
CREATE OR REPLACE FUNCTION create_inventory_for_item()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO inventory (item_id, quantity)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_inventory_for_item
  AFTER INSERT ON items
  FOR EACH ROW
  EXECUTE FUNCTION create_inventory_for_item();

-- Create trigger to decrease inventory when item is delivered
CREATE OR REPLACE FUNCTION decrease_inventory_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_delivered = true AND OLD.is_delivered = false THEN
    UPDATE inventory
    SET quantity = GREATEST(quantity - NEW.quantity, 0)
    WHERE item_id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrease_inventory_on_delivery
  AFTER UPDATE ON item_purchases
  FOR EACH ROW
  EXECUTE FUNCTION decrease_inventory_on_delivery();

-- Insert initial inventory records for existing items
INSERT INTO inventory (item_id, quantity)
SELECT id, 0 FROM items
ON CONFLICT (item_id) DO NOTHING;