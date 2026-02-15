-- ⚡ RUN THIS IN SUPABASE TO CHECK YOUR SHIPMENTS ⚡

-- 1. Check total shipments
SELECT COUNT(*) as total_shipments FROM shipments;

-- 2. Check shipments by status
SELECT status, COUNT(*) as count 
FROM shipments 
GROUP BY status 
ORDER BY count DESC;

-- 3. Check non-draft shipments (what the tracker should show)
SELECT COUNT(*) as non_draft_shipments 
FROM shipments 
WHERE status != 'draft';

-- 4. Show the latest 5 shipments (what tracker fetches)
SELECT 
  id,
  tracking_number,
  shipment_type,
  status,
  destination_country,
  destination_address,
  total_amount,
  created_at
FROM shipments
WHERE status != 'draft'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'shipments';

-- 6. Test if anonymous users can read shipments
SET ROLE anon;
SELECT COUNT(*) as visible_to_anon FROM shipments WHERE status != 'draft';
RESET ROLE;
