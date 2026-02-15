-- Create enum for ticket category
CREATE TYPE public.ticket_category AS ENUM ('shipment', 'payment', 'kyc', 'refund', 'qc_failure', 'customs', 'general', 'complaint');

-- Create enum for ticket priority
CREATE TYPE public.ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- Create enum for ticket status
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'awaiting_response', 'resolved', 'closed', 'escalated');

-- Create sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ticket_number TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  category ticket_category NOT NULL,
  priority ticket_priority NOT NULL DEFAULT 'normal',
  status ticket_status NOT NULL DEFAULT 'open',
  description TEXT NOT NULL,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  escalated_at TIMESTAMP WITH TIME ZONE,
  escalation_reason TEXT
);

-- Create ticket_messages table
CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID,
  message TEXT NOT NULL,
  is_from_support BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_tickets
CREATE POLICY "Users can view their own tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
ON public.support_tickets FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for ticket_messages
CREATE POLICY "Users can view messages for their tickets"
ON public.ticket_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = ticket_messages.ticket_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can add messages to their tickets"
ON public.ticket_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = ticket_messages.ticket_id
    AND user_id = auth.uid()
  )
);

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'TKT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('ticket_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ticket number generation
CREATE TRIGGER generate_ticket_number_trigger
BEFORE INSERT ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.generate_ticket_number();

-- Trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();