import { supabase } from '@/integrations/supabase/client';

// Storage bucket names
export const STORAGE_BUCKETS = {
  SHIPMENT_DOCUMENTS: 'shipment-documents',
  MEDICINE_PRESCRIPTIONS: 'medicine-prescriptions',
  PASSPORT_DOCUMENTS: 'passport-documents',
  KYC_DOCUMENTS: 'kyc-documents',
  PROFILE_IMAGES: 'profile-images',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

interface UploadOptions {
  bucket: StorageBucket;
  file: File;
  path: string; // e.g., 'user-id/shipment-id/filename.pdf'
  upsert?: boolean;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile({
  bucket,
  file,
  path,
  upsert = false,
}: UploadOptions): Promise<UploadResult> {
  try {
    console.log(`[Storage] Uploading to ${bucket}/${path}`);

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert,
      });

    if (error) {
      console.error('[Storage] Upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log('[Storage] Upload successful:', data.path);

    return {
      success: true,
      path: data.path,
      url: urlData.publicUrl,
    };
  } catch (error: any) {
    console.error('[Storage] Upload exception:', error);
    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  uploads: UploadOptions[]
): Promise<UploadResult[]> {
  const results = await Promise.all(
    uploads.map(upload => uploadFile(upload))
  );
  return results;
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('[Storage] Delete error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('[Storage] File deleted:', path);
    return { success: true };
  } catch (error: any) {
    console.error('[Storage] Delete exception:', error);
    return {
      success: false,
      error: error.message || 'Delete failed',
    };
  }
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Get signed URL for private file (expires in 1 hour by default)
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600
): Promise<{ url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      return { error: error.message };
    }

    return { url: data.signedUrl };
  } catch (error: any) {
    return { error: error.message || 'Failed to get signed URL' };
  }
}

/**
 * Download a file
 */
export async function downloadFile(
  bucket: StorageBucket,
  path: string
): Promise<{ data?: Blob; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (error: any) {
    return { error: error.message || 'Download failed' };
  }
}

/**
 * List files in a folder
 */
export async function listFiles(
  bucket: StorageBucket,
  folder: string = ''
): Promise<{ files?: any[]; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      return { error: error.message };
    }

    return { files: data };
  } catch (error: any) {
    return { error: error.message || 'List failed' };
  }
}

/**
 * Generate a unique file path
 */
export function generateFilePath(
  userId: string,
  category: string,
  filename: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${userId}/${category}/${timestamp}_${sanitizedFilename}`;
}

/**
 * Validate file type
 */
export function validateFileType(
  file: File,
  allowedTypes: readonly string[]
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
    };
  }
  return { valid: true };
}

/**
 * Validate file size (in MB)
 */
export function validateFileSize(
  file: File,
  maxSizeMB: number
): { valid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    };
  }
  return { valid: true };
}

/**
 * Common file type groups
 */
export const FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
  PDF_ONLY: ['application/pdf'],
} as const;

/**
 * Upload with validation
 */
export async function uploadWithValidation({
  bucket,
  file,
  path,
  allowedTypes,
  maxSizeMB = 5,
  upsert = false,
}: UploadOptions & {
  allowedTypes: readonly string[];
  maxSizeMB?: number;
}): Promise<UploadResult> {
  // Validate file type
  const typeValidation = validateFileType(file, allowedTypes);
  if (!typeValidation.valid) {
    return {
      success: false,
      error: typeValidation.error,
    };
  }

  // Validate file size
  const sizeValidation = validateFileSize(file, maxSizeMB);
  if (!sizeValidation.valid) {
    return {
      success: false,
      error: sizeValidation.error,
    };
  }

  // Upload file
  return uploadFile({ bucket, file, path, upsert });
}
