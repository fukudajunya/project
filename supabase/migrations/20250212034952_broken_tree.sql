-- Create items bucket for storing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('items', 'items', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Anyone can view item images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'items');

CREATE POLICY "Anyone can manage item images"
  ON storage.objects FOR ALL
  TO public
  USING (bucket_id = 'items')
  WITH CHECK (bucket_id = 'items');