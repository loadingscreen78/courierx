-- Add restrictive DELETE policy to support_tickets table
-- Support tickets must be preserved for audit trails and dispute resolution
CREATE POLICY "Support tickets cannot be deleted" 
ON public.support_tickets 
FOR DELETE 
USING (false);