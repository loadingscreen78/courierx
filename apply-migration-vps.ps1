# Apply profile creation fix to VPS Supabase
$VPS_IP = "76.13.242.163"
$VPS_USER = "root"
$VPS_KEY = "..\courierx_vps_key"
$MIGRATION_FILE = "FIX_PROFILE_CREATION_NOW.sql"

Write-Host "Applying profile creation fix to VPS Supabase..." -ForegroundColor Green
Write-Host "VPS: $VPS_IP"
Write-Host ""

# Check if SSH is available
if (!(Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host "SSH not found. Please install OpenSSH Client:" -ForegroundColor Red
    Write-Host "   Settings -> Apps -> Optional Features -> Add OpenSSH Client"
    exit 1
}

# Copy migration file to VPS
Write-Host "Copying migration file to VPS..." -ForegroundColor Cyan
scp -i $VPS_KEY -o StrictHostKeyChecking=no $MIGRATION_FILE "${VPS_USER}@${VPS_IP}:/tmp/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to copy file to VPS" -ForegroundColor Red
    exit 1
}

# Execute migration on VPS
Write-Host "Executing migration on VPS..." -ForegroundColor Cyan

ssh -i $VPS_KEY -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" 'bash -s' < apply-migration-vps.sh

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Migration applied successfully to VPS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Go to https://courierx.in/auth"
    Write-Host "2. Try signing up with a new email/password"
    Write-Host "3. Should work without Database error"
} else {
    Write-Host "Migration failed" -ForegroundColor Red
    exit 1
}
