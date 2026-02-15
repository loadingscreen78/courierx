# ⚠️ IMPORTANT: Run Database Migrations

## Current Status
❌ **Medicine booking tables are NOT created yet**
❌ **Data will NOT be saved until you run the migrations**

## Quick Fix (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: `nndcxvvulrxnfjoorjzz`

### Step 2: Open SQL Editor
1. Click on **"SQL Editor"** in the left sidebar
2. Click **"New Query"** button

### Step 3: Run First Migration
1. Open this file: `courierx2/supabase/migrations/20260129000000_medicine_shipment_tables.sql`
2. Copy ALL the SQL code from that file
3. Paste it into the SQL Editor
4. Click **"Run"** button (or press Ctrl+Enter)
5. Wait for success message: ✅ "Success. No rows returned"

### Step 4: Run Second Migration
1. Click **"New Query"** again
2. Open this file: `courierx2/supabase/migrations/20260129000001_storage_buckets.sql`
3. Copy ALL the SQL code from that file
4. Paste it into the SQL Editor
5. Click **"Run"** button
6. Wait for success message

### Step 5: Verify Setup
Run this command in your terminal:
```bash
cd courierx2
node test-database-setup.js
```

You should see:
```
✅ All required tables exist!
✅ Database is ready for medicine bookings
```

## What These Migrations Create

### Migration 1: Tables
- ✅ `medicine_items` - Stores medicine details
- ✅ `shipment_documents` - Stores uploaded documents
- ✅ `shipment_addons` - Stores insurance/packaging add-ons
- ✅ Extends `shipments` table with new columns

### Migration 2: Storage
- ✅ `documents` bucket - For prescription/bill/ID uploads
- ✅ Security policies for file access

## After Running Migrations

### Test the Complete Flow
1. Go to http://localhost:8080/book/medicine
2. Fill out all 5 steps:
   - Step 1: Add medicine details
   - Step 2: Enter addresses
   - Step 3: Upload documents
   - Step 4: Select add-ons
   - Step 5: Review and confirm
3. Click **"Confirm & Pay"**
4. You should see:
   - ✅ Success toast with tracking number
   - ✅ Redirect to shipments page

### Verify Data in Database
1. Go to Supabase Dashboard → **Table Editor**
2. Check these tables:
   - `shipments` - Should have your new shipment
   - `medicine_items` - Should have your medicines
   - `shipment_documents` - Should have document records
   - `shipment_addons` - Should have add-ons if selected

3. Go to **Storage** → `documents` bucket
   - Should see uploaded files organized by shipment ID

## Troubleshooting

### Error: "relation already exists"
- This means the table was already created
- You can skip that migration
- Continue with the next one

### Error: "permission denied"
- Make sure you're signed in as the project owner
- Check you selected the correct project

### Error: "syntax error"
- Make sure you copied the ENTIRE SQL file
- Don't miss any lines at the beginning or end

### Still Not Working?
Run the test script again:
```bash
node test-database-setup.js
```

It will tell you exactly which tables are missing.

## Migration Files Location

Both migration files are in:
```
courierx2/supabase/migrations/
├── 20260129000000_medicine_shipment_tables.sql  ← Run this FIRST
└── 20260129000001_storage_buckets.sql           ← Run this SECOND
```

## Need Help?

If you encounter any issues:
1. Check the Supabase Dashboard logs
2. Run `node test-database-setup.js` to see what's missing
3. Make sure you're running the migrations in the correct order

---

**⏱️ This should take less than 5 minutes!**

Once done, your medicine booking form will save all data to Supabase properly! 🎉
