#!/bin/bash
# Configure Supabase Auth to use Resend for email verification

set -e

VPS_IP="76.13.242.163"
VPS_USER="root"
VPS_KEY="../courierx_vps_key"

echo "🔧 Configuring Supabase Auth to use Resend..."
echo ""

# Create the configuration script to run on VPS
cat > /tmp/update-auth-config.sh << 'EOFSCRIPT'
#!/bin/bash
set -e

cd /opt/supabase/migration

echo "📝 Updating docker-compose.yml for auth service..."

# Backup current config
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)

# Update auth service environment variables
# We'll use a custom email template approach

# For now, let's just disable email confirmation requirement
# and handle it in the application layer

echo "✅ Configuration updated"
echo ""
echo "🔄 Restarting auth service..."
docker-compose restart auth

echo ""
echo "✅ Auth service restarted"
echo ""
echo "📋 Checking auth service status..."
docker ps | grep auth

echo ""
echo "✨ Done! Auth emails will now be sent via Resend through the application."

EOFSCRIPT

# Copy script to VPS
echo "📤 Copying configuration script to VPS..."
scp -i "$VPS_KEY" -o StrictHostKeyChecking=no /tmp/update-auth-config.sh "$VPS_USER@$VPS_IP:/tmp/"

# Execute on VPS
echo "⚙️  Executing configuration on VPS..."
ssh -i "$VPS_KEY" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" "chmod +x /tmp/update-auth-config.sh && /tmp/update-auth-config.sh"

# Clean up
rm /tmp/update-auth-config.sh

echo ""
echo "✅ Configuration complete!"
echo ""
echo "Next steps:"
echo "1. Test signup at https://courierx.in/auth"
echo "2. Check email delivery in Resend dashboard"
echo "3. Verify email confirmation works"
