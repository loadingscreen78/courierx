# Setup Storage Policies (Manual)

## Why Manual Setup?

The SQL migration for storage policies failed because of permission restrictions. We'll set them up through the Supabase Dashboard instead (easier and safer).

## Step 1: Run Simple Storage Migration

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **"New Query"**
3. Copy this SQL:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;
```

4. Click **"Run"**
5. Should see: ✅ Success

## Step 2: Set Up Storage Policies (Dashboard)

### A. Go to Storage Settings
1. In Supabase Dashboard, click **"Storage"** in left sidebar
2. You should see the **"documents"** bucket
3. Click on **"documents"** bucket
4. Click **"Policies"** tab at the top

### B. Create Upload Policy
1. Click **"New Policy"**
2. Choose **"For full customization"**
3. Fill in:
   - **Policy Name:** `Users can upload their own documents`
   - **Allowed Operation:** Check **INSERT**
   - **Policy Definition:** 
   ```sql
   bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
   ```
4. Click **"Review"**
5. Click **"Save Policy"**

### C. Create View Policy
1. Click **"New Policy"** again
2. Choose **"For full customization"**
3. Fill in:
   - **Policy Name:** `Users can view their own documents`
   - **Allowed Operation:** Check **SELECT**
   - **Policy Definition:**
   ```sql
   bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
   ```
4. Click **"Review"**
5. Click **"Save Policy"**

### D. Create Delete Policy
1. Click **"New Policy"** again
2. Choose **"For full customization"**
3. Fill in:
   - **Policy Name:** `Users can delete their own documents`
   - **Allowed Operation:** Check **DELETE**
   - **Policy Definition:**
   ```sql
   bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
   ```
4. Click **"Review"**
5. Click **"Save Policy"**

## Step 3: Verify Everything Works

Run the test script:
```bash
cd courierx2
node test-database-setup.js
```

Should show:
```
✅ All required tables exist!
✅ Documents storage bucket exists
✅ Database is ready for medicine bookings
```

## Alternative: Use Template Policies (Easier)

If the custom policies are too complex, you can use Supabase templates:

1. Go to Storage → documents → Policies
2. Click **"New Policy"**
3. Choose **"Allow access to authenticated users only"** template
4. This will create basic policies automatically

## What These Policies Do

- **Upload Policy:** Users can only upload files to folders named with their user ID
- **View Policy:** Users can only view files in their own folders
- **Delete Policy:** Users can only delete files in their own folders

**File Structure:**
```
documents/
  └── {user_id}/
      └── {shipment_id}/
          ├── prescription_123456.pdf
          ├── pharmacy_bill_123456.pdf
          └── consignee_id_123456.pdf
```

## Test Upload

After setting up policies:

1. Go to http://localhost:8080/book/medicine
2. Fill the form through all steps
3. Upload documents in Step 3
4. Click "Confirm & Pay"
5. Check Storage → documents bucket
6. Should see your uploaded files!

## Troubleshooting

### Can't create policies?
- Make sure you're the project owner
- Try using the template policies instead

### Files not uploading?
- Check browser console for errors
- Verify policies are active (green checkmark)
- Make sure bucket is private (not public)

### Still having issues?
The app will work without storage policies, but document uploads will fail. You can:
1. Skip document uploads for now
2. Or set bucket to public temporarily (not recommended for production)

---

**Once policies are set up, document uploads will work perfectly!** 🎉
