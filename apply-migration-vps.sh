#!/bin/bash
# Apply profile creation fix to VPS Supabase
set -e

VPS_IP="76.13.242.163"
VPS_USER="root"
VPS_KEY="../courierx_vps_key"
MIGRATION_FILE="FIX_PROFILE_CREATION_NOW.sql"

echo "🚀 Applying profile creation fix to VPS Supabase..."
echo "VPS: $VPS_IP"
echo ""

# Copy migration file to VPS
echo "📤 Copying migration file to VPS..."
scp -i "$VPS_KEY" -o StrictHostKeyChecking=no "$MIGRATION_FILE" "$VPS_USER@$VPS_IP:/tmp/"

# Execute migration on VPS
echo "⚙️  Executing migration on VPS..."
ssh -i "$VPS_KEY" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" << 'ENDSSH'
set -e

echo "📝 Running SQL migration..."

# Get the database password from docker-compose env
cd /root/supabase || cd /opt/supabase || cd ~/supabase || { echo "❌ Supabase directory not found"; exit 1; }

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Run the migration using docker exec
docker exec -i $(docker ps -q -f name=db) psql -U postgres -d postgres < /tmp/FIX_PROFILE_CREATION_NOW.sql

echo "✅ Migration completed successfully!"

# Verify the trigger exists
echo ""
echo "🔍 Verifying trigger installation..."
docker exec -i $(docker ps -q -f name=db) psql -U postgres -d postgres -c "SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';"

echo ""
echo "🔍 Verifying RLS policies..."
docker exec -i $(docker ps -q -f name=db) psql -U postgres -d postgres -c "SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles' AND policyname LIKE '%insert%';"

echo ""
echo "✨ All done! Try signing up with email/password now."

ENDSSH

echo ""
echo "✅ Migration applied successfully to VPS!"
echo ""
echo "Next steps:"
echo "1. Go to https://courierx.in/auth"
echo "2. Try signing up with a new email/password"
echo "3. Should work without 'Database error saving new user' error"
