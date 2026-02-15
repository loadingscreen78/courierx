# Medicine Booking Backend Implementation

## Overview
Complete backend implementation for saving medicine booking form data to Supabase database.

## Database Schema

### Tables Created

#### 1. `medicine_items`
Stores individual medicine details for each shipment.

**Columns:**
- `id` (UUID) - Primary key
- `shipment_id` (UUID) - Foreign key to shipments table
- `medicine_type` (TEXT) - allopathy, homeopathy, ayurvedic, other
- `category` (TEXT) - branded, generic
- `form` (TEXT) - tablet, capsule, liquid, semi-liquid, powder
- `medicine_name` (TEXT) - Name of the medicine
- `unit_count` (INTEGER) - Number of units
- `unit_price` (NUMERIC) - Price per unit
- `daily_dosage` (INTEGER) - Daily dosage
- `manufacturer_name` (TEXT) - Manufacturer name
- `manufacturer_address` (TEXT) - Manufacturer address
- `mfg_date` (DATE) - Manufacturing date
- `batch_no` (TEXT) - Batch number
- `expiry_date` (DATE) - Expiry date
- `hsn_code` (TEXT) - HSN code
- `is_controlled` (BOOLEAN) - Whether it's a controlled substance
- `created_at` (TIMESTAMP) - Creation timestamp

#### 2. `shipment_documents`
Stores uploaded documents (prescriptions, bills, IDs).

**Columns:**
- `id` (UUID) - Primary key
- `shipment_id` (UUID) - Foreign key to shipments table
- `document_type` (TEXT) - prescription, pharmacy_bill, consignee_id, invoice, customs_declaration, other
- `file_name` (TEXT) - Original file name
- `file_path` (TEXT) - Storage path
- `file_size` (INTEGER) - File size in bytes
- `mime_type` (TEXT) - MIME type
- `uploaded_at` (TIMESTAMP) - Upload timestamp

#### 3. `shipment_addons`
Stores add-on services for shipments.

**Columns:**
- `id` (UUID) - Primary key
- `shipment_id` (UUID) - Foreign key to shipments table
- `addon_type` (TEXT) - insurance, special_packaging, express_delivery, signature_required
- `addon_name` (TEXT) - Display name
- `addon_cost` (NUMERIC) - Cost of addon
- `created_at` (TIMESTAMP) - Creation timestamp

#### 4. `shipments` (Extended)
Added new columns to existing shipments table:
- `pickup_address` (JSONB) - Structured pickup address
- `consignee_address` (JSONB) - Structured consignee address
- `consignee_passport` (TEXT) - Passport number
- `consignee_email` (TEXT) - Consignee email

### Storage Bucket

#### `documents`
Private storage bucket for shipment documents.

**Structure:**
```
documents/
  └── {shipment_id}/
      ├── prescription_{timestamp}.pdf
      ├── pharmacy_bill_{timestamp}.pdf
      └── consignee_id_{timestamp}.pdf
```

## Service Implementation

### File: `src/lib/shipments/medicineShipmentService.ts`

#### Main Functions

##### `createMedicineShipment(params)`
Creates a complete medicine shipment with all related data.

**Parameters:**
```typescript
{
  bookingData: MedicineBookingData,
  userId: string
}
```

**Returns:**
```typescript
{
  success: boolean,
  shipmentId?: string,
  trackingNumber?: string,
  error?: string
}
```

**Process:**
1. Calculate shipping costs based on weight and destination
2. Create shipment record
3. Insert medicine items
4. Upload documents to storage
5. Create document records
6. Insert add-ons
7. Return tracking number

##### `getMedicineShipmentDetails(shipmentId)`
Retrieves complete shipment details with all related data.

**Returns:**
```typescript
{
  success: boolean,
  data?: {
    shipment: Shipment,
    medicines: MedicineItem[],
    documents: Document[],
    addons: Addon[]
  },
  error?: string
}
```

#### Helper Functions

##### `uploadDocument(file, shipmentId, documentType)`
Uploads a document to Supabase Storage.

##### `calculateShippingCosts(medicines, country)`
Calculates shipping costs based on:
- Total weight (50g per medicine unit)
- Declared value
- Destination country multiplier
- GST (18%)

**Country Multipliers:**
- United States: 1.5x
- United Kingdom: 1.3x
- Canada: 1.4x
- Australia: 1.6x
- UAE: 1.2x
- Singapore: 1.3x
- Others: 1.0x

## Frontend Integration

### Updated Files

#### `src/views/MedicineBooking.tsx`
Added:
- Import `createMedicineShipment` service
- Import `useAuth` hook
- Import `useRouter` for navigation
- State for `isSubmitting`
- `handleConfirmBooking()` function
- Pass `onConfirmBooking` to ReviewStep

#### `src/components/booking/medicine/ReviewStep.tsx`
- Receives `onConfirmBooking` prop
- Calls it when user confirms booking

## Usage Flow

### 1. User Fills Form
User completes all 5 steps:
1. Medicine Details
2. Addresses
3. Documents
4. Add-ons
5. Review

### 2. Confirm Booking
When user clicks "Confirm & Pay":
```typescript
handleConfirmBooking() {
  // 1. Validate user is logged in
  // 2. Call createMedicineShipment()
  // 3. Show success/error toast
  // 4. Redirect to shipments page
}
```

### 3. Data Saved
Backend saves:
- ✅ Shipment record with addresses
- ✅ All medicine items
- ✅ Uploaded documents (prescription, bill, ID)
- ✅ Selected add-ons
- ✅ Generates tracking number

### 4. User Redirected
User is redirected to `/shipments` page to view their booking.

## Security

### Row Level Security (RLS)
All tables have RLS enabled:
- Users can only view/modify their own shipments
- Users can only upload/view documents for their shipments
- Users can only add/view add-ons for their shipments

### Storage Security
- Documents bucket is private
- Users can only upload to their own folders
- Users can only view their own documents

## Testing

### Manual Testing Steps

1. **Sign in** to the application
2. **Navigate** to `/book/medicine`
3. **Fill in** all form steps:
   - Add at least one medicine
   - Enter pickup and delivery addresses
   - Upload required documents
   - Select add-ons (optional)
4. **Review** all details
5. **Click** "Confirm & Pay"
6. **Verify**:
   - Success toast appears
   - Tracking number is shown
   - Redirected to shipments page

### Database Verification

```sql
-- Check shipment created
SELECT * FROM shipments WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC LIMIT 1;

-- Check medicine items
SELECT * FROM medicine_items WHERE shipment_id = 'SHIPMENT_ID';

-- Check documents
SELECT * FROM shipment_documents WHERE shipment_id = 'SHIPMENT_ID';

-- Check addons
SELECT * FROM shipment_addons WHERE shipment_id = 'SHIPMENT_ID';
```

## Migrations

Run migrations in order:
1. `20260129000000_medicine_shipment_tables.sql` - Creates tables
2. `20260129000001_storage_buckets.sql` - Sets up storage

## Error Handling

The service handles errors gracefully:
- **Shipment creation fails**: Returns error, no data saved
- **Medicine items fail**: Rolls back shipment
- **Document upload fails**: Continues with other documents
- **Add-ons fail**: Continues, shipment still created

## Future Enhancements

### Planned Features
1. **Payment Integration**: Connect to payment gateway
2. **Email Notifications**: Send confirmation emails
3. **SMS Notifications**: Send tracking updates
4. **Invoice Generation**: Auto-generate PDF invoices
5. **Customs Declaration**: Auto-generate customs forms
6. **Real-time Tracking**: Update shipment status
7. **Rate Calculator**: Dynamic pricing based on courier APIs

### Optimization Opportunities
1. **Batch Inserts**: Use batch operations for medicine items
2. **Parallel Uploads**: Upload documents in parallel
3. **Caching**: Cache country multipliers and rates
4. **Compression**: Compress documents before upload
5. **Validation**: Add server-side validation

## API Reference

### Create Shipment
```typescript
import { createMedicineShipment } from '@/lib/shipments/medicineShipmentService';

const result = await createMedicineShipment({
  bookingData: {
    medicines: [...],
    pickupAddress: {...},
    consigneeAddress: {...},
    prescription: File,
    pharmacyBill: File,
    consigneeId: File,
    insurance: boolean,
    specialPackaging: boolean,
  },
  userId: 'user-uuid',
});

if (result.success) {
  console.log('Tracking:', result.trackingNumber);
} else {
  console.error('Error:', result.error);
}
```

### Get Shipment Details
```typescript
import { getMedicineShipmentDetails } from '@/lib/shipments/medicineShipmentService';

const result = await getMedicineShipmentDetails('shipment-uuid');

if (result.success) {
  console.log('Shipment:', result.data.shipment);
  console.log('Medicines:', result.data.medicines);
  console.log('Documents:', result.data.documents);
  console.log('Addons:', result.data.addons);
}
```

## Troubleshooting

### Common Issues

#### 1. "Failed to upload document"
- Check storage bucket exists
- Verify RLS policies are correct
- Check file size limits

#### 2. "Shipment creation failed"
- Verify user is authenticated
- Check all required fields are filled
- Review database constraints

#### 3. "Medicine items error"
- Validate medicine data types
- Check date formats
- Verify HSN codes

## Support

For issues or questions:
1. Check console logs for detailed errors
2. Verify database migrations ran successfully
3. Check Supabase dashboard for RLS policy issues
4. Review service logs in browser DevTools
