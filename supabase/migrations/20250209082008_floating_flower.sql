/*
  # Update schedule comment delete policy
  
  1. Changes
    - Update the delete policy for schedule comments to allow users to delete their own comments
    - Add team_id check to ensure comments can only be deleted within the same team
  
  2. Security
    - Users can only delete their own comments
    - Comments can only be deleted by users in the same team
*/

-- Drop existing delete policy
DROP POLICY IF EXISTS "Comment authors can delete their comments" ON schedule_comments;

-- Create new delete policy with proper auth check
CREATE POLICY "Comment authors can delete their comments"
  ON schedule_comments FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM schedules s
      JOIN dancers d ON d.team_id = s.team_id
      WHERE s.id = schedule_comments.schedule_id
      AND d.id = auth.uid()
      AND d.id = schedule_comments.dancer_id
    )
  );