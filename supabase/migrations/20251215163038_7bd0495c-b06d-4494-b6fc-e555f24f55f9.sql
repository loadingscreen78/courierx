-- Add restrictive DELETE policy to profiles table
-- Profiles should only be deleted via auth.users cascade, not directly by users
CREATE POLICY "Users cannot delete their profiles directly" 
ON public.profiles 
FOR DELETE 
USING (false);