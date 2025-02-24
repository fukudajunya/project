/*
  # Create items management

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
    - Enable RLS on items table
    - Create policies:
      - Anyone can view items
      - Only approved representatives and staff can manage items
    - Create storage bucket and policies for item images
*/

-- Drop existing tables and policies
DROP TABLE IF EXISTS items;
DROP POLICY IF EXISTS "Anyone can view items" ON storage.objects;
DROP POLICY IF EXISTS "Representatives and staff can manage storage" ON storage.objects;

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

-- Create simplified policies for items table
CREATE POLICY "Anyone can view items"
  ON items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Representatives and staff can manage items"
  ON items FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );

-- Create items bucket for storing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('items', 'items', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Anyone can view items"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'items');

CREATE POLICY "Representatives and staff can manage storage"
  ON storage.objects FOR ALL
  TO public
  USING (
    bucket_id = 'items'
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.role IN ('代表', 'スタッフ')
      AND dancers.is_approved = true
    )
  );