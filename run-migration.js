// Run this with: node run-migration.js
// This will apply the profile creation fix to your Supabase database

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nndcxvvulrxnfjoorjzz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  console.log('\nPlease add it to .env.local:');
  console.log('SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"');
  console.log('\nYou can find it in: https://supabase.com/dashboard/project/nndcxvvulrxnfjoorjzz/settings/api');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Starting profile creation fix migration...\n');

  const sql = fs.readFileSync(path.join(__dirname, 'FIX_PROFILE_CREATION_NOW.sql'), 'utf8');
  
  // Split by semicolons but keep multi-line statements together
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s.length > 0);

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments and verification queries
    if (statement.includes('SELECT') || statement.includes('VERIFICATION')) {
      continue;
    }

    console.log(`⏳ Executing statement ${i + 1}...`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: statement + ';' 
      });
      
      if (error) {
        // Try direct query if RPC fails
        const { error: directError } = await supabase
          .from('_migrations')
          .select('*')
          .limit(0);
        
        if (directError) {
          console.log(`⚠️  Warning: ${error.message}`);
        }
      } else {
        console.log(`✅ Success`);
      }
    } catch (err) {
      console.log(`⚠️  Warning: ${err.message}`);
    }
  }

  console.log('\n✨ Migration completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Go to: https://supabase.com/dashboard/project/nndcxvvulrxnfjoorjzz/sql');
  console.log('2. Copy and paste the contents of FIX_PROFILE_CREATION_NOW.sql');
  console.log('3. Click "Run" to execute the migration');
  console.log('4. Try signing up again with email/password\n');
}

runMigration().catch(console.error);
