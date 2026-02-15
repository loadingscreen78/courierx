-- Add default sender settings to cxbc_partners
ALTER TABLE public.cxbc_partners
ADD COLUMN default_sender_name TEXT,
ADD COLUMN default_sender_phone TEXT,
ADD COLUMN default_sender_email TEXT;

-- Create employee permissions enum
CREATE TYPE public.employee_role AS ENUM ('manager', 'operator');

-- Create cxbc_partner_employees table
CREATE TABLE public.cxbc_partner_employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.cxbc_partners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role employee_role NOT NULL DEFAULT 'operator',
  permissions JSONB NOT NULL DEFAULT '{
    "can_create_bookings": true,
    "can_view_bills": true,
    "can_download_bills": true,
    "can_view_shipments": true,
    "can_use_rate_calculator": true,
    "can_view_wallet": false,
    "can_manage_settings": false
  }'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_employee_email_per_partner UNIQUE (partner_id, email)
);

-- Enable RLS
ALTER TABLE public.cxbc_partner_employees ENABLE ROW LEVEL SECURITY;

-- RLS policies for cxbc_partner_employees
CREATE POLICY "Partners can view their own employees"
ON public.cxbc_partner_employees FOR SELECT
USING (partner_id IN (SELECT id FROM public.cxbc_partners WHERE user_id = auth.uid()));

CREATE POLICY "Partners can create employees"
ON public.cxbc_partner_employees FOR INSERT
WITH CHECK (partner_id IN (SELECT id FROM public.cxbc_partners WHERE user_id = auth.uid()));

CREATE POLICY "Partners can update their own employees"
ON public.cxbc_partner_employees FOR UPDATE
USING (partner_id IN (SELECT id FROM public.cxbc_partners WHERE user_id = auth.uid()));

CREATE POLICY "Partners can delete their own employees"
ON public.cxbc_partner_employees FOR DELETE
USING (partner_id IN (SELECT id FROM public.cxbc_partners WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all employees"
ON public.cxbc_partner_employees FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all employees"
ON public.cxbc_partner_employees FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_cxbc_partner_employees_updated_at
BEFORE UPDATE ON public.cxbc_partner_employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();