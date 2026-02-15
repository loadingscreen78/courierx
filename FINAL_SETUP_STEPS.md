# ✅ Final Setup Steps (Simple)

## Current Status
✅ First migration ran successfully  
❌ Second migration failed (permission error)

## Quick Fix (2 steps)

### Step 1: Create Storage Bucket (SQL)

Go to Supabase Dashboard → SQL Editor → New Query

Copy and run this:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;
```

Click **"Run"** → Should see ✅ Success

### Step 2: Set Up Storage Policies (Dashboard UI)

1. Go to **Storage** → **documents** bucket → **Policies** tab
2. Click **"New Policy"**
3. Select **"Allow access to authenticated users only"** template
4. Click **"Use this template"**
5. Done! ✅

## Verify Setup

Run in terminal:
```bash
cd courierx2
node test-database-setup.js
```

Should show:
```
✅ Shipments table exists
✅ Medicine_items table exists
✅ Shipment_documents table exists
✅ Shipment_addons table exists
✅ Documents storage bucket exists
```

## Test the Complete Flow

1. Go to http://localhost:8080/book/medicine
2. Fill all 5 steps:
   - Medicine details
   - Addresses
   - Upload documents (prescription, bill, ID)
   - Add-ons (insurance, packaging)
   - Review
3. Click **"Confirm & Pay"**
4. Should see: ✅ Success with tracking number!

## Check Data Saved

### In Database (Table Editor)
- `shipments` → Your shipment record
- `medicine_items` → Your medicines
- `shipment_documents` → Document records
- `shipment_addons` → Add-ons if selected

### In Storage
- Storage → documents → Your user ID folder → Uploaded files

## If Storage Policies Are Too Complex

You can temporarily skip document uploads:
1. Comment out document validation in the code
2. Or just don't upload documents in Step 3
3. The shipment will still be created

But for full functionality, set up the storage policies as described above.

---

## Summary

**What's Working:**
✅ All database tables created  
✅ Medicine items can be saved  
✅ Shipment data can be saved  
✅ Add-ons can be saved  

**What Needs Manual Setup:**
⚠️ Storage bucket (1 SQL command)  
⚠️ Storage policies (use template in dashboard)  

**Total Time:** ~5 minutes

Once done, everything will work perfectly! 🎉
