-- Add restrictive UPDATE policy to invoices table
-- This explicitly prevents users from modifying any invoice data (financial records should be immutable)
CREATE POLICY "Users cannot update invoices" 
ON public.invoices 
FOR UPDATE 
USING (false)
WITH CHECK (false);