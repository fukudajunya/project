/*
  # Add items management

  1. New Tables
    - `items`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `name` (text)
      - `price` (integer)
      - `description` (text)
      - `image_url` (text)
      - `created_by` (uuid, references dancers)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `items` table
    - Add policies for viewing and managing items
*/

-- Create items table
CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) NOT NULL,
  name text NOT NULL,
  price integer NOT NULL,
  description text,
  image_url text,
  created_by uuid REFERENCES dancers(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Team members can view items"
  ON items FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = items.team_id
    )
  );

CREATE POLICY "Representatives and staff can manage items"
  ON items FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = items.team_id
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );

-- Create items bucket for storing images
INSERT INTO storage.buckets (id, name)
VALUES ('items', 'items')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
UPDATE storage.buckets
SET public = false
WHERE id = 'items';

-- Create storage policies for items bucket
CREATE POLICY "Public can view item images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'items');

CREATE POLICY "Representatives and staff can manage item images"
  ON storage.objects FOR ALL
  TO public
  USING (bucket_id = 'items');