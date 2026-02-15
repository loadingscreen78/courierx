-- ⚡⚡⚡ DEFINITIVE FIX - RUN THIS NOW ⚡⚡⚡
-- This will make the tracker show ALL your shipments

-- Step 1: Enable RLS
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing SELECT policies
DROP POLICY IF EXISTS "Users can view their own shipments" ON shipments;
DROP POLICY IF EXISTS "Public can view non-draft shipments" ON shipments;
DROP POLICY IF EXISTS "Allow public read access for landing page tracker" ON shipments;

-- Step 3: Create TWO policies - one for authenticated users, one for anonymous

-- Policy 1: Authenticated users can see their own shipments
CREATE POLICY "Users can view their own shipments"
ON shipments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Anonymous users (landing page) can see ALL non-draft shipments
CREATE POLICY "Anonymous can view non-draft shipments"
ON shipments
FOR SELECT
TO anon
USING (status != 'draft');

-- Step 4: Verify policies were created
SELECT policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'shipments' 
AND cmd = 'SELECT';

-- Step 5: Test as anonymous user
SET ROLE anon;
SELECT COUNT(*) as visible_shipments FROM shipments WHERE status != 'draft';
RESET ROLE;

-- You should see the count of your non-draft shipments
