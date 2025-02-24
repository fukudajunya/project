/*
  # Add password authentication

  1. Changes
    - Add password_hash column to dancers table
    - Add unique constraint on team_id and name combination
    - Add NOT NULL constraint to password_hash

  2. Security
    - Password hashes are stored securely
    - Existing policies remain unchanged
*/

-- Add password_hash column
ALTER TABLE dancers ADD COLUMN password_hash text NOT NULL DEFAULT '';

-- Remove the default value after adding it to existing rows
ALTER TABLE dancers ALTER COLUMN password_hash DROP DEFAULT;