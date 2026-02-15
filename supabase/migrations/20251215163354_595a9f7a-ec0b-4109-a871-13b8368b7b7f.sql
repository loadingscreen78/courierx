-- Add restrictive DELETE policy to shipments table
-- Shipment records must be preserved for business auditing and dispute resolution
CREATE POLICY "Shipment records cannot be deleted" 
ON public.shipments 
FOR DELETE 
USING (false);