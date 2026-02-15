-- Create document_items table for document shipment details
CREATE TABLE IF NOT EXISTS public.document_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    packet_type TEXT NOT NULL CHECK (packet_type IN ('envelope', 'small-packet', 'large-packet', 'tube')),
    document_type TEXT NOT NULL,
    description TEXT,
    weight_grams INTEGER NOT NULL CHECK (weight_grams > 0 AND weight_grams <= 2000),
    length_cm NUMERIC(10, 2) NOT NULL CHECK (length_cm > 0),
    width_cm NUMERIC(10, 2) NOT NULL CHECK (width_cm > 0),
    height_cm NUMERIC(10, 2) NOT NULL CHECK (height_cm > 0),
    insurance BOOLEAN DEFAULT FALSE,
    waterproof_packaging BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_document_items_shipment_id ON public.document_items(shipment_id);

-- Enable RLS
ALTER TABLE public.document_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_items
-- Users can view their own document items
CREATE POLICY "Users can view own document items"
    ON public.document_items
    FOR SELECT
    USING (
        shipment_id IN (
            SELECT id FROM public.shipments WHERE user_id = auth.uid()
        )
    );

-- Users can insert their own document items
CREATE POLICY "Users can insert own document items"
    ON public.document_items
    FOR INSERT
    WITH CHECK (
        shipment_id IN (
            SELECT id FROM public.shipments WHERE user_id = auth.uid()
        )
    );

-- Users can update their own document items
CREATE POLICY "Users can update own document items"
    ON public.document_items
    FOR UPDATE
    USING (
        shipment_id IN (
            SELECT id FROM public.shipments WHERE user_id = auth.uid()
        )
    );

-- Service role can do everything (for admin operations)
CREATE POLICY "Service role full access"
    ON public.document_items
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_document_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_items_updated_at
    BEFORE UPDATE ON public.document_items
    FOR EACH ROW
    EXECUTE FUNCTION update_document_items_updated_at();
