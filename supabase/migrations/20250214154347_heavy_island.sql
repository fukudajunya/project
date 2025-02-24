-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Dancers can delete their own account" ON dancers;

-- Create new policy for account deletion with cascade
CREATE POLICY "Dancers can delete their own account"
  ON dancers FOR DELETE
  TO public
  USING (
    auth.uid() = id
    AND EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = auth.uid()
      AND dancers.is_approved = true
    )
  );

-- Add ON DELETE CASCADE to foreign key constraints
ALTER TABLE schedule_comments
  DROP CONSTRAINT IF EXISTS schedule_comments_dancer_id_fkey,
  ADD CONSTRAINT schedule_comments_dancer_id_fkey
    FOREIGN KEY (dancer_id)
    REFERENCES dancers(id)
    ON DELETE CASCADE;

ALTER TABLE schedule_participants
  DROP CONSTRAINT IF EXISTS schedule_participants_dancer_id_fkey,
  ADD CONSTRAINT schedule_participants_dancer_id_fkey
    FOREIGN KEY (dancer_id)
    REFERENCES dancers(id)
    ON DELETE CASCADE;

ALTER TABLE dance_move_completions
  DROP CONSTRAINT IF EXISTS dance_move_completions_dancer_id_fkey,
  ADD CONSTRAINT dance_move_completions_dancer_id_fkey
    FOREIGN KEY (dancer_id)
    REFERENCES dancers(id)
    ON DELETE CASCADE;

ALTER TABLE item_purchases
  DROP CONSTRAINT IF EXISTS item_purchases_dancer_id_fkey,
  ADD CONSTRAINT item_purchases_dancer_id_fkey
    FOREIGN KEY (dancer_id)
    REFERENCES dancers(id)
    ON DELETE CASCADE;

ALTER TABLE blogs
  DROP CONSTRAINT IF EXISTS blogs_created_by_fkey,
  ADD CONSTRAINT blogs_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES dancers(id)
    ON DELETE CASCADE;

ALTER TABLE team_infos
  DROP CONSTRAINT IF EXISTS team_infos_created_by_fkey,
  ADD CONSTRAINT team_infos_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES dancers(id)
    ON DELETE CASCADE;

ALTER TABLE dance_moves
  DROP CONSTRAINT IF EXISTS dance_moves_created_by_fkey,
  ADD CONSTRAINT dance_moves_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES dancers(id)
    ON DELETE CASCADE;

ALTER TABLE items
  DROP CONSTRAINT IF EXISTS items_created_by_fkey,
  ADD CONSTRAINT items_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES dancers(id)
    ON DELETE CASCADE;

ALTER TABLE schedules
  DROP CONSTRAINT IF EXISTS schedules_created_by_fkey,
  ADD CONSTRAINT schedules_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES dancers(id)
    ON DELETE CASCADE;

ALTER TABLE video_categories
  DROP CONSTRAINT IF EXISTS video_categories_created_by_fkey,
  ADD CONSTRAINT video_categories_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES dancers(id)
    ON DELETE CASCADE;

ALTER TABLE videos
  DROP CONSTRAINT IF EXISTS videos_created_by_fkey,
  ADD CONSTRAINT videos_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES dancers(id)
    ON DELETE CASCADE;