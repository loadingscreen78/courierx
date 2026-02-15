/**
 * Test script to verify database setup
 * Run with: node test-database-setup.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
let supabaseUrl, supabaseKey;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim().replace(/"/g, '');
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=') || line.startsWith('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=')) {
      supabaseKey = line.split('=')[1].trim().replace(/"/g, '');
    }
  });
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('Required variables:');
  console.log('  - NEXT_PUBLIC_SUPABASE_URL');
  console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseSetup() {
  console.log('🔍 Testing Database Setup...\n');

  // Test 1: Check if shipments table exists
  console.log('1️⃣ Checking shipments table...');
  const { data: shipments, error: shipmentsError } = await supabase
    .from('shipments')
    .select('id')
    .limit(1);
  
  if (shipmentsError) {
    console.log('❌ Shipments table error:', shipmentsError.message);
  } else {
    console.log('✅ Shipments table exists');
  }

  // Test 2: Check if medicine_items table exists
  console.log('\n2️⃣ Checking medicine_items table...');
  const { data: medicines, error: medicinesError } = await supabase
    .from('medicine_items')
    .select('id')
    .limit(1);
  
  if (medicinesError) {
    console.log('❌ Medicine_items table error:', medicinesError.message);
    console.log('⚠️  You need to run the migration: 20260129000000_medicine_shipment_tables.sql');
  } else {
    console.log('✅ Medicine_items table exists');
  }

  // Test 3: Check if shipment_documents table exists
  console.log('\n3️⃣ Checking shipment_documents table...');
  const { data: documents, error: documentsError } = await supabase
    .from('shipment_documents')
    .select('id')
    .limit(1);
  
  if (documentsError) {
    console.log('❌ Shipment_documents table error:', documentsError.message);
    console.log('⚠️  You need to run the migration: 20260129000000_medicine_shipment_tables.sql');
  } else {
    console.log('✅ Shipment_documents table exists');
  }

  // Test 4: Check if shipment_addons table exists
  console.log('\n4️⃣ Checking shipment_addons table...');
  const { data: addons, error: addonsError } = await supabase
    .from('shipment_addons')
    .select('id')
    .limit(1);
  
  if (addonsError) {
    console.log('❌ Shipment_addons table error:', addonsError.message);
    console.log('⚠️  You need to run the migration: 20260129000000_medicine_shipment_tables.sql');
  } else {
    console.log('✅ Shipment_addons table exists');
  }

  // Test 5: Storage (Skipped - will use Cloudflare R2)
  console.log('\n5️⃣ Storage Setup...');
  console.log('⏭️  Skipped - Will use Cloudflare R2 for document storage');
  console.log('   Documents will be stored as metadata only for now');

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 SUMMARY');
  console.log('='.repeat(50));
  
  const allTablesExist = !medicinesError && !documentsError && !addonsError;
  
  if (allTablesExist) {
    console.log('✅ All required tables exist!');
    console.log('✅ Database is ready for medicine bookings');
    console.log('\n📝 Next steps:');
    console.log('   1. Fill out the medicine booking form');
    console.log('   2. Complete all 5 steps');
    console.log('   3. Click "Confirm & Pay" on the review step');
    console.log('   4. Data will be saved to Supabase');
  } else {
    console.log('❌ Some tables are missing!');
    console.log('\n📝 To fix this:');
    console.log('   1. Go to your Supabase Dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Run these migrations in order:');
    console.log('      - courierx2/supabase/migrations/20260129000000_medicine_shipment_tables.sql');
    console.log('      - courierx2/supabase/migrations/20260129000001_storage_buckets.sql');
  }
  
  console.log('\n');
}

testDatabaseSetup().catch(console.error);
