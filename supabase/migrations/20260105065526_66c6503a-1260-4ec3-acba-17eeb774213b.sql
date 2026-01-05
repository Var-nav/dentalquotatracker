-- Add theme preferences to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_preset text DEFAULT 'vibrant';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_primary_hsl text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_secondary_hsl text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_accent_hsl text;

-- Create index for faster theme lookups
CREATE INDEX IF NOT EXISTS idx_profiles_theme ON profiles(theme_preset);