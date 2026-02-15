-- ⚡⚡⚡ FINAL FIX - RUN THIS ONE SQL TO FIX EVERYTHING ⚡⚡⚡
-- This will:
-- 1. Enable the tracker to show all shipments
-- 2. Fix your gift shipments to show as "Gift" not "Document"
-- 3. Make them visible in the tracker (change from draft to confirmed)

-- ============================================
-- STEP 1: ENABLE TRACKER (FIX RLS POLICIES)
-- ============================================

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own shipments" ON shipments;
DROP POLICY IF EXISTS "Public can view non-draft shipments" ON shipments;
DROP POLICY IF EXISTS "Anonymous can view non-draft shipments" ON shipments;

-- Authenticated users see their own shipments
CREATE POLICY "Users can view their own shipments"
ON shipments FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Anonymous users (landing page) see all non-draft shipments
CREATE POLICY "Anonymous can view non-draft shipments"
ON shipments FOR SELECT TO anon
USING (status != 'draft');

-- ============================================
-- STEP 2: FIX YOUR GIFT SHIPMENTS
-- ============================================

-- Fix shipment_type for gift shipments (currently showing as "document")
UPDATE shipments
SET shipment_type = 'gift'
WHERE tracking_number LIKE 'CKX-GFT%' 
   OR tracking_number LIKE 'CRX-GFT%'
   OR tracking_number LIKE '%GFT%';

-- Change status from 'draft' to 'booking_confirmed' so they appear in tracker
UPDATE shipments
SET status = 'booking_confirmed'
WHERE status = 'draft';

-- ============================================
-- STEP 3: VERIFY (CHECK RESULTS)
-- ============================================

-- Show all your shipments
SELECT 
  tracking_number,
  shipment_type,
  status,
  destination_country,
  total_amount,
  created_at
FROM shipments
ORDER BY created_at DESC
LIMIT 10;

-- Test what the tracker will see
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

-- ============================================
-- AFTER RUNNING THIS:
-- 1. Refresh http://localhost:8080
-- 2. Tracker will show ALL your shipments (medicine, gift, document)
-- 3. Will rotate every 6 seconds
-- 4. Gift shipments will show as "Gift Shipment" (not "Document")
-- ============================================
