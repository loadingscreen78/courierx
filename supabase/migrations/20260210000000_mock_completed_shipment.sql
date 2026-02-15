-- Mock completed shipment for testing History page
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users table
-- To get your user ID, run: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Insert a completed medicine shipment
INSERT INTO public.shipments (
    id,
    user_id,
    shipment_type,
    status,
    tracking_number,
    origin_address,
    destination_address,
    destination_country,
    recipient_name,
    recipient_phone,
    recipient_email,
    declared_value,
    shipping_cost,
    gst_amount,
    total_amount,
    weight_kg,
    notes,
    created_at,
    updated_at
) 
SELECT 
    '11111111-1111-1111-1111-111111111111'::uuid,
    id, -- Use the first user's ID
    'medicine'::shipment_type,
    'delivered'::shipment_status,
    'CRX-MED-2026-001',
    'Mumbai, Maharashtra, India',
    'Dubai Healthcare City, Dubai, UAE',
    'AE',
    'Ahmed Al Maktoum',
    '+971501234567',
    'ahmed.maktoum@email.com',
    2500.00,
    2150.00,
    387.00,
    2537.00,
    1.50,
    'Urgent delivery - Temperature sensitive medicines',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '5 days'
FROM auth.users
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Insert medicine items for this shipment
INSERT INTO public.medicine_items (
    shipment_id,
    medicine_name,
    generic_name,
    manufacturer,
    quantity,
    unit_price,
    total_price,
    requires_prescription,
    temperature_controlled,
    created_at
) VALUES 
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Paracetamol 500mg',
    'Acetaminophen',
    'Sun Pharma',
    100,
    5.00,
    500.00,
    false,
    false,
    NOW() - INTERVAL '15 days'
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Insulin Glargine 100IU/ml',
    'Insulin Glargine',
    'Novo Nordisk',
    5,
    400.00,
    2000.00,
    true,
    true,
    NOW() - INTERVAL '15 days'
) ON CONFLICT DO NOTHING;

-- Insert shipment addons
INSERT INTO public.shipment_addons (
    shipment_id,
    addon_type,
    addon_name,
    addon_cost,
    created_at
) VALUES 
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'insurance',
    'Shipment Insurance',
    150.00,
    NOW() - INTERVAL '15 days'
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'special_packaging',
    'Temperature Controlled Packaging',
    200.00,
    NOW() - INTERVAL '15 days'
) ON CONFLICT DO NOTHING;

-- Insert invoice for this shipment
INSERT INTO public.invoices (
    id,
    user_id,
    shipment_id,
    invoice_number,
    amount,
    gst_amount,
    total_amount,
    status,
    description,
    paid_at,
    created_at
)
SELECT 
    '22222222-2222-2222-2222-222222222222'::uuid,
    id,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'INV-2026-00001',
    2150.00,
    387.00,
    2537.00,
    'paid'::invoice_status,
    'Medicine shipment to Dubai, UAE',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
FROM auth.users
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Add a second completed document shipment
INSERT INTO public.shipments (
    id,
    user_id,
    shipment_type,
    status,
    tracking_number,
    origin_address,
    destination_address,
    destination_country,
    recipient_name,
    recipient_phone,
    recipient_email,
    declared_value,
    shipping_cost,
    gst_amount,
    total_amount,
    weight_kg,
    notes,
    created_at,
    updated_at
)
SELECT 
    '33333333-3333-3333-3333-333333333333'::uuid,
    id,
    'document'::shipment_type,
    'delivered'::shipment_status,
    'CRX-DOC-2026-002',
    'Delhi, India',
    'London, United Kingdom',
    'GB',
    'Emma Thompson',
    '+447700900123',
    'emma.thompson@email.com',
    500.00,
    1250.00,
    225.00,
    1475.00,
    0.50,
    'Legal documents - Handle with care',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '3 days'
FROM auth.users
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Insert document items
INSERT INTO public.document_items (
    shipment_id,
    packet_type,
    document_type,
    description,
    weight_grams,
    length_cm,
    width_cm,
    height_cm,
    insurance,
    waterproof_packaging,
    created_at
) VALUES (
    '33333333-3333-3333-3333-333333333333'::uuid,
    'envelope',
    'Legal Documents',
    'Contract papers and agreements',
    500,
    35.00,
    25.00,
    2.00,
    true,
    true,
    NOW() - INTERVAL '10 days'
) ON CONFLICT DO NOTHING;

-- Add a third completed gift shipment
INSERT INTO public.shipments (
    id,
    user_id,
    shipment_type,
    status,
    tracking_number,
    origin_address,
    destination_address,
    destination_country,
    recipient_name,
    recipient_phone,
    recipient_email,
    declared_value,
    shipping_cost,
    gst_amount,
    total_amount,
    weight_kg,
    notes,
    created_at,
    updated_at
)
SELECT 
    '44444444-4444-4444-4444-444444444444'::uuid,
    id,
    'gift'::shipment_type,
    'delivered'::shipment_status,
    'CRX-GFT-2026-003',
    'Bangalore, India',
    'New York, USA',
    'US',
    'Michael Brown',
    '+12125551234',
    'michael.brown@email.com',
    5000.00,
    2450.00,
    441.00,
    2891.00,
    2.00,
    'Birthday gift - Fragile items',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '8 days'
FROM auth.users
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Insert gift items
INSERT INTO public.gift_items (
    shipment_id,
    item_name,
    hsn_code,
    description,
    quantity,
    unit_price,
    total_value,
    insurance,
    gift_wrapping,
    created_at
) VALUES 
(
    '44444444-4444-4444-4444-444444444444'::uuid,
    'Handcrafted Silk Saree',
    '54074100',
    'Traditional Indian silk saree with embroidery',
    1,
    3000.00,
    3000.00,
    true,
    true,
    NOW() - INTERVAL '20 days'
),
(
    '44444444-4444-4444-4444-444444444444'::uuid,
    'Silver Jewelry Set',
    '71131910',
    'Sterling silver necklace and earrings',
    1,
    2000.00,
    2000.00,
    true,
    true,
    NOW() - INTERVAL '20 days'
) ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.shipments IS 'Mock data added for testing History page with completed shipments';
