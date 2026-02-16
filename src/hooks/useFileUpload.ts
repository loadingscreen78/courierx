import { useState } from 'react';
import {
  uploadWithValidation,
  generateFilePath,
  type StorageBucket,
  FILE_TYPES,
} from '@/lib/storage/storageService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UseFileUploadOptions {
  bucket: StorageBucket;
  category: string;
  allowedTypes?: readonly string[];
  maxSizeMB?: number;
  onSuccess?: (url: string, path: string) => void;
  onError?: (error: string) => void;
}

export function useFileUpload({
  bucket,
  category,
  allowedTypes = FILE_TYPES.DOCUMENTS,
  maxSizeMB = 5,
  onSuccess,
  onError,
}: UseFileUploadOptions) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    if (!user) {
      const error = 'User not authenticated';
      toast.error(error);
      onError?.(error);
      return { success: false, error };
    }

    setUploading(true);
    setProgress(0);

    try {
      // Generate unique file path
      const path = generateFilePath(user.id, category, file.name);

      // Simulate progress (since Supabase doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Upload file
      const result = await uploadWithValidation({
        bucket,
        file,
        path,
        allowedTypes,
        maxSizeMB,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!result.success) {
        toast.error(result.error || 'Upload failed');
        onError?.(result.error || 'Upload failed');
        return result;
      }

      setUploadedUrl(result.url || null);
      setUploadedPath(result.path || null);
      
      toast.success('File uploaded successfully');
      onSuccess?.(result.url!, result.path!);

      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Upload failed';
      toast.error(errorMsg);
      onError?.(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const reset = () => {
    setUploadedUrl(null);
    setUploadedPath(null);
    setProgress(0);
  };

  return {
    uploadFile,
    uploading,
    progress,
    uploadedUrl,
    uploadedPath,
    reset,
  };
}
