# Gift Shipment Migration - Run This Now!

## Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

## Step 2: Copy and Run the Migration
Copy the entire content from:
```
courierx2/supabase/migrations/20260206000000_gift_shipment_tables.sql
```

Paste it into the SQL editor and click "Run"

## What This Does
- Creates `gift_items` table to store gift shipment details
- Sets up proper indexes for fast lookups
- Enables Row Level Security (RLS) policies
- Creates triggers for automatic timestamp updates

## Expected Result
You should see: "Success. No rows returned"

## After Running
The gift booking module will be fully functional with:
- Real-time database integration
- Automatic wallet deduction
- Shipment tracking
- Dashboard display

## If You Get Errors
- Make sure you're connected to the correct Supabase project
- Check that the `shipments` table exists (from previous migrations)
- Contact support if issues persist
