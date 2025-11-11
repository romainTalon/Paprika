-- =============================================================================
-- Add Auto-User Profile Creation Trigger
-- Execute this in Supabase SQL Editor if you already ran the initial schema
-- =============================================================================

-- Function to auto-create user profile when auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- Test the trigger
-- =============================================================================

-- Create a test user to verify the trigger works
-- (Replace with real values or skip if you want to test via signup UI)
/*
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@paprika.app',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Test User"}'::jsonb,
  NOW(),
  NOW()
);
*/

-- Verify the user was auto-created in public.users
-- SELECT * FROM users WHERE email = 'test@paprika.app';

-- =============================================================================
-- For existing users: Backfill
-- =============================================================================

-- If you have existing auth.users that don't have entries in public.users, run this:
/*
INSERT INTO public.users (id, email, full_name, avatar_url)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name',
  au.raw_user_meta_data->>'avatar_url'
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
*/

-- =============================================================================
-- SUCCESS! 🎉
-- =============================================================================
-- From now on, every new signup will automatically create a user profile.
-- You can now safely use user_id in cookbooks, recipes, etc.
