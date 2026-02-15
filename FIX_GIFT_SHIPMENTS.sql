-- ⚡ FIX YOUR GIFT SHIPMENTS ⚡

-- Step 1: Check current shipments
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

-- Step 2: Find the gift shipments that are showing as "document"
-- (Look for the ones with tracking numbers starting with CRX-GFT or Gift Package)
SELECT 
  id,
  tracking_number,
  shipment_type,
  status
FROM shipments
WHERE tracking_number LIKE 'CRX-GFT%' OR tracking_number LIKE '%GIFT%'
ORDER BY created_at DESC;

-- Step 3: Update the shipment_type to 'gift' for your gift shipments
-- Replace the tracking numbers with YOUR actual tracking numbers from Step 1
UPDATE shipments
SET shipment_type = 'gift'
WHERE tracking_number IN (
  'CKX-GFT-17769265142-LX59XG',  -- Replace with your actual tracking number
  'CRX-GFT-17769265021-P2VWXG'   -- Replace with your actual tracking number
);

-- Step 4: Also change status from 'draft' to 'booking_confirmed' so they show in tracker
UPDATE shipments
SET status = 'booking_confirmed'
WHERE tracking_number IN (
  'CKX-GFT-17769265142-LX59XG',  -- Replace with your actual tracking number
  'CRX-GFT-17769265021-P2VWXG'   -- Replace with your actual tracking number
);

-- Step 5: Verify the changes
SELECT 
  id,
  tracking_number,
  shipment_type,
  status,
  destination_country,
  total_amount
FROM shipments
WHERE shipment_type = 'gift'
ORDER BY created_at DESC;

-- You should now see your gift shipments with correct type and status!
