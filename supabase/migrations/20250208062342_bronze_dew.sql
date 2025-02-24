/*
  # Add schedule comments

  1. New Tables
    - `schedule_comments`
      - `id` (uuid, primary key)
      - `schedule_id` (uuid, foreign key to schedules)
      - `dancer_id` (uuid, foreign key to dancers)
      - `content` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `schedule_comments` table
    - Add policies for team members to read and create comments
    - Add policy for comment authors to delete their own comments
*/

CREATE TABLE schedule_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES schedules(id) NOT NULL,
  dancer_id uuid REFERENCES dancers(id) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE schedule_comments ENABLE ROW LEVEL SECURITY;

-- Team members can view comments
CREATE POLICY "Team members can view schedule comments"
  ON schedule_comments FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM schedules s
      JOIN dancers d ON d.team_id = s.team_id
      WHERE s.id = schedule_comments.schedule_id
    )
  );

-- Team members can create comments
CREATE POLICY "Team members can create schedule comments"
  ON schedule_comments FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM schedules s
      JOIN dancers d ON d.team_id = s.team_id
      WHERE s.id = schedule_comments.schedule_id
      AND d.id = schedule_comments.dancer_id
    )
  );

-- Comment authors can delete their own comments
CREATE POLICY "Comment authors can delete their comments"
  ON schedule_comments FOR DELETE
  TO public
  USING (dancer_id = auth.uid());