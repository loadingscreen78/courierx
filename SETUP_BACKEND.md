# Backend Setup Guide

## Quick Start

### 1. Run Database Migrations

The migrations need to be applied to your Supabase database.

#### Option A: Using Supabase CLI (Recommended)
```bash
cd courierx2
npx supabase db push
```

#### Option B: Manual SQL Execution
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run these migrations in order:

**First Migration:**
```
courierx2/supabase/migrations/20260129000000_medicine_shipment_tables.sql
```

**Second Migration:**
```
courierx2/supabase/migrations/20260129000001_storage_buckets.sql
```

### 2. Verify Tables Created

Check in Supabase Dashboard → Table Editor:
- ✅ `medicine_items`
- ✅ `shipment_documents`
- ✅ `shipment_addons`
- ✅ `shipments` (should have new columns)

### 3. Verify Storage Bucket

Check in Supabase Dashboard → Storage:
- ✅ `documents` bucket exists
- ✅ Bucket is private (not public)

### 4. Test the Form

1. **Start the app** (already running at http://localhost:8080)
2. **Sign in** to your account
3. **Navigate** to http://localhost:8080/book/medicine
4. **Fill the form**:
   - Step 1: Add medicine details
   - Step 2: Enter addresses
   - Step 3: Upload documents
   - Step 4: Select add-ons
   - Step 5: Review and confirm
5. **Click "Confirm & Pay"**
6. **Check result**:
   - Success toast should appear
   - Tracking number displayed
   - Redirected to shipments page

### 5. Verify Data Saved

Go to Supabase Dashboard → Table Editor:

**Check Shipments:**
```sql
SELECT * FROM shipments ORDER BY created_at DESC LIMIT 5;
```

**Check Medicine Items:**
```sql
SELECT * FROM medicine_items ORDER BY created_at DESC LIMIT 10;
```

**Check Documents:**
```sql
SELECT * FROM shipment_documents ORDER BY uploaded_at DESC LIMIT 10;
```

**Check Add-ons:**
```sql
SELECT * FROM shipment_addons ORDER BY created_at DESC LIMIT 10;
```

## What's Implemented

### ✅ Complete Features

1. **Database Schema**
   - Medicine items table
   - Shipment documents table
   - Shipment add-ons table
   - Extended shipments table

2. **Storage**
   - Private documents bucket
   - RLS policies for security
   - Automatic file organization

3. **Service Layer**
   - `createMedicineShipment()` - Save complete booking
   - `getMedicineShipmentDetails()` - Retrieve shipment data
   - Document upload handling
   - Cost calculation logic

4. **Frontend Integration**
   - Form submission handler
   - Loading states
   - Success/error handling
   - Automatic redirect

5. **Security**
   - Row Level Security (RLS) on all tables
   - Users can only access their own data
   - Private document storage

## Data Flow

```
User Fills Form
    ↓
Click "Confirm & Pay"
    ↓
handleConfirmBooking()
    ↓
createMedicineShipment()
    ↓
┌─────────────────────────────┐
│ 1. Create Shipment Record   │
│ 2. Insert Medicine Items    │
│ 3. Upload Documents         │
│ 4. Create Document Records  │
│ 5. Insert Add-ons           │
│ 6. Generate Tracking Number │
└─────────────────────────────┘
    ↓
Return Success + Tracking Number
    ↓
Show Toast Notification
    ↓
Redirect to Shipments Page
```

## Example Data Structure

### Shipment Record
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "shipment_type": "medicine",
  "status": "draft",
  "tracking_number": "CX20260129000001",
  "origin_address": "123 Street, City, State - 123456",
  "destination_address": "456 Avenue, City, Country - 654321",
  "destination_country": "United States",
  "recipient_name": "John Doe",
  "recipient_phone": "+1 234567890",
  "recipient_email": "john@example.com",
  "declared_value": 5000.00,
  "shipping_cost": 2450.00,
  "gst_amount": 441.00,
  "total_amount": 2891.00,
  "weight_kg": 0.5,
  "pickup_address": { /* JSONB */ },
  "consignee_address": { /* JSONB */ },
  "consignee_passport": "AB1234567",
  "created_at": "2026-01-29T..."
}
```

### Medicine Item Record
```json
{
  "id": "uuid",
  "shipment_id": "uuid",
  "medicine_type": "allopathy",
  "category": "branded",
  "form": "tablet",
  "medicine_name": "Paracetamol 500mg",
  "unit_count": 100,
  "unit_price": 50.00,
  "daily_dosage": 3,
  "manufacturer_name": "ABC Pharma",
  "manufacturer_address": "123 Industrial Area",
  "mfg_date": "2025-01-01",
  "batch_no": "BATCH123",
  "expiry_date": "2027-01-01",
  "hsn_code": "30049099",
  "is_controlled": false
}
```

### Document Record
```json
{
  "id": "uuid",
  "shipment_id": "uuid",
  "document_type": "prescription",
  "file_name": "prescription.pdf",
  "file_path": "shipment-documents/uuid/prescription_1738195200000.pdf",
  "file_size": 245678,
  "mime_type": "application/pdf",
  "uploaded_at": "2026-01-29T..."
}
```

### Add-on Record
```json
{
  "id": "uuid",
  "shipment_id": "uuid",
  "addon_type": "insurance",
  "addon_name": "Shipment Insurance (up to $25,000)",
  "addon_cost": 150.00
}
```

## Troubleshooting

### Issue: "Failed to create shipment"

**Check:**
1. User is logged in (`user.id` exists)
2. All required fields are filled
3. Database migrations ran successfully
4. RLS policies are correct

**Solution:**
```bash
# Check browser console for detailed error
# Verify in Supabase Dashboard → Authentication that user exists
# Run migrations again if needed
```

### Issue: "Document upload failed"

**Check:**
1. Storage bucket `documents` exists
2. RLS policies on storage.objects are correct
3. File size is within limits (default 50MB)

**Solution:**
```sql
-- Verify bucket exists
SELECT * FROM storage.buckets WHERE id = 'documents';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

### Issue: "Medicine items not saving"

**Check:**
1. Medicine data types are correct
2. Dates are in proper format
3. Required fields are not null

**Solution:**
```javascript
// Check console logs for validation errors
console.log('[MedicineShipment] Medicine items:', medicineItems);
```

## Next Steps

### Recommended Enhancements

1. **Payment Integration**
   - Add Razorpay/Stripe integration
   - Update shipment status after payment
   - Generate invoice

2. **Email Notifications**
   - Send booking confirmation
   - Send tracking updates
   - Send delivery notifications

3. **Admin Dashboard**
   - View all shipments
   - Update shipment status
   - Manage documents

4. **Tracking Page**
   - Public tracking by tracking number
   - Status timeline
   - Document downloads

5. **Invoice Generation**
   - Auto-generate PDF invoices
   - Include all charges
   - Email to customer

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs in Dashboard
3. Verify migrations ran successfully
4. Review `MEDICINE_BOOKING_BACKEND.md` for detailed documentation

## Files Created/Modified

### New Files
- ✅ `supabase/migrations/20260129000000_medicine_shipment_tables.sql`
- ✅ `supabase/migrations/20260129000001_storage_buckets.sql`
- ✅ `src/lib/shipments/medicineShipmentService.ts`
- ✅ `MEDICINE_BOOKING_BACKEND.md`
- ✅ `SETUP_BACKEND.md` (this file)

### Modified Files
- ✅ `src/views/MedicineBooking.tsx`
- ✅ `src/components/booking/medicine/ReviewStep.tsx`

## Testing Checklist

- [ ] Migrations applied successfully
- [ ] Tables visible in Supabase Dashboard
- [ ] Storage bucket created
- [ ] Can sign in to app
- [ ] Can access medicine booking form
- [ ] Can fill all form steps
- [ ] Can upload documents
- [ ] Can submit form successfully
- [ ] Tracking number generated
- [ ] Data visible in database
- [ ] Documents uploaded to storage
- [ ] Redirected to shipments page

## Success Criteria

✅ **Backend is working when:**
1. Form submission completes without errors
2. Tracking number is generated and displayed
3. Data appears in all database tables
4. Documents are uploaded to storage
5. User is redirected to shipments page
6. Success toast notification appears

🎉 **You're all set!**
