-- App settings table for configurable values like warehouse address
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default warehouse address
INSERT INTO app_settings (key, value) VALUES (
  'warehouse_address',
  '{
    "name": "CourierX Warehouse",
    "phone": "9999999999",
    "address": "Gopalpur",
    "city": "Cuttack",
    "state": "Odisha",
    "pincode": "753011"
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- RLS: only service role can write, authenticated admins can read
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON app_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read" ON app_settings
  FOR SELECT TO authenticated USING (true);
