-- Create table for CXBC booking drafts
CREATE TABLE public.cxbc_booking_drafts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.cxbc_partners(id) ON DELETE CASCADE,
  shipment_type text NOT NULL,
  destination_country text,
  weight_grams numeric,
  declared_value numeric,
  profit_margin numeric DEFAULT 20,
  customer_name text,
  customer_phone text,
  customer_email text,
  customer_address text,
  customer_city text,
  customer_state text,
  customer_pincode text,
  notes text,
  payment_method text DEFAULT 'cash',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days')
);

-- Enable RLS
ALTER TABLE public.cxbc_booking_drafts ENABLE ROW LEVEL SECURITY;

-- Partners can view their own drafts
CREATE POLICY "Partners can view their own drafts"
ON public.cxbc_booking_drafts
FOR SELECT
USING (partner_id IN (
  SELECT id FROM public.cxbc_partners WHERE user_id = auth.uid()
));

-- Partners can create their own drafts
CREATE POLICY "Partners can create their own drafts"
ON public.cxbc_booking_drafts
FOR INSERT
WITH CHECK (partner_id IN (
  SELECT id FROM public.cxbc_partners WHERE user_id = auth.uid()
));

-- Partners can update their own drafts
CREATE POLICY "Partners can update their own drafts"
ON public.cxbc_booking_drafts
FOR UPDATE
USING (partner_id IN (
  SELECT id FROM public.cxbc_partners WHERE user_id = auth.uid()
));

-- Partners can delete their own drafts
CREATE POLICY "Partners can delete their own drafts"
ON public.cxbc_booking_drafts
FOR DELETE
USING (partner_id IN (
  SELECT id FROM public.cxbc_partners WHERE user_id = auth.uid()
));

-- Admins can view all drafts
CREATE POLICY "Admins can view all drafts"
ON public.cxbc_booking_drafts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_cxbc_booking_drafts_updated_at
  BEFORE UPDATE ON public.cxbc_booking_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();