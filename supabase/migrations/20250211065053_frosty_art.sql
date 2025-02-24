/*
  # Add secret phrase for password recovery

  1. Changes
    - Add secret_phrase column to dancers table
    - Set default value for existing rows
    - Add constraint to ensure secret_phrase is not empty
*/

-- Add secret_phrase column without constraint first
ALTER TABLE dancers ADD COLUMN secret_phrase text;

-- Update existing rows with a default value
UPDATE dancers SET secret_phrase = '未設定' WHERE secret_phrase IS NULL;

-- Now make the column NOT NULL
ALTER TABLE dancers ALTER COLUMN secret_phrase SET NOT NULL;

-- Finally add the constraint
ALTER TABLE dancers ADD CONSTRAINT secret_phrase_not_empty CHECK (secret_phrase != '');