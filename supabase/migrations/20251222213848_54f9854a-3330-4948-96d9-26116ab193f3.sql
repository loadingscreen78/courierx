-- Add cxbc_partner to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cxbc_partner';

-- Create zone enum for India zones
CREATE TYPE public.india_zone AS ENUM ('north', 'south', 'east', 'west', 'central', 'northeast');

-- Create partner status enum
CREATE TYPE public.partner_status AS ENUM ('pending', 'under_review', 'approved', 'suspended', 'rejected');

-- Create CXBC Partners table
CREATE TABLE public.cxbc_partners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    gst_number TEXT,
    pan_number TEXT NOT NULL,
    zone public.india_zone NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    status public.partner_status NOT NULL DEFAULT 'pending',
    profit_margin_percent NUMERIC NOT NULL DEFAULT 0 CHECK (profit_margin_percent >= 0 AND profit_margin_percent <= 200),
    wallet_balance NUMERIC NOT NULL DEFAULT 0,
    kyc_aadhaar_url TEXT,
    kyc_pan_url TEXT,
    shop_photo_url TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create CXBC Partner Applications table (for tracking application history)
CREATE TABLE public.cxbc_partner_applications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    gst_number TEXT,
    pan_number TEXT NOT NULL,
    zone public.india_zone NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    kyc_aadhaar_url TEXT,
    kyc_pan_url TEXT,
    shop_photo_url TEXT,
    status public.partner_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create CXBC Customer Bills table
CREATE TABLE public.cxbc_customer_bills (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES public.cxbc_partners(id),
    bill_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    shipment_id UUID REFERENCES public.shipments(id),
    base_cost NUMERIC NOT NULL,
    partner_margin NUMERIC NOT NULL DEFAULT 0,
    gst_amount NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequence for bill numbers
CREATE SEQUENCE IF NOT EXISTS cxbc_bill_number_seq START 1;

-- Create function to generate bill numbers
CREATE OR REPLACE FUNCTION public.generate_cxbc_bill_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    partner_zone TEXT;
BEGIN
    SELECT UPPER(LEFT(zone::TEXT, 1)) INTO partner_zone 
    FROM public.cxbc_partners 
    WHERE id = NEW.partner_id;
    
    NEW.bill_number := 'CXB-' || COALESCE(partner_zone, 'X') || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('cxbc_bill_number_seq')::TEXT, 5, '0');
    RETURN NEW;
END;
$$;

-- Create trigger for auto-generating bill numbers
CREATE TRIGGER generate_cxbc_bill_number_trigger
BEFORE INSERT ON public.cxbc_customer_bills
FOR EACH ROW
EXECUTE FUNCTION public.generate_cxbc_bill_number();

-- Create updated_at triggers
CREATE TRIGGER update_cxbc_partners_updated_at
BEFORE UPDATE ON public.cxbc_partners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cxbc_partner_applications_updated_at
BEFORE UPDATE ON public.cxbc_partner_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add source and partner columns to shipments
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'customer',
ADD COLUMN IF NOT EXISTS cxbc_partner_id UUID REFERENCES public.cxbc_partners(id);

-- Enable RLS on new tables
ALTER TABLE public.cxbc_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cxbc_partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cxbc_customer_bills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cxbc_partners
CREATE POLICY "Partners can view their own profile" 
ON public.cxbc_partners 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Partners can update their own profile" 
ON public.cxbc_partners 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all partners" 
ON public.cxbc_partners 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all partners" 
ON public.cxbc_partners 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for cxbc_partner_applications
CREATE POLICY "Anyone can create applications" 
ON public.cxbc_partner_applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Applicants can view their own applications" 
ON public.cxbc_partner_applications 
FOR SELECT 
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Admins can view all applications" 
ON public.cxbc_partner_applications 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update applications" 
ON public.cxbc_partner_applications 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for cxbc_customer_bills
CREATE POLICY "Partners can view their own bills" 
ON public.cxbc_customer_bills 
FOR SELECT 
USING (partner_id IN (SELECT id FROM public.cxbc_partners WHERE user_id = auth.uid()));

CREATE POLICY "Partners can create their own bills" 
ON public.cxbc_customer_bills 
FOR INSERT 
WITH CHECK (partner_id IN (SELECT id FROM public.cxbc_partners WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all bills" 
ON public.cxbc_customer_bills 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to check if user is an approved CXBC partner
CREATE OR REPLACE FUNCTION public.is_approved_cxbc_partner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cxbc_partners 
    WHERE user_id = _user_id AND status = 'approved'
  )
$$;