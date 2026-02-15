-- Add restrictive UPDATE policy to wallet_transactions table
-- Financial transactions must be immutable for audit integrity
CREATE POLICY "Financial transactions cannot be modified" 
ON public.wallet_transactions 
FOR UPDATE 
USING (false)
WITH CHECK (false);