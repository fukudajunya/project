/*
  # Fix participation cancellation policy

  1. Changes
    - Update delete policy for schedule_participants to allow dancers to cancel their participation without auth
*/

DROP POLICY IF EXISTS "Dancers can remove their participation" ON schedule_participants;

CREATE POLICY "Dancers can remove their participation"
  ON schedule_participants FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM schedules s
      JOIN dancers d ON d.team_id = s.team_id
      WHERE s.id = schedule_participants.schedule_id
      AND d.id = schedule_participants.dancer_id
    )
  );