/*
  # Initial Schema Setup for FestaApp

  1. New Tables
    - teams
      - id (uuid, primary key)
      - name (text, unique)
      - created_at (timestamp)
    
    - dancers
      - id (uuid, primary key)
      - name (text)
      - team_id (uuid, foreign key)
      - role (text)
      - is_approved (boolean)
      - created_at (timestamp)
      - approved_by (uuid, foreign key)

  2. Security
    - Enable RLS on all tables
    - Add policies for data access based on roles
*/

-- Create teams table
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create dancers table
CREATE TABLE dancers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  team_id uuid REFERENCES teams(id) NOT NULL,
  role text NOT NULL CHECK (role IN ('代表', 'スタッフ', 'メンバー')),
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  approved_by uuid REFERENCES dancers(id),
  UNIQUE(name, team_id)
);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE dancers ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Anyone can create teams"
  ON teams FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read teams"
  ON teams FOR SELECT
  TO public
  USING (true);

-- Dancers policies
CREATE POLICY "Anyone can create dancers"
  ON dancers FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Dancers can read their own team's data"
  ON dancers FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers d
      WHERE d.team_id = dancers.team_id
    )
  );

CREATE POLICY "Representatives can update their team's dancers"
  ON dancers FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers d
      WHERE d.team_id = dancers.team_id
      AND d.role = '代表'
    )
  );