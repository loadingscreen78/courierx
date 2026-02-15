-- ⚡ RUN THIS SQL IN SUPABASE TO ENABLE SHIPMENT TRACKER ⚡
-- This allows the landing page to show the latest 5 shipments

-- Enable RLS
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Public can view non-draft shipments" ON shipments;
DROP POLICY IF EXISTS "Allow public read access for landing page tracker" ON shipments;

-- Create new policy for public read access
CREATE POLICY "Public can view non-draft shipments"
ON shipments
FOR SELECT
TO public, anon, authenticated
USING (status != 'draft');

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'shipments' AND policyname = 'Public can view non-draft shipments';
