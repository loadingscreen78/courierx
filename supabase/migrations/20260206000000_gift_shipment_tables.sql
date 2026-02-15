-- Create gift_items table for gift shipment details
CREATE TABLE IF NOT EXISTS public.gift_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    hsn_code TEXT NOT NULL CHECK (length(hsn_code) = 8),
    description TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
    total_value NUMERIC(10, 2) NOT NULL CHECK (total_value > 0),
    insurance BOOLEAN DEFAULT FALSE,
    gift_wrapping BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_gift_items_shipment_id ON public.gift_items(shipment_id);

-- Enable RLS
ALTER TABLE public.gift_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gift_items
-- Users can view their own gift items
CREATE POLICY "Users can view own gift items"
    ON public.gift_items
    FOR SELECT
    USING (
        shipment_id IN (
            SELECT id FROM public.shipments WHERE user_id = auth.uid()
        )
    );

-- Users can insert their own gift items
CREATE POLICY "Users can insert own gift items"
    ON public.gift_items
    FOR INSERT
    WITH CHECK (
        shipment_id IN (
            SELECT id FROM public.shipments WHERE user_id = auth.uid()
        )
    );

-- Users can update their own gift items
CREATE POLICY "Users can update own gift items"
    ON public.gift_items
    FOR UPDATE
    USING (
        shipment_id IN (
            SELECT id FROM public.shipments WHERE user_id = auth.uid()
        )
    );

-- Service role can do everything (for admin operations)
CREATE POLICY "Service role full access"
    ON public.gift_items
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_gift_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gift_items_updated_at
    BEFORE UPDATE ON public.gift_items
    FOR EACH ROW
    EXECUTE FUNCTION update_gift_items_updated_at();
