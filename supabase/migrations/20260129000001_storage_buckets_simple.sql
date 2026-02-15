-- Create storage bucket for shipment documents (skip if exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Note: Storage policies are managed automatically by Supabase
-- If you need custom policies, configure them in the Supabase Dashboard:
-- Storage → documents bucket → Policies
