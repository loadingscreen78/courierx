# Admin Panel Authentication Issue - Diagnosis & Fix

## Problem
Cannot login to admin panel at `/auth?panel=admin`

## Root Cause Analysis

### How Admin Authentication Works

1. **Login Flow** (`src/views/Auth.tsx`):
   - User enters email/password on admin panel login
   - System authenticates with Supabase Auth
   - After successful auth, checks `user_roles` table for admin access
   - Query: `SELECT role FROM user_roles WHERE user_id = ?`
   - Requires role = 'admin' OR 'warehouse_operator'
   - If no admin role found → "Access Denied" + auto sign out

2. **Route Protection** (`src/components/admin/AdminRoute.tsx`):
   - Uses `useAdminAuth` hook to check roles
   - Blocks access if user doesn't have admin/warehouse_operator role
   - Redirects to `/dashboard` if unauthorized

3. **Database Structure**:
   ```sql
   CREATE TABLE public.user_roles (
     id uuid PRIMARY KEY,
     user_id uuid REFERENCES auth.users(id),
     role app_role NOT NULL,  -- 'admin' | 'warehouse_operator' | 'user'
     created_at timestamp,
     UNIQUE (user_id, role)
   );
   ```

## Most Likely Issue

**Your user account doesn't have an admin role in the `user_roles` table.**

The admin panel requires:
- Valid user account in `auth.users` ✓ (you can sign in)
- Entry in `user_roles` table with role='admin' ✗ (probably missing)

## How to Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** → `user_roles` table
3. Click **Insert** → **Insert row**
4. Fill in:
   - `user_id`: Your user ID (get from `auth.users` table)
   - `role`: Select `admin`
5. Click **Save**

### Option 2: Using SQL Editor

1. Open Supabase **SQL Editor**
2. Run the diagnostic queries from `FIX_ADMIN_AUTH.sql`:

```sql
-- Step 1: Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Step 2: Add admin role (replace YOUR-USER-ID)
INSERT INTO public.user_roles (user_id, role) 
VALUES ('YOUR-USER-ID-HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Verify it worked
SELECT * FROM public.user_roles WHERE user_id = 'YOUR-USER-ID-HERE';
```

### Option 3: Quick Fix (First User)

If you're the only user in the system:

```sql
-- Add admin role to the first user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;
```

## Verification Steps

After adding the admin role:

1. **Check database**:
   ```sql
   SELECT ur.*, au.email 
   FROM user_roles ur 
   JOIN auth.users au ON au.id = ur.user_id 
   WHERE au.email = 'your-email@example.com';
   ```

2. **Test login**:
   - Go to `/auth?panel=admin`
   - Enter your email/password
   - Should redirect to `/admin` dashboard

3. **Check browser console**:
   - Open DevTools (F12)
   - Look for logs starting with `[Auth]`
   - Should see: "Admin roles: [{role: 'admin'}]"

## Additional Checks

### Check 1: RLS Policies
The `user_roles` table has RLS enabled. Make sure the policy allows users to see their own roles:

```sql
-- This policy should exist:
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
```

### Check 2: Email Confirmation
Admin login might fail if email isn't confirmed:

```sql
-- Check confirmation status
SELECT email, email_confirmed_at FROM auth.users WHERE email = 'your-email@example.com';

-- Manually confirm if needed (dev only)
UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'your-email@example.com';
```

### Check 3: Auth Session
Clear browser cache and cookies, then try again:
- Press `Ctrl + Shift + Delete`
- Clear cookies and cached files
- Close and reopen browser

## Error Messages & Solutions

### "Access Denied - No admin privileges"
- **Cause**: No admin role in `user_roles` table
- **Fix**: Add admin role using Option 1 or 2 above

### "Invalid login credentials"
- **Cause**: Wrong email/password
- **Fix**: Reset password or create new account

### Infinite loading / No redirect
- **Cause**: RLS policy blocking role check
- **Fix**: Check RLS policies are correctly set up

### "Not an approved partner" (wrong message)
- **Cause**: Code checking wrong panel type
- **Fix**: Make sure you're accessing `/auth?panel=admin` not `/auth?panel=cxbc`

## Prevention

To avoid this issue in the future:

1. **Create admin user during setup**:
   ```sql
   -- Add this to your seed data
   INSERT INTO public.user_roles (user_id, role)
   SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'admin@example.com';
   ```

2. **Add admin creation UI** (future enhancement):
   - Create a super-admin panel
   - Allow existing admins to promote users

3. **Better error messages**:
   - Show specific reason for access denial
   - Guide users to contact admin

## Files Involved

- `courierx2/src/views/Auth.tsx` - Login logic
- `courierx2/src/components/admin/AdminRoute.tsx` - Route protection
- `courierx2/src/hooks/useAdminAuth.ts` - Role checking hook
- `courierx2/supabase/migrations/20251218081802_*.sql` - user_roles table setup
- `courierx2/FIX_ADMIN_AUTH.sql` - Diagnostic queries

## Summary

The admin panel login is working correctly, but your user account needs an admin role in the database. Use the SQL queries in `FIX_ADMIN_AUTH.sql` to add the admin role to your account, then try logging in again.
