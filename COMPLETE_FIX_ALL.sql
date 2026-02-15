-- ⚡⚡⚡ COMPLETE FIX - RUN THIS TO FIX EVERYTHING ⚡⚡⚡

-- ============================================
-- PART 1: FIX RLS POLICIES (Enable Tracker)
-- ============================================

-- Enable RLS
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Users can view their own shipments" ON shipments;
DROP POLICY IF EXISTS "Public can view non-draft shipments" ON shipments;
DROP POLICY IF EXISTS "Anonymous can view non-draft shipments" ON shipments;
DROP POLICY IF EXISTS "Allow public read access for landing page tracker" ON shipments;

-- Create policy for authenticated users (dashboard)
CREATE POLICY "Users can view their own shipments"
ON shipments FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Create policy for anonymous users (landing page tracker)
CREATE POLICY "Anonymous can view non-draft shipments"
ON shipments FOR SELECT TO anon
USING (status != 'draft');

-- ============================================
-- PART 2: FIX YOUR GIFT SHIPMENTS
-- ============================================

-- First, let's see what we have
SELECT 
  id,
  tracking_number,
  shipment_type,
  status,
  destination_country,
  total_amount,
  created_at
FROM shipments
ORDER BY created_at DESC
LIMIT 10;

-- Update ALL shipments with 'Gift Package' or gift tracking numbers
-- to have correct shipment_type = 'gift'
UPDATE shipments
SET shipment_type = 'gift'
WHERE 
  tracking_number LIKE '%GFT%' 
  OR tracking_number LIKE '%GIFT%'
  OR tracking_number LIKE 'CKX-GFT%'
  OR tracking_number LIKE 'CRX-GFT%';

-- Change status from 'draft' to 'booking_confirmed' for ALL gift shipments
-- so they show in the tracker
UPDATE shipments
SET status = 'booking_confirmed'
WHERE shipment_type = 'gift' AND status = 'draft';

-- ============================================
-- PART 3: VERIFY EVERYTHING
-- ============================================

-- Check RLS policies
SELECT policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'shipments' AND cmd = 'SELECT';

-- Check gift shipments
SELECT 
  tracking_number,
  shipment_type,
  status,
  destination_country,
  total_amount
FROM shipments
WHERE shipment_type = 'gift'
ORDER BY created_at DESC;

-- Check what anonymous users can see (what tracker will show)
SET ROLE anon;
SELECT 
  tracking_number,
  shipment_type,
  status,
  destination_country
FROM shipments
WHERE status != 'draft'
ORDER BY created_at DESC
LIMIT 5;
RESET ROLE;

-- ============================================
-- EXPECTED RESULT
-- ============================================
-- After running this SQL:
-- 1. Your gift shipments will show as "Gift Shipment" (not "Document Shipment")
-- 2. Status will be "booking_confirmed" (not "draft")
-- 3. Tracker will show ALL your shipments
-- 4. Tracker will rotate every 6 seconds if you have 2+ shipments
-- 5. Refresh http://localhost:8080 to see the changes
-- ============================================
