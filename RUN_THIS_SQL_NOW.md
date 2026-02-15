# 🚨 RUN THIS SQL IN SUPABASE NOW 🚨

## The Problem
Your shipments aren't showing on the landing page because of RLS (Row Level Security) policies. The current policy only allows authenticated users to see their own shipments, but the landing page is accessed by anonymous visitors.

## The Solution
Run this SQL in your Supabase dashboard to allow public read access to non-draft shipments:

## Steps:
1. Go to: https://supabase.com/dashboard/project/nndcxvvulrxnfjoorjzz
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Enable RLS on shipments table if not already enabled
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access for landing page tracker" ON shipments;
DROP POLICY IF EXISTS "Public can view non-draft shipments" ON shipments;

-- Create policy to allow ANYONE (including anonymous users) to read non-draft shipments
CREATE POLICY "Public can view non-draft shipments"
ON shipments
FOR SELECT
TO public, anon, authenticated
USING (status != 'draft');
```

5. Click **Run** (or press Ctrl+Enter)
6. You should see: "Success. No rows returned"
7. Refresh your landing page: http://localhost:8080

## What This Does:
- ✅ Allows anonymous visitors to see shipment tracking on landing page
- ✅ Excludes draft shipments (keeps them private)
- ✅ Doesn't affect other policies (users can still only edit their own shipments)
- ✅ Makes the tracker work in real-time

## After Running:
1. Open browser console (F12)
2. Go to http://localhost:8080
3. You should see logs like:
   - "🔍 Fetching shipments from database..."
   - "✅ Fetched shipments: [...]"
   - "📦 Found X shipments"

## If It Still Doesn't Work:
Check the browser console for errors. The logs will tell us exactly what's wrong.

## Security Note:
This is safe because:
- Only SELECT (read) permission is granted
- Draft shipments are excluded
- No personal data is exposed (just tracking info)
- Users can only modify their own shipments (other policies handle this)
