# Admin Login Redirect Issue - FIXED

## Problem
Admin login was working initially but then redirecting to customer panel after a few seconds.

## Root Cause
There were TWO redirect handlers running simultaneously:
1. `handleEmailAuth` function - redirects immediately after login
2. `useEffect` hook - runs after component updates and was overriding the admin redirect

The `useEffect` was triggering AFTER the admin login and checking `selectedPanel`, but the state wasn't being preserved correctly, causing it to redirect to customer panel.

## Changes Made

### 1. Auth.tsx - Fixed Redirect Logic
- Added `isLoading` check to `useEffect` to prevent interference during login
- Set `isLoading(false)` BEFORE `window.location.href` redirects
- Added better console logging to track redirect flow
- Made admin redirect use hard navigation (`window.location.href`) to prevent React state issues

### 2. AdminRoute.tsx - Fixed Unauthorized Redirect
- Changed unauthorized redirect from `/dashboard` to `/auth?panel=admin`
- This prevents admin users from being sent to customer dashboard
- Added detailed console logging for debugging
- Preserves the `from` parameter for proper return navigation

## How It Works Now

### Admin Login Flow:
1. User goes to `/auth?panel=admin`
2. Selects "Admin Panel" → `selectedPanel = 'admin'`
3. Enters email/password
4. `handleEmailAuth` runs:
   - Authenticates user
   - Checks `user_roles` table for admin role
   - If admin role exists → `window.location.href = '/admin'` (hard redirect)
   - Sets `isLoading = false` BEFORE redirect
5. `useEffect` hook:
   - Checks `if (isLoading) return;` → skips if login in progress
   - Only runs for already-logged-in users returning to the page

### Admin Route Protection:
1. User lands on `/admin` page
2. `AdminRoute` component checks:
   - Is user authenticated? → If no, redirect to `/auth?panel=admin`
   - Does user have admin role? → If no, redirect to `/auth?panel=admin`
   - If yes to both → Allow access

## Testing Steps

1. **Clear browser cache and cookies**:
   - Press `Ctrl + Shift + Delete`
   - Clear all cookies and cached files
   - Close browser completely

2. **Test admin login**:
   - Open browser
   - Go to `/auth?panel=admin`
   - Enter your email/password
   - Should redirect to `/admin` and STAY there

3. **Check browser console**:
   - Open DevTools (F12)
   - Look for these logs:
     ```
     [Auth] Starting sign in... {email: "...", mode: "signin", selectedPanel: "admin"}
     [Auth] Admin roles: [{role: "admin"}]
     [Auth] ✅ Admin access granted, redirecting to /admin
     [AdminRoute] ✅ Has required role, allowing access
     ```

4. **Test direct access**:
   - While logged in, go directly to `/admin`
   - Should load immediately without redirect

5. **Test unauthorized access**:
   - Sign out
   - Try to access `/admin` directly
   - Should redirect to `/auth?panel=admin`

## SQL Query to Verify Admin Role

Run this in Supabase SQL Editor:

```sql
-- Check if your user has admin role
SELECT 
  ur.role,
  au.email,
  ur.created_at
FROM public.user_roles ur
JOIN auth.users au ON au.id = ur.user_id
WHERE au.id = '2865da7a-ec3f-445e-b802-e04bd37269d3';
```

Should return:
```
role  | email              | created_at
------|-------------------|------------------
admin | your-email@...    | 2024-...
```

## Troubleshooting

### Still redirecting to customer panel?
1. Clear browser cache completely
2. Check console logs - look for `[Auth useEffect]` messages
3. Make sure `selectedPanel` is 'admin' in logs
4. Verify admin role exists in database

### Getting "Access Denied"?
1. Run the SQL query above to verify admin role
2. If no role found, run:
   ```sql
   INSERT INTO public.user_roles (user_id, role) 
   VALUES ('2865da7a-ec3f-445e-b802-e04bd37269d3', 'admin');
   ```

### Infinite redirect loop?
1. Check browser console for errors
2. Make sure RLS policies allow reading own roles
3. Try incognito mode to rule out cache issues

## Files Modified
- `courierx2/src/views/Auth.tsx` - Fixed redirect logic
- `courierx2/src/components/admin/AdminRoute.tsx` - Fixed unauthorized redirect
