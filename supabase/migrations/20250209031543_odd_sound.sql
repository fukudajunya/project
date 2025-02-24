/*
  # Fix YouTube URLs

  1. Changes
    - Update existing YouTube URLs to ensure they are properly formatted
    - Add check constraint to ensure future URLs are valid YouTube video IDs

  2. Notes
    - Converts full URLs to video IDs
    - Adds constraint to prevent invalid formats
*/

-- Function to extract YouTube video ID from various URL formats
CREATE OR REPLACE FUNCTION extract_youtube_id(url text) RETURNS text AS $$
BEGIN
  -- youtu.be format
  IF url LIKE 'https://youtu.be/%' THEN
    RETURN substring(url FROM 'youtu\.be/([a-zA-Z0-9_-]+)');
  END IF;
  
  -- youtube.com format
  IF url LIKE '%youtube.com/watch?v=%' THEN
    RETURN substring(url FROM 'v=([a-zA-Z0-9_-]+)');
  END IF;
  
  -- Already a video ID
  IF url ~ '^[a-zA-Z0-9_-]{11}$' THEN
    RETURN url;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update existing URLs to video IDs
UPDATE videos
SET youtube_url = extract_youtube_id(youtube_url)
WHERE youtube_url IS NOT NULL;

-- Add check constraint for video ID format
ALTER TABLE videos
ADD CONSTRAINT valid_youtube_id
CHECK (youtube_url ~ '^[a-zA-Z0-9_-]{11}$');

-- Drop the function as it's no longer needed
DROP FUNCTION extract_youtube_id(text);