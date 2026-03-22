-- ============================================================
-- QUICK FIX: Create missing profile for existing auth user
-- Run this in Supabase SQL Editor RIGHT NOW to fix the 406 error
-- for the user id: 41d46a91-5f3d-47f6-bf82-d5f7c12e1038
-- ============================================================

-- Insert the missing profile row directly
-- (This bypasses RLS because you're running it as the DB owner)
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  subscription_status,
  charity_percentage,
  role
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Member'),
  'inactive',
  10,
  'user'
FROM auth.users au
WHERE au.id = '41d46a91-5f3d-47f6-bf82-d5f7c12e1038'
ON CONFLICT (id) DO NOTHING;

-- Verify it worked:
SELECT id, email, full_name, role, subscription_status 
FROM profiles 
WHERE id = '41d46a91-5f3d-47f6-bf82-d5f7c12e1038';

-- ============================================================
-- ALSO: Fix profiles for ALL auth users who are missing one
-- (Catches any other users who had the same trigger issue)
-- ============================================================
INSERT INTO public.profiles (id, email, full_name, subscription_status, charity_percentage, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Member'),
  'inactive',
  10,
  'user'
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Show all profiles to confirm:
SELECT id, email, full_name, role, created_at FROM profiles ORDER BY created_at DESC;
