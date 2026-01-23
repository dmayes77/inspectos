-- Add phone to profiles for team member contact info
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
