-- Enable RLS on shipments table if not already enabled
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access for landing page tracker" ON shipments;
DROP POLICY IF EXISTS "Public can view non-draft shipments" ON shipments;

-- Create policy to allow ANYONE (including anonymous users) to read non-draft shipments
-- This is specifically for the landing page tracker
CREATE POLICY "Public can view non-draft shipments"
ON shipments
FOR SELECT
TO public, anon, authenticated
USING (status != 'draft');

-- Note: This policy allows:
-- 1. Anonymous users (landing page visitors) to see shipment tracking
-- 2. Authenticated users to see all non-draft shipments
-- 3. Draft shipments remain private (only visible to owner via other policies)
-- 4. Users can still only modify their own shipments through other policies
