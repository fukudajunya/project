/*
  # Add display order to videos

  1. Changes
    - Add display_order column to videos table
    - Update existing videos to have sequential display_order within their categories
    - Add index on display_order for better performance

  2. Notes
    - Uses a window function to assign initial display_order values
    - Adds index to optimize sorting and querying by display_order
*/

-- Add display_order column
ALTER TABLE videos
ADD COLUMN display_order integer;

-- Update existing videos with sequential display_order within their categories
WITH numbered_videos AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at) - 1 as new_order
  FROM videos
)
UPDATE videos
SET display_order = numbered_videos.new_order
FROM numbered_videos
WHERE videos.id = numbered_videos.id;

-- Create index for better performance
CREATE INDEX videos_display_order_idx ON videos (category_id, display_order);