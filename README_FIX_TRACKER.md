# 🚨 FIX TRACKER ROTATION - DO THIS NOW 🚨

## The Problem
Your tracker shows only 1 shipment and doesn't rotate because the RLS (Row Level Security) policy is blocking anonymous users from seeing your shipments.

## The Solution (2 Minutes)

### Step 1: Open Supabase
https://supabase.com/dashboard/project/nndcxvvulrxnfjoorjzz

### Step 2: Go to SQL Editor
Click "SQL Editor" in the left sidebar → Click "New Query"

### Step 3: Copy & Paste This SQL
```sql
-- Enable RLS
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own shipments" ON shipments;
DROP POLICY IF EXISTS "Public can view non-draft shipments" ON shipments;
DROP POLICY IF EXISTS "Anonymous can view non-draft shipments" ON shipments;

-- Create policy for authenticated users
CREATE POLICY "Users can view their own shipments"
ON shipments FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Create policy for anonymous users (landing page)
CREATE POLICY "Anonymous can view non-draft shipments"
ON shipments FOR SELECT TO anon
USING (status != 'draft');
```

### Step 4: Click "Run" (or press Ctrl+Enter)

### Step 5: Verify
Run this to check:
```sql
SELECT COUNT(*) FROM shipments WHERE status != 'draft';
```
You should see a number > 1

### Step 6: Refresh Landing Page
Go to: http://localhost:8080

Open browser console (F12) and look for:
```
✅ Fetched shipments: [...]
📦 Found X shipments
```

## What You'll See

If you have 2+ shipments:
- ✅ Tracker will rotate every 6 seconds
- ✅ Smooth vertical slide animation
- ✅ Progress indicators (dots) at bottom
- ✅ Shows "X Active Shipments"

If you have only 1 shipment:
- ⚠️ No rotation (need 2+ shipments)
- ✅ Shows "1 Active Shipment"
- 💡 Create more shipments to see rotation

## Still Not Working?

### Check 1: How many non-draft shipments do you have?
```sql
SELECT status, COUNT(*) FROM shipments GROUP BY status;
```

If most are "draft", change some to "booking_confirmed":
```sql
UPDATE shipments 
SET status = 'booking_confirmed' 
WHERE status = 'draft' 
LIMIT 3;
```

### Check 2: Browser Console
Open F12 → Console tab → Look for errors

### Check 3: Test the query manually
```sql
SELECT id, tracking_number, shipment_type, status
FROM shipments
WHERE status != 'draft'
ORDER BY created_at DESC
LIMIT 5;
```

This should return your shipments.

## Expected Result

After running the SQL:
1. Refresh http://localhost:8080
2. Tracker shows multiple shipments
3. Rotates every 6 seconds with smooth animation
4. Shows actual shipment values (not static ₹1,299)
5. Progress indicators show current position

## Files to Check
- `FIX_TRACKER_NOW.sql` - The SQL to run
- `CHECK_SHIPMENTS.sql` - Diagnostic queries
- `SHIPMENT_TRACKER_FINAL_SETUP.md` - Full documentation

DO THIS NOW AND THE TRACKER WILL WORK! 🎯
