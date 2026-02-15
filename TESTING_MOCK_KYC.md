# Testing Mock KYC Mode

## Quick Test Guide

### Option 1: Skip KYC Entirely (Default Flow)
1. Go to http://localhost:8080/auth
2. Select "Customer Panel"
3. Sign up with any email/password
4. Complete profile with your name
5. **You'll be redirected directly to dashboard** ✅
6. No KYC required!

### Option 2: Test KYC Page (Manual)
If you want to test the KYC page itself:

1. Navigate to http://localhost:8080/auth/kyc
2. **Enter any 12-digit number** as Aadhaar
   - Example: `123456789012`
   - Example: `823649282394` (from your screenshot)
   - Any 12 digits will work!
3. Click "Verify Aadhaar"
4. **Enter any 6-digit code** as OTP
   - Example: `123456`
   - Example: `999999`
   - Any 6 digits will work!
5. Click "Complete KYC"
6. Success! You'll see a mock address generated

## What Changed

### Before (Real Validation)
- ❌ Aadhaar had to pass Verhoeff algorithm
- ❌ Only valid government Aadhaar numbers accepted
- ❌ Real OTP verification required

### Now (Mock Mode)
- ✅ Any 12-digit number accepted as Aadhaar
- ✅ Any 6-digit code accepted as OTP
- ✅ Mock address auto-generated
- ✅ UI shows "Mock Mode" messages

## Mock Data Examples

### Valid Test Aadhaar Numbers (any 12 digits)
```
123456789012
111111111111
823649282394
999999999999
234567890123
```

### Valid Test OTP Codes (any 6 digits)
```
123456
000000
999999
111111
654321
```

## UI Indicators

The KYC page now shows:
- **"Mock Mode: Enter any 12-digit number"** on Aadhaar step
- **"Mock Mode: Enter any 6-digit code"** on OTP step
- **"Mock Mode"** in toast notifications
- Alert message: "Enter any 12-digit number to continue"

## Console Logs

Check browser console for debug messages:
```
[KYC Mock] Simulating OTP send for Aadhaar: 123456789012
[KYC Mock] Verifying OTP (any 6-digit code accepted)
[KYC Mock] KYC verification completed successfully
```

## Production Readiness

When ready for production:
1. See `KYC_MOCK_MODE.md` for re-enabling real validation
2. Search for `// MOCK MODE:` comments in code
3. Integrate real Aadhaar API (Sandbox/Karza/Digilocker)
4. Remove mock UI messages
5. Restore Verhoeff validation
