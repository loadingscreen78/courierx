-- Create storage buckets for CourierX
-- Run this migration in Supabase SQL Editor

-- 1. Create shipment-documents bucket (for all shipment documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shipment-documents',
  'shipment-documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create medicine-prescriptions bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medicine-prescriptions',
  'medicine-prescriptions',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Create passport-documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'passport-documents',
  'passport-documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 4. Create kyc-documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 5. Create profile-images bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Policy: Users can upload their own files
CREATE POLICY "Users can upload own files to shipment-documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shipment-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload own files to medicine-prescriptions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medicine-prescriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload own files to passport-documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'passport-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload own files to kyc-documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload own profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view own files in shipment-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'shipment-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own files in medicine-prescriptions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medicine-prescriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own files in passport-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'passport-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own files in kyc-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files in shipment-documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shipment-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own files in medicine-prescriptions"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'medicine-prescriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own files in passport-documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'passport-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own files in kyc-documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files in shipment-documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'shipment-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own files in medicine-prescriptions"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'medicine-prescriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own files in passport-documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'passport-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own files in kyc-documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- ADMIN POLICIES (Service Role)
-- ============================================

-- Admins can view all files
CREATE POLICY "Service role can view all files"
ON storage.objects FOR SELECT
TO service_role
USING (true);

-- Admins can manage all files
CREATE POLICY "Service role can manage all files"
ON storage.objects FOR ALL
TO service_role
USING (true);
