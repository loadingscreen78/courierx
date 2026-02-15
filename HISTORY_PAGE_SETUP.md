# Shipment History Page - Setup Guide

## Features Implemented

### 1. Real-Time Database Connection
- Fetches completed (delivered) shipments from Supabase
- Automatically loads user's shipment history
- Shows real-time data with loading states

### 2. Rebook Functionality
- "Rebook" button on each completed shipment
- Saves all shipment details (items, addons, declared value, weight, notes)
- **Addresses are editable** - user must enter new origin and destination
- Navigates to appropriate booking page (medicine/document/gift)
- Data stored in localStorage for seamless transfer

### 3. Filters & Stats
- Filter by shipment type (medicine, document, gift)
- Filter by date range (calendar picker)
- Real-time statistics:
  - Total shipments count
  - Total amount spent
  - Breakdown by type
  - Export option (UI ready)

## How to Test

### Step 1: Run the Mock Data Migration

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to your project
3. Navigate to **SQL Editor**
4. Copy the contents of: `courierx2/supabase/migrations/20260210000000_mock_completed_shipment.sql`
5. Paste and run the SQL

This will create 3 mock completed shipments:
- 1 Medicine shipment (to Dubai, UAE)
- 1 Document shipment (to London, UK)
- 1 Gift shipment (to New York, USA)

### Step 2: View History Page

1. Navigate to `/history` in your app
2. You should see the 3 completed shipments
3. Try filtering by type and date range
4. Check the statistics cards

### Step 3: Test Rebook Feature

1. Click "Rebook" button on any shipment
2. You'll be redirected to the booking page
3. All item details will be pre-filled
4. **Addresses will be empty** - user must enter new addresses
5. Complete the booking with new addresses

## Database Structure

### Shipments Table
```sql
- id (UUID)
- user_id (UUID)
- shipment_type (enum: medicine, document, gift)
- status (enum: delivered, in_transit, etc.)
- tracking_number (TEXT)
- origin_address (TEXT)
- destination_address (TEXT)
- destination_country (TEXT)
- recipient_name, recipient_phone, recipient_email
- declared_value, shipping_cost, gst_amount, total_amount
- weight_kg
- notes
- created_at, updated_at
```

### Related Tables
- `medicine_items` - Medicine details
- `document_items` - Document details
- `gift_items` - Gift/sample details
- `shipment_addons` - Insurance, special packaging, etc.

## Rebook Data Structure

When user clicks "Rebook", this data is saved to localStorage:

```javascript
{
  type: 'medicine' | 'document' | 'gift',
  items: [...], // All item details
  addons: [...], // Insurance, packaging, etc.
  declaredValue: 2500.00,
  weight: 1.50,
  notes: 'Original notes',
  destinationCountry: 'AE',
  // These are empty - user must fill
  recipientName: '',
  recipientPhone: '',
  recipientEmail: '',
  originAddress: '',
  destinationAddress: ''
}
```

## Next Steps

### To Make Booking Pages Use Rebook Data:

1. Check for `localStorage.getItem('rebookShipment')` on page load
2. If exists, pre-fill all fields except addresses
3. Clear localStorage after successful booking
4. Show a banner: "Rebooking previous shipment - please update addresses"

### Example Implementation:

```typescript
useEffect(() => {
  const rebookData = localStorage.getItem('rebookShipment');
  if (rebookData) {
    const data = JSON.parse(rebookData);
    // Pre-fill items, addons, etc.
    setItems(data.items);
    setAddons(data.addons);
    // Leave addresses empty for user to fill
    toast({
      title: 'Rebooking Shipment',
      description: 'Please enter new addresses for this shipment'
    });
  }
}, []);
```

## Carrier Assignment Logic

Carriers are automatically assigned based on destination:
- **GCC Countries** (AE, SA, QA, KW, BH, OM): Aramex
- **All Other Countries**: DHL Express

## UI Features

- **Loading State**: CourierXLoader animation while fetching
- **Empty State**: Shows when no shipments found
- **Rebook Button**: On each shipment card
- **Filters**: Type and date range
- **Stats Cards**: Count, total spent, type breakdown
- **Export Button**: UI ready (functionality to be added)

## Status

✅ Database connection working
✅ Real-time data fetching
✅ Rebook feature implemented
✅ Filters and stats working
✅ Mock data migration ready
⏳ Booking pages need to handle rebook data
⏳ Export CSV functionality (future)

## Testing Checklist

- [ ] Run mock data migration in Supabase
- [ ] View history page - see 3 shipments
- [ ] Filter by medicine type - see 1 shipment
- [ ] Filter by date range - see filtered results
- [ ] Click "Rebook" on medicine shipment
- [ ] Verify redirect to /book/medicine
- [ ] Check localStorage has rebookShipment data
- [ ] Verify addresses are empty
- [ ] Complete new booking with new addresses
