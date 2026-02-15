-- ⚡⚡⚡ CORRECTED FINAL FIX - RUN THIS NOW ⚡⚡⚡
-- Fixed: Using correct status 'confirmed' instead of 'booking_confirmed'

-- ============================================
-- STEP 1: RESET RLS POLICIES
-- ============================================

ALTER TABLE shipments DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own shipments" ON shipments;
DROP POLICY IF EXISTS "Anonymous can view non-draft shipments" ON shipments;
DROP POLICY IF EXISTS "authenticated_users_select_own" ON shipments;
DROP POLICY IF EXISTS "anon_users_select_non_draft" ON shipments;
DROP POLICY IF EXISTS "public_select_non_draft" ON shipments;

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: CREATE PERMISSIVE POLICIES
-- ============================================

-- Authenticated users see their own shipments
CREATE POLICY "authenticated_users_select_own"
ON shipments FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Anonymous users see all non-draft shipments
CREATE POLICY "anon_users_select_non_draft"
ON shipments FOR SELECT TO anon
USING (status != 'draft');

-- Public role can also see non-draft shipments
CREATE POLICY "public_select_non_draft"
ON shipments FOR SELECT TO public
USING (status != 'draft');

-- ============================================
-- STEP 3: FIX YOUR DATA
-- ============================================

-- Fix gift shipments (change type from 'document' to 'gift')
UPDATE shipments
SET shipment_type = 'gift'
WHERE tracking_number LIKE '%GFT%' OR tracking_number LIKE '%GIFT%';

-- Change draft to confirmed (using CORRECT enum value)
UPDATE shipments
SET status = 'confirmed'
WHERE status = 'draft';

-- ============================================
-- STEP 4: VERIFY IT WORKS
-- ============================================

-- Check 1: Show all your shipments
SELECT 
  tracking_number,
  shipment_type,
  status,
  destination_country,
  total_amount
FROM shipments
ORDER BY created_at DESC
LIMIT 10;

-- Check 2: Test as anonymous user (what landing page sees)
SET ROLE anon;
SELECT 
  tracking_number,
  shipment_type,
  status
FROM shipments
WHERE status != 'draft'
ORDER BY created_at DESC
LIMIT 5;
RESET ROLE;

-- Check 3: Count visible shipments
SET ROLE anon;
SELECT COUNT(*) as visible_to_tracker FROM shipments WHERE status != 'draft';
RESET ROLE;

-- ============================================
-- EXPECTED RESULTS:
-- Check 1: Should show all your shipments with correct types
-- Check 2: Should show 5 shipments (what tracker will display)
-- Check 3: Should return a number > 0
--
-- If Check 2 and Check 3 show your shipments, SUCCESS!
-- Refresh http://localhost:8080 and the tracker will work!
-- ============================================
