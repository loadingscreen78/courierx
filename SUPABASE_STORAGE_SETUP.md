# Supabase Storage Integration - Complete Setup Guide

## Overview
Supabase Storage is now fully integrated into your CourierX app for storing images, documents, prescriptions, passports, and KYC documents.

## Step 1: Run the Migration

### Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"

### Run the Migration
Copy the entire content from:
```
courierx2/supabase/migrations/20260208000000_storage_buckets_setup.sql
```

Paste it into the SQL editor and click "Run"

### What This Creates
- **5 Storage Buckets**:
  - `shipment-documents` - All shipment-related documents
  - `medicine-prescriptions` - Prescription and pharmacy bills
  - `passport-documents` - Passport and ID documents
  - `kyc-documents` - KYC verification documents
  - `profile-images` - User profile pictures (public)

- **Security Policies**:
  - Users can only access their own files
  - Files are organized by user ID
  - Admins have full access
  - Profile images are publicly accessible

## Step 2: Usage Examples

### Example 1: Simple File Upload with Hook

```typescript
import { useFileUpload } from '@/hooks/useFileUpload';
import { STORAGE_BUCKETS, FILE_TYPES } from '@/lib/storage/storageService';
import { FileUpload } from '@/components/ui/FileUpload';

function MyComponent() {
  const { uploadFile, uploading, progress, uploadedUrl } = useFileUpload({
    bucket: STORAGE_BUCKETS.SHIPMENT_DOCUMENTS,
    category: 'invoices',
    allowedTypes: FILE_TYPES.DOCUMENTS,
    maxSizeMB: 5,
    onSuccess: (url, path) => {
      console.log('Uploaded:', url);
      // Save URL to database
    },
  });

  return (
    <FileUpload
      onFileSelect={uploadFile}
      uploading={uploading}
      progress={progress}
      uploadedUrl={uploadedUrl}
      label="Upload Invoice"
      description="PDF, JPG, PNG (Max 5MB)"
    />
  );
}
```

### Example 2: Upload Prescription for Medicine Shipment

```typescript
import { useFileUpload } from '@/hooks/useFileUpload';
import { STORAGE_BUCKETS, FILE_TYPES } from '@/lib/storage/storageService';

function PrescriptionUpload({ shipmentId }: { shipmentId: string }) {
  const { uploadFile, uploading, uploadedUrl } = useFileUpload({
    bucket: STORAGE_BUCKETS.MEDICINE_PRESCRIPTIONS,
    category: `shipment-${shipmentId}`,
    allowedTypes: FILE_TYPES.DOCUMENTS,
    maxSizeMB: 10,
    onSuccess: async (url, path) => {
      // Save to database
      await supabase
        .from('shipment_documents')
        .insert({
          shipment_id: shipmentId,
          document_type: 'prescription',
          file_path: path,
          file_url: url,
        });
    },
  });

  return (
    <FileUpload
      onFileSelect={uploadFile}
      uploading={uploading}
      uploadedUrl={uploadedUrl}
      accept=".pdf,image/*"
      label="Upload Prescription"
    />
  );
}
```

### Example 3: Upload Multiple Files

```typescript
import { uploadMultipleFiles, STORAGE_BUCKETS } from '@/lib/storage/storageService';

async function uploadDocuments(files: File[], userId: string, shipmentId: string) {
  const uploads = files.map((file, index) => ({
    bucket: STORAGE_BUCKETS.SHIPMENT_DOCUMENTS,
    file,
    path: `${userId}/shipment-${shipmentId}/doc-${index}-${file.name}`,
  }));

  const results = await uploadMultipleFiles(uploads);
  
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`File ${index + 1} uploaded:`, result.url);
    } else {
      console.error(`File ${index + 1} failed:`, result.error);
    }
  });
}
```

### Example 4: Direct Upload with Service

```typescript
import { uploadFile, STORAGE_BUCKETS, generateFilePath } from '@/lib/storage/storageService';

async function uploadPassport(file: File, userId: string) {
  const path = generateFilePath(userId, 'passport', file.name);
  
  const result = await uploadFile({
    bucket: STORAGE_BUCKETS.PASSPORT_DOCUMENTS,
    file,
    path,
  });

  if (result.success) {
    console.log('Uploaded:', result.url);
    return result.url;
  } else {
    console.error('Upload failed:', result.error);
    throw new Error(result.error);
  }
}
```

### Example 5: Profile Image Upload

```typescript
import { useFileUpload } from '@/hooks/useFileUpload';
import { STORAGE_BUCKETS, FILE_TYPES } from '@/lib/storage/storageService';

function ProfileImageUpload() {
  const { uploadFile, uploading, uploadedUrl } = useFileUpload({
    bucket: STORAGE_BUCKETS.PROFILE_IMAGES,
    category: 'avatar',
    allowedTypes: FILE_TYPES.IMAGES,
    maxSizeMB: 2,
    onSuccess: async (url) => {
      // Update user profile
      await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', user.id);
    },
  });

  return (
    <FileUpload
      onFileSelect={uploadFile}
      uploading={uploading}
      uploadedUrl={uploadedUrl}
      accept="image/*"
      label="Upload Profile Picture"
      description="JPG, PNG (Max 2MB)"
    />
  );
}
```

## Available Functions

### Upload Functions
- `uploadFile()` - Upload single file
- `uploadMultipleFiles()` - Upload multiple files
- `uploadWithValidation()` - Upload with type/size validation

### Download Functions
- `downloadFile()` - Download file as Blob
- `getPublicUrl()` - Get public URL
- `getSignedUrl()` - Get temporary signed URL (private files)

### Management Functions
- `deleteFile()` - Delete a file
- `listFiles()` - List files in folder

### Utility Functions
- `generateFilePath()` - Generate unique file path
- `validateFileType()` - Validate file MIME type
- `validateFileSize()` - Validate file size

## File Type Constants

```typescript
FILE_TYPES.IMAGES // ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
FILE_TYPES.DOCUMENTS // ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
FILE_TYPES.PDF_ONLY // ['application/pdf']
```

## Storage Buckets

```typescript
STORAGE_BUCKETS.SHIPMENT_DOCUMENTS // 'shipment-documents'
STORAGE_BUCKETS.MEDICINE_PRESCRIPTIONS // 'medicine-prescriptions'
STORAGE_BUCKETS.PASSPORT_DOCUMENTS // 'passport-documents'
STORAGE_BUCKETS.KYC_DOCUMENTS // 'kyc-documents'
STORAGE_BUCKETS.PROFILE_IMAGES // 'profile-images'
```

## File Organization

Files are automatically organized by user ID:
```
bucket-name/
  └── user-id/
      └── category/
          └── timestamp_filename.ext
```

Example:
```
medicine-prescriptions/
  └── 123e4567-e89b-12d3-a456-426614174000/
      └── shipment-abc123/
          └── 1707398400000_prescription.pdf
```

## Security

- ✅ Row Level Security (RLS) enabled
- ✅ Users can only access their own files
- ✅ File type restrictions enforced
- ✅ File size limits enforced
- ✅ Admins have full access
- ✅ Profile images are public

## Limits

- **Max file size**: 10MB (configurable per bucket)
- **Allowed types**: Configured per bucket
- **Storage quota**: Based on your Supabase plan

## Error Handling

All functions return a result object:
```typescript
{
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}
```

Always check `success` before using `url` or `path`.

## Integration with Existing Code

### Update Medicine Booking
Replace the placeholder upload in `medicineShipmentService.ts`:

```typescript
import { uploadFile, STORAGE_BUCKETS, generateFilePath } from '@/lib/storage/storageService';

// Replace the uploadDocument function
async function uploadDocument(file: File, shipmentId: string, documentType: string, userId: string) {
  const path = generateFilePath(userId, `shipment-${shipmentId}`, file.name);
  
  const result = await uploadFile({
    bucket: STORAGE_BUCKETS.MEDICINE_PRESCRIPTIONS,
    file,
    path,
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return { path: result.path, url: result.url };
}
```

## Testing Checklist

After running the migration, test:
- [ ] Upload a prescription (medicine booking)
- [ ] Upload a passport document (gift booking)
- [ ] Upload a profile image
- [ ] View uploaded files
- [ ] Delete uploaded files
- [ ] Try uploading wrong file type (should fail)
- [ ] Try uploading oversized file (should fail)
- [ ] Verify files are organized by user ID
- [ ] Verify other users can't access your files

## Troubleshooting

### "Bucket not found" error
- Run the migration in Supabase SQL Editor
- Check that buckets are created in Storage section

### "Permission denied" error
- Verify RLS policies are created
- Check that user is authenticated
- Ensure file path starts with user ID

### "File too large" error
- Check file size limits in migration
- Adjust `maxSizeMB` in upload options

### "Invalid file type" error
- Check allowed MIME types in migration
- Verify `allowedTypes` in upload options

## Next Steps

1. Run the migration in Supabase
2. Test file upload with the examples above
3. Update existing booking forms to use real storage
4. Add file preview functionality
5. Implement file deletion when shipments are cancelled

Your Supabase Storage is now fully configured and ready to use!
