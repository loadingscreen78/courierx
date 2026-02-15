-- Create storage bucket for shipment documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for documents bucket
CREATE POLICY "Users can upload their own shipment documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own shipment documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own shipment documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add comment
COMMENT ON POLICY "Users can upload their own shipment documents" ON storage.objects IS 'Allow users to upload documents for their own shipments';
