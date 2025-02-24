-- Create blogs table
CREATE TABLE blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) NOT NULL,
  title text NOT NULL,
  content text,
  image_url text,
  youtube_url text,
  created_by uuid REFERENCES dancers(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Create blogs bucket for storing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blogs', 'blogs', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for blogs table
CREATE POLICY "Anyone can view blogs"
  ON blogs FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Representatives and staff can manage blogs"
  ON blogs FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = blogs.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );

-- Create storage policies
CREATE POLICY "Anyone can view blog images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'blogs');

CREATE POLICY "Representatives and staff can manage blog images"
  ON storage.objects FOR ALL
  TO public
  USING (
    bucket_id = 'blogs'
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );