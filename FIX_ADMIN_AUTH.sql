-- ============================================
-- FIX ADMIN AUTHENTICATION - COMPLETE SOLUTION
-- ============================================
-- Run this entire script in Supabase SQL Editor
-- This will add admin role to user: 2865da7a-ec3f-445e-b802-e04bd37269d3

-- STEP 1: Add admin role to your user account
INSERT INTO public.user_roles (user_id, role) 
VALUES ('2865da7a-ec3f-445e-b802-e04bd37269d3', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- STEP 2: Verify the role was added successfully
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  au.email,
  ur.created_at
FROM public.user_roles ur
LEFT JOIN auth.users au ON au.id = ur.user_id
WHERE ur.user_id = '2865da7a-ec3f-445e-b802-e04bd37269d3';

-- STEP 3: Check if RLS policies are working
SELECT public.has_role('2865da7a-ec3f-445e-b802-e04bd37269d3'::uuid, 'admin'::app_role);

-- STEP 4: Confirm email if not already confirmed (optional)
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE id = '2865da7a-ec3f-445e-b802-e04bd37269d3';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all roles for this user
SELECT 
  ur.role,
  ur.created_at
FROM public.user_roles ur
WHERE ur.user_id = '2865da7a-ec3f-445e-b802-e04bd37269d3';

-- Check user details
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE id = '2865da7a-ec3f-445e-b802-e04bd37269d3';

-- ============================================
-- AFTER RUNNING THIS SCRIPT
-- ============================================
-- 1. Go to: /auth?panel=admin
-- 2. Sign in with your email and password
-- 3. You should now have access to the admin panel
-- 4. If still having issues, clear browser cache (Ctrl+Shift+Delete)
--    and try again
