/*
  # Add items feature

  1. New Tables
    - `items`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `name` (text)
      - `price` (integer)
      - `description` (text, nullable)
      - `image_url` (text, nullable)
      - `created_by` (uuid, references dancers)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `items` table
    - Add policies for viewing and managing items
    - Create storage bucket for item images
    - Add storage policies for item images
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

-- Create policies for items table
CREATE POLICY "Team members can view items"
  ON items FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = items.team_id
    )
  );

CREATE POLICY "Representatives and staff can insert items"
  ON items FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = items.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );

CREATE POLICY "Representatives and staff can update items"
  ON items FOR UPDATE
  TO public
  USING (
    EXISTS (
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
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.team_id = items.team_id
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );

-- Create items bucket for storing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('items', 'items', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Team members can view item images"
  ON storage.objects FOR SELECT
  TO public
  USING (
    bucket_id = 'items'
    AND EXISTS (
      SELECT 1 FROM items i
      JOIN dancers d ON d.team_id = i.team_id
      WHERE split_part(objects.name, '/', 1) = i.team_id::text
    )
  );

CREATE POLICY "Representatives and staff can insert item images"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'items'
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
      AND split_part(objects.name, '/', 1) = dancers.team_id::text
    )
  );

CREATE POLICY "Representatives and staff can update item images"
  ON storage.objects FOR UPDATE
  TO public
  USING (
    bucket_id = 'items'
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
      AND split_part(objects.name, '/', 1) = dancers.team_id::text
    )
  );

CREATE POLICY "Representatives and staff can delete item images"
  ON storage.objects FOR DELETE
  TO public
  USING (
    bucket_id = 'items'
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
      AND split_part(objects.name, '/', 1) = dancers.team_id::text
    )
  );