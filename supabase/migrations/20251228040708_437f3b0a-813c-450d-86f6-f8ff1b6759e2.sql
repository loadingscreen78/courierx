-- Fix data integrity for CXBC partner system
-- This migration adds unique constraints and cleans up orphan data

-- Step 1: Delete orphan cxbc_partners rows (partners with no valid auth user)
DELETE FROM public.cxbc_partners 
WHERE user_id NOT IN (
  SELECT id FROM auth.users
);

-- Step 2: Delete orphan user_roles for cxbc_partner role (roles with no valid auth user)
DELETE FROM public.user_roles 
WHERE role = 'cxbc_partner' 
AND user_id NOT IN (
  SELECT id FROM auth.users
);

-- Step 3: Add unique constraint on profiles.user_id (one profile per user)
-- First check if constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_user_id_unique'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Step 4: Add unique constraint on user_roles (user_id, role) - prevent duplicate roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_role_unique'
  ) THEN
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_user_id_role_unique UNIQUE (user_id, role);
  END IF;
END $$;

-- Step 5: Add unique constraint on cxbc_partners.user_id (one partner per user)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'cxbc_partners_user_id_unique'
  ) THEN
    ALTER TABLE public.cxbc_partners 
    ADD CONSTRAINT cxbc_partners_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Step 6: Add unique constraint on cxbc_partners.email (prevent duplicate emails)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'cxbc_partners_email_unique'
  ) THEN
    ALTER TABLE public.cxbc_partners 
    ADD CONSTRAINT cxbc_partners_email_unique UNIQUE (email);
  END IF;
END $$;