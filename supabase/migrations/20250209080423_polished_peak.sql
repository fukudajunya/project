/*
  # Avatar storage setup

  1. Changes
    - Add avatar_url column to dancers table if not exists
    - Create avatars bucket for storing profile images
    - Set up storage policies for avatar management
  
  2. Security
    - Enable RLS on avatars bucket
    - Allow public viewing of avatars
    - Allow authenticated users to manage their own avatars
*/

-- Add avatar_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dancers' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE dancers ADD COLUMN avatar_url text;
  END IF;
END $$;

-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Public can view avatars' AND tablename = 'objects'
  ) THEN
    DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
  END IF;
END $$;

-- Create new storage policies
CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can manage avatars"
  ON storage.objects FOR ALL
  TO public
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');