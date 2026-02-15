-- Create addresses table for saved addresses
CREATE TABLE public.addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'delivery' CHECK (type IN ('pickup', 'delivery')),
  label TEXT NOT NULL DEFAULT 'home' CHECK (label IN ('home', 'office', 'other')),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT,
  zipcode TEXT,
  country TEXT NOT NULL DEFAULT 'India',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for addresses
CREATE POLICY "Users can view their own addresses" 
ON public.addresses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own addresses" 
ON public.addresses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" 
ON public.addresses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" 
ON public.addresses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_addresses_updated_at
BEFORE UPDATE ON public.addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create wallet_transactions table for persistent wallet history
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'refund')),
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wallet_transactions
CREATE POLICY "Users can view their own transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.wallet_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add wallet_balance column to profiles
ALTER TABLE public.profiles ADD COLUMN wallet_balance NUMERIC NOT NULL DEFAULT 0;