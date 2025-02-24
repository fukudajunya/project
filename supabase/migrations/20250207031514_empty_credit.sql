/*
  # Add schedule participants table

  1. New Tables
    - `schedule_participants`
      - `id` (uuid, primary key)
      - `schedule_id` (uuid, references schedules)
      - `dancer_id` (uuid, references dancers)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `schedule_participants` table
    - Add policies for:
      - Team members can view participants
      - Dancers can participate in schedules
*/

CREATE TABLE schedule_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES schedules(id) NOT NULL,
  dancer_id uuid REFERENCES dancers(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(schedule_id, dancer_id)
);

ALTER TABLE schedule_participants ENABLE ROW LEVEL SECURITY;

-- Viewing policy: Team members can view participants
CREATE POLICY "Team members can view schedule participants"
  ON schedule_participants FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM schedules s
      JOIN dancers d ON d.team_id = s.team_id
      WHERE s.id = schedule_participants.schedule_id
    )
  );

-- Participation policy: Dancers can participate in their team's schedules
CREATE POLICY "Dancers can participate in schedules"
  ON schedule_participants FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM schedules s
      JOIN dancers d ON d.team_id = s.team_id
      WHERE s.id = schedule_participants.schedule_id
      AND d.id = schedule_participants.dancer_id
    )
  );

-- Delete policy: Dancers can remove their own participation
CREATE POLICY "Dancers can remove their participation"
  ON schedule_participants FOR DELETE
  TO public
  USING (
    dancer_id = auth.uid()
  );