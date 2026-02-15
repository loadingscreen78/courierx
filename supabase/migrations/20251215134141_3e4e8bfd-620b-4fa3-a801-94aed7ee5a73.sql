-- Add profile preference columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS notifications_email boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notifications_whatsapp boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notifications_promotional boolean DEFAULT false;