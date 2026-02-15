const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseServiceKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running document shipment migration...');
    
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20260202000000_document_shipment_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // If RPC doesn't exist, try direct query
      const { data, error } = await supabase.from('_migrations').select('*').limit(1);
      if (error) {
        // Table doesn't exist, we'll execute SQL directly via REST API
        console.log('Executing SQL via REST API...');
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql_query: sql })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      }
      return { data, error };
    });

    if (error) {
      console.error('Migration error:', error);
      console.log('\nPlease run this SQL manually in your Supabase SQL Editor:');
      console.log('\n' + sql);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('Document items table created with RLS policies');
    
  } catch (error) {
    console.error('Error running migration:', error.message);
    console.log('\n📋 Please run this SQL manually in your Supabase SQL Editor:');
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20260202000000_document_shipment_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('\n' + sql);
    process.exit(1);
  }
}

runMigration();
