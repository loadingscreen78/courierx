-- Add restrictive DELETE policy to invoices table
-- Financial invoice records must be preserved for audit integrity
CREATE POLICY "Invoice records cannot be deleted" 
ON public.invoices 
FOR DELETE 
USING (false);