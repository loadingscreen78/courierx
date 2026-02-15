-- Add restrictive DELETE policy to wallet_transactions table
-- Financial transactions must be preserved for audit integrity
CREATE POLICY "Financial transactions cannot be deleted" 
ON public.wallet_transactions 
FOR DELETE 
USING (false);