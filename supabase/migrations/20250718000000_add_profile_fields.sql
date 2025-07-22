-- Add additional profile fields for About You section
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Update the existing bio column comment for clarity
COMMENT ON COLUMN public.profiles.bio IS 'Professional summary/bio for the user';
COMMENT ON COLUMN public.profiles.email IS 'User email address (separate from auth.users.email for profile display)';
COMMENT ON COLUMN public.profiles.phone IS 'User phone number';
COMMENT ON COLUMN public.profiles.linkedin_url IS 'LinkedIn profile URL';