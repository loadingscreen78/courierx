-- Phase 2: Database Schema Extensions

-- Extend shipment_status enum with new statuses
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'payment_received';
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'pickup_scheduled';
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'out_for_pickup';
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'picked_up';
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'at_warehouse';
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'qc_in_progress';
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'qc_passed';
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'qc_failed';
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'pending_payment';
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'dispatched';

-- Add Domestic Logistics Columns to Shipments Table
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS domestic_carrier text,
ADD COLUMN IF NOT EXISTS domestic_tracking_id text,
ADD COLUMN IF NOT EXISTS domestic_pickup_token text,
ADD COLUMN IF NOT EXISTS domestic_label_url text,
ADD COLUMN IF NOT EXISTS pickup_scheduled_date date,
ADD COLUMN IF NOT EXISTS actual_weight_kg numeric,
ADD COLUMN IF NOT EXISTS dimensions_length_cm numeric,
ADD COLUMN IF NOT EXISTS dimensions_width_cm numeric,
ADD COLUMN IF NOT EXISTS dimensions_height_cm numeric,
ADD COLUMN IF NOT EXISTS qc_operator_id uuid,
ADD COLUMN IF NOT EXISTS qc_completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS qc_notes text,
ADD COLUMN IF NOT EXISTS weight_difference_charge numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS international_awb text;

-- Domestic Tracking Logs (First Mile visibility)
CREATE TABLE public.domestic_tracking_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid REFERENCES public.shipments(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL,
  location text,
  timestamp timestamp with time zone DEFAULT now()
);

ALTER TABLE public.domestic_tracking_logs ENABLE ROW LEVEL SECURITY;

-- Users can view tracking for their own shipments
CREATE POLICY "Users can view their own tracking logs" ON public.domestic_tracking_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shipments 
    WHERE shipments.id = domestic_tracking_logs.shipment_id 
    AND shipments.user_id = auth.uid()
  ));

-- Admins/warehouse operators can manage all tracking logs
CREATE POLICY "Admins can manage tracking logs" ON public.domestic_tracking_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'warehouse_operator'));

-- QC Checklists (Medicine verification)
CREATE TABLE public.qc_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid REFERENCES public.shipments(id) ON DELETE CASCADE UNIQUE NOT NULL,
  operator_id uuid NOT NULL,
  passport_name_match boolean,
  prescription_patient_match boolean,
  bill_patient_match boolean,
  is_narcotic boolean DEFAULT false,
  bill_date_valid boolean,
  actual_unit_count integer,
  daily_dosage integer,
  days_supply_calculated integer,
  days_supply_compliant boolean,
  final_weight_kg numeric,
  dimensions_length_cm numeric,
  dimensions_width_cm numeric,
  dimensions_height_cm numeric,
  decision text,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.qc_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage QC checklists" ON public.qc_checklists
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'warehouse_operator'));

CREATE POLICY "Users can view their own QC checklists" ON public.qc_checklists
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shipments 
    WHERE shipments.id = qc_checklists.shipment_id 
    AND shipments.user_id = auth.uid()
  ));

-- Shipment Documents Storage
CREATE TABLE public.shipment_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid REFERENCES public.shipments(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL,
  file_url text NOT NULL,
  uploaded_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.shipment_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own shipment documents" ON public.shipment_documents
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shipments 
    WHERE shipments.id = shipment_documents.shipment_id 
    AND shipments.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all shipment documents" ON public.shipment_documents
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'warehouse_operator'));

-- Dispatch Manifests (Outbound grouping)
CREATE TABLE public.dispatch_manifests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_number text UNIQUE NOT NULL,
  carrier text NOT NULL,
  shipment_count integer DEFAULT 0,
  dispatched_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.dispatch_manifests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage dispatch manifests" ON public.dispatch_manifests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'warehouse_operator'));

-- Manifest Items (Junction table)
CREATE TABLE public.manifest_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_id uuid REFERENCES public.dispatch_manifests(id) ON DELETE CASCADE NOT NULL,
  shipment_id uuid REFERENCES public.shipments(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (manifest_id, shipment_id)
);

ALTER TABLE public.manifest_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage manifest items" ON public.manifest_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'warehouse_operator'));

-- Create sequence for manifest numbers
CREATE SEQUENCE IF NOT EXISTS manifest_number_seq START 1;

-- Function to generate manifest number
CREATE OR REPLACE FUNCTION public.generate_manifest_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.manifest_number := 'MAN-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('manifest_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

-- Trigger for manifest number generation
CREATE TRIGGER set_manifest_number
  BEFORE INSERT ON public.dispatch_manifests
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_manifest_number();

-- Allow admins to update shipments
CREATE POLICY "Admins can update all shipments" ON public.shipments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'warehouse_operator'));

CREATE POLICY "Admins can view all shipments" ON public.shipments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'warehouse_operator'));