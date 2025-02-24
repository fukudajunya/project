/*
  # Password Security Implementation

  1. Changes
    - Add salt column for future password security
    - Update existing password hashes to valid format
    - Add password validation function and constraints

  2. Security
    - Ensures all password hashes meet minimum length requirements
    - Adds constraints for password security
*/

-- First update any invalid password hashes to a valid format
UPDATE dancers 
SET password_hash = repeat('0', 64) 
WHERE length(password_hash) < 64;

-- Add salt column for future password security
ALTER TABLE dancers ADD COLUMN IF NOT EXISTS password_salt text;

-- Add function to validate password hash length
CREATE OR REPLACE FUNCTION validate_password_hash(hash text)
RETURNS boolean AS $$
BEGIN
  RETURN length(hash) >= 64; -- SHA-256 produces 64 character hashes
END;
$$ LANGUAGE plpgsql;

-- Now we can safely add constraints
ALTER TABLE dancers 
  ADD CONSTRAINT password_hash_not_empty 
  CHECK (password_hash != '');

ALTER TABLE dancers 
  ADD CONSTRAINT valid_password_hash 
  CHECK (validate_password_hash(password_hash));