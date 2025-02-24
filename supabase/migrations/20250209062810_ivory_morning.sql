/*
  # Remove video ordering functionality

  1. Changes
    - Remove display_order column from videos table
    - Remove related index
*/

-- Drop the index first
DROP INDEX IF EXISTS videos_display_order_idx;

-- Remove the display_order column
ALTER TABLE videos DROP COLUMN IF EXISTS display_order;