# Cloudflare R2 Integration Guide

## Current Status
✅ Database tables created and working  
✅ Medicine booking saves all data  
⏭️ Document uploads skipped (will use Cloudflare R2)  

## What's Working Now

The app currently:
- ✅ Saves shipment data to database
- ✅ Saves medicine items
- ✅ Saves document **metadata** (filename, type, size)
- ⏭️ Skips actual file upload (placeholder path stored)

## When You're Ready to Add R2

### Step 1: Set Up Cloudflare R2

1. Go to Cloudflare Dashboard
2. Navigate to R2 Object Storage
3. Create a new bucket (e.g., `courierx-documents`)
4. Get your credentials:
   - Account ID
   - Access Key ID
   - Secret Access Key
   - Bucket name

### Step 2: Install R2 SDK

```bash
npm install @aws-sdk/client-s3
# R2 is S3-compatible, so we use AWS SDK
```

### Step 3: Add Environment Variables

Add to `.env.local`:
```env
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=courierx-documents
R2_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com
```

### Step 4: Create R2 Upload Service

Create `src/lib/storage/r2Service.ts`:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(
  file: File,
  key: string
): Promise<{ url: string; error?: string }> {
  try {
    const buffer = await file.arrayBuffer();
    
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(buffer),
      ContentType: file.type,
    });

    await r2Client.send(command);

    const url = `${process.env.R2_PUBLIC_URL}/${key}`;
    return { url };
  } catch (error) {
    console.error('R2 upload error:', error);
    return { url: '', error: 'Failed to upload to R2' };
  }
}
```

### Step 5: Update Medicine Shipment Service

In `src/lib/shipments/medicineShipmentService.ts`, replace the `uploadDocument` function:

```typescript
import { uploadToR2 } from '@/lib/storage/r2Service';

async function uploadDocument(
  file: File,
  shipmentId: string,
  documentType: string
): Promise<{ path: string; error?: string }> {
  try {
    const fileExt = file.name.split('.').pop();
    const key = `shipments/${shipmentId}/${documentType}_${Date.now()}.${fileExt}`;
    
    const { url, error } = await uploadToR2(file, key);
    
    if (error) {
      return { path: '', error };
    }

    return { path: url };
  } catch (err) {
    console.error('Upload exception:', err);
    return { path: '', error: 'Failed to upload document' };
  }
}
```

### Step 6: Set Up R2 Public Access (Optional)

If you want documents to be publicly accessible:

1. In Cloudflare Dashboard → R2 → Your Bucket
2. Go to Settings → Public Access
3. Enable "Allow Access" and set up custom domain
4. Update `R2_PUBLIC_URL` in `.env.local`

Or keep it private and generate signed URLs when needed.

### Step 7: Test Upload

1. Fill medicine booking form
2. Upload documents in Step 3
3. Click "Confirm & Pay"
4. Check Cloudflare R2 bucket for uploaded files

## File Structure in R2

```
courierx-documents/
  └── shipments/
      └── {shipment_id}/
          ├── prescription_1738195200000.pdf
          ├── pharmacy_bill_1738195200000.pdf
          └── consignee_id_1738195200000.pdf
```

## Benefits of R2 vs Supabase Storage

✅ **Cheaper**: No egress fees  
✅ **Faster**: Cloudflare's global network  
✅ **S3 Compatible**: Easy to migrate  
✅ **Better Performance**: CDN built-in  

## Migration from Current Setup

Since we're storing document metadata in `shipment_documents` table:
1. Documents table already has `file_path` column
2. Just update the upload function to use R2
3. Old placeholder paths can be ignored
4. New uploads will have R2 URLs

## Security Considerations

### Private Documents (Recommended)
- Keep bucket private
- Generate signed URLs for viewing
- Set expiration on signed URLs

### Public Documents (Simpler)
- Make bucket public
- Direct URLs work immediately
- Less secure but easier to implement

## Cost Estimate

Cloudflare R2 Pricing:
- Storage: $0.015/GB/month
- Class A Operations (writes): $4.50/million
- Class B Operations (reads): $0.36/million
- **Egress: FREE** (this is the big win!)

For 1000 shipments/month with 3 documents each:
- Storage: ~1GB = $0.015/month
- Uploads: 3000 = $0.014/month
- **Total: ~$0.03/month** 🎉

## Alternative: Keep It Simple

If you don't want to set up R2 right now:
1. Current setup works fine (saves metadata)
2. Documents can be uploaded later
3. Or use a simple file upload service
4. Or even email documents to support

The shipment creation works perfectly without actual file uploads!

---

## Summary

**Current State:**
- ✅ All data saves to database
- ✅ Document metadata stored
- ⏭️ Actual files not uploaded (placeholder path)

**When You Add R2:**
- ✅ Install AWS SDK
- ✅ Add R2 credentials
- ✅ Update upload function
- ✅ Files upload to R2
- ✅ URLs stored in database

**Time to Integrate:** ~30 minutes when you're ready

For now, the app works perfectly without file uploads! 🚀
