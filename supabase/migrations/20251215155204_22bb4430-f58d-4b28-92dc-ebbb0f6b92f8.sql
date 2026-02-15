-- Fix search_path for generate_ticket_number function
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.ticket_number := 'TKT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('ticket_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

-- Fix search_path for generate_invoice_number function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('invoice_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$;