/*
  # Add dancer profile fields

  1. Changes
    - Add `avatar_url` column to dancers table for profile images
    - Add `bio` column to dancers table for self-introduction
*/

ALTER TABLE dancers
ADD COLUMN avatar_url text,
ADD COLUMN bio text;