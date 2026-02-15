-- Create medicine_items table to store individual medicines in a shipment
CREATE TABLE public.medicine_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  medicine_type TEXT NOT NULL CHECK (medicine_type IN ('allopathy', 'homeopathy', 'ayurvedic', 'other')),
  category TEXT NOT NULL CHECK (category IN ('branded', 'generic')),
  form TEXT NOT NULL CHECK (form IN ('tablet', 'capsule', 'liquid', 'semi-liquid', 'powder')),
  medicine_name TEXT NOT NULL,
  unit_count INTEGER NOT NULL CHECK (unit_count > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  daily_dosage INTEGER NOT NULL CHECK (daily_dosage > 0),
  manufacturer_name TEXT NOT NULL,
  manufacturer_address TEXT NOT NULL,
  mfg_date DATE,
  batch_no TEXT NOT NULL,
  expiry_date DATE,
  hsn_code TEXT NOT NULL,
  is_controlled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shipment_documents table to store uploaded documents
CREATE TABLE public.shipment_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('prescription', 'pharmacy_bill', 'consignee_id', 'invoice', 'customs_declaration', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shipment_addons table to store add-on services
CREATE TABLE public.shipment_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  addon_type TEXT NOT NULL CHECK (addon_type IN ('insurance', 'special_packaging', 'express_delivery', 'signature_required')),
  addon_name TEXT NOT NULL,
  addon_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add additional columns to shipments table for medicine-specific data
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS pickup_address JSONB,
ADD COLUMN IF NOT EXISTS consignee_address JSONB,
ADD COLUMN IF NOT EXISTS consignee_passport TEXT,
ADD COLUMN IF NOT EXISTS consignee_email TEXT;

-- Enable RLS
ALTER TABLE public.medicine_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_addons ENABLE ROW LEVEL SECURITY;

-- Medicine items RLS policies
CREATE POLICY "Users can view medicine items for their shipments"
ON public.medicine_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shipments 
    WHERE shipments.id = medicine_items.shipment_id 
    AND shipments.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert medicine items for their shipments"
ON public.medicine_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shipments 
    WHERE shipments.id = medicine_items.shipment_id 
    AND shipments.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update medicine items for their shipments"
ON public.medicine_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.shipments 
    WHERE shipments.id = medicine_items.shipment_id 
    AND shipments.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete medicine items for their shipments"
ON public.medicine_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.shipments 
    WHERE shipments.id = medicine_items.shipment_id 
    AND shipments.user_id = auth.uid()
  )
);

-- Shipment documents RLS policies
CREATE POLICY "Users can view documents for their shipments"
ON public.shipment_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shipments 
    WHERE shipments.id = shipment_documents.shipment_id 
    AND shipments.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert documents for their shipments"
ON public.shipment_documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shipments 
    WHERE shipments.id = shipment_documents.shipment_id 
    AND shipments.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete documents for their shipments"
ON public.shipment_documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.shipments 
    WHERE shipments.id = shipment_documents.shipment_id 
    AND shipments.user_id = auth.uid()
  )
);

-- Shipment addons RLS policies
CREATE POLICY "Users can view addons for their shipments"
ON public.shipment_addons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shipments 
    WHERE shipments.id = shipment_addons.shipment_id 
    AND shipments.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert addons for their shipments"
ON public.shipment_addons FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shipments 
    WHERE shipments.id = shipment_addons.shipment_id 
    AND shipments.user_id = auth.uid()
  )
);

-- Create indexes for better query performance
CREATE INDEX idx_medicine_items_shipment_id ON public.medicine_items(shipment_id);
CREATE INDEX idx_shipment_documents_shipment_id ON public.shipment_documents(shipment_id);
CREATE INDEX idx_shipment_addons_shipment_id ON public.shipment_addons(shipment_id);

-- Create function to generate tracking number
CREATE OR REPLACE FUNCTION public.generate_tracking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_number IS NULL THEN
    NEW.tracking_number := 'CX' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(NEXTVAL('tracking_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for tracking numbers
CREATE SEQUENCE IF NOT EXISTS tracking_number_seq START 1;

-- Create trigger for tracking number generation
DROP TRIGGER IF EXISTS set_tracking_number ON public.shipments;
CREATE TRIGGER set_tracking_number
BEFORE INSERT ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.generate_tracking_number();

-- Add comment for documentation
COMMENT ON TABLE public.medicine_items IS 'Stores individual medicine details for medicine shipments';
COMMENT ON TABLE public.shipment_documents IS 'Stores uploaded documents (prescriptions, bills, IDs) for shipments';
COMMENT ON TABLE public.shipment_addons IS 'Stores add-on services (insurance, special packaging) for shipments';
