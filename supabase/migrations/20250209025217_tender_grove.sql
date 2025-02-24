/*
  # Add video management tables

  1. New Tables
    - `video_categories`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `name` (text)
      - `created_by` (uuid, references dancers)
      - `created_at` (timestamp)
    - `videos`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `category_id` (uuid, references video_categories)
      - `title` (text)
      - `description` (text, nullable)
      - `youtube_url` (text)
      - `created_by` (uuid, references dancers)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for:
      - Team members can view categories and videos
      - Representatives and staff can manage categories and videos
*/

-- Create video_categories table
CREATE TABLE video_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) NOT NULL,
  name text NOT NULL,
  created_by uuid REFERENCES dancers(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, name)
);

-- Create videos table
CREATE TABLE videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) NOT NULL,
  category_id uuid REFERENCES video_categories(id) NOT NULL,
  title text NOT NULL,
  description text,
  youtube_url text NOT NULL,
  created_by uuid REFERENCES dancers(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Video categories policies
CREATE POLICY "Team members can view video categories"
  ON video_categories FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = video_categories.team_id
    )
  );

CREATE POLICY "Representatives and staff can manage video categories"
  ON video_categories FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = video_categories.created_by
      AND dancers.team_id = video_categories.team_id
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );

-- Videos policies
CREATE POLICY "Team members can view videos"
  ON videos FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = videos.team_id
    )
  );

CREATE POLICY "Representatives and staff can manage videos"
  ON videos FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = videos.created_by
      AND dancers.team_id = videos.team_id
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );