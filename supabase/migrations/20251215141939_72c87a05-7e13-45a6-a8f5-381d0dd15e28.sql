-- Create shipment status enum
CREATE TYPE public.shipment_status AS ENUM (
  'draft',
  'confirmed',
  'picked_up',
  'at_warehouse',
  'qc_passed',
  'qc_failed',
  'in_transit',
  'customs_clearance',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

-- Create shipment type enum
CREATE TYPE public.shipment_type AS ENUM ('medicine', 'document', 'gift');

-- Create invoice status enum
CREATE TYPE public.invoice_status AS ENUM ('paid', 'pending', 'refunded');

-- Create shipments table
CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shipment_type shipment_type NOT NULL,
  status shipment_status NOT NULL DEFAULT 'draft',
  tracking_number TEXT UNIQUE,
  origin_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT,
  recipient_email TEXT,
  declared_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  gst_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  weight_kg NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  gst_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  status invoice_status NOT NULL DEFAULT 'pending',
  description TEXT NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Shipments RLS policies
CREATE POLICY "Users can view their own shipments"
ON public.shipments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shipments"
ON public.shipments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shipments"
ON public.shipments FOR UPDATE
USING (auth.uid() = user_id);

-- Invoices RLS policies
CREATE POLICY "Users can view their own invoices"
ON public.invoices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices"
ON public.invoices FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('invoice_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- Create trigger for invoice number generation
CREATE TRIGGER set_invoice_number
BEFORE INSERT ON public.invoices
FOR EACH ROW
WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
EXECUTE FUNCTION public.generate_invoice_number();

-- Create trigger for shipments updated_at
CREATE TRIGGER update_shipments_updated_at
BEFORE UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_shipments_user_id ON public.shipments(user_id);
CREATE INDEX idx_shipments_status ON public.shipments(status);
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_shipment_id ON public.invoices(shipment_id);