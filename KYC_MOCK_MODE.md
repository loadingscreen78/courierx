# KYC Mock Mode Documentation

## Overview
The application is currently running in **KYC Mock Mode** for development purposes. This bypasses real Aadhaar/KYC verification to allow faster testing and development.

## What's Mocked

### 1. Aadhaar Verification (`AuthContext.tsx`)
- **Function**: `completeAadhaarKyc()`
- **Behavior**: Auto-completes KYC without validating Aadhaar number or OTP
- **Mock Data**: 
  - Address: "123, Mock Street, Sample City, Sample State - 123456"
  - Sets `aadhaar_verified: true`
  - Sets `kyc_completed_at` to current timestamp

### 2. Sign Up Flow (`AuthContext.tsx`)
- **Function**: `signUpWithEmail()`
- **Behavior**: Automatically sets new users as KYC-verified
- **Mock Data**: Same as above

### 3. Authentication Redirects (`Auth.tsx`)
- **Location**: `handleEmailAuth()` and `useEffect` redirect handler
- **Behavior**: Skips KYC verification check, redirects directly to dashboard
- **Original Flow**: Auth → Onboarding → KYC → Dashboard
- **Mock Flow**: Auth → Onboarding → Dashboard

### 4. Onboarding Flow (`Onboarding.tsx`)
- **Behavior**: Redirects to dashboard instead of KYC page after profile completion
- **UI Changes**: Button text changed from "Continue to KYC" to "Continue"

### 5. KYC Page Frontend Validation (`AadhaarKyc.tsx`)
- **Verhoeff Algorithm**: Disabled - accepts any 12-digit number
- **OTP Validation**: Accepts any 6-digit code
- **UI Updates**: Shows "Mock Mode" messages to indicate testing environment
- **Behavior**: 
  - No real Aadhaar validation
  - No real OTP sending
  - Generates mock address based on Aadhaar prefix

## Files Modified

1. `courierx2/src/contexts/AuthContext.tsx`
   - `completeAadhaarKyc()` - Auto-completes with mock data
   - `signUpWithEmail()` - Auto-verifies new users

2. `courierx2/src/views/Auth.tsx`
   - `handleEmailAuth()` - Skips KYC redirect
   - `useEffect` redirect handler - Skips KYC redirect

3. `courierx2/src/views/Onboarding.tsx`
   - Profile completion redirects to dashboard
   - Skip KYC check in useEffect

4. `courierx2/src/views/AadhaarKyc.tsx`
   - Removed Verhoeff algorithm validation
   - Accepts any 12-digit Aadhaar number
   - Accepts any 6-digit OTP
   - Updated UI to show "Mock Mode" messages

## How to Re-enable Real KYC

When ready to connect real KYC API:

1. **AuthContext.tsx**:
   - Restore validation in `completeAadhaarKyc()`
   - Remove auto-verification from `signUpWithEmail()`
   - Integrate real KYC API (Sandbox/Karza/Digilocker)

2. **Auth.tsx**:
   - Restore `aadhaar_verified` check in both redirect locations
   - Uncomment KYC redirect logic

3. **Onboarding.tsx**:
   - Restore KYC redirect after profile completion
   - Restore KYC check in useEffect

4. **AadhaarKyc.tsx**:
   - Restore Verhoeff algorithm validation
   - Integrate real OTP sending via Aadhaar API
   - Remove "Mock Mode" UI messages
   - Connect to real KYC verification service

## Search for Comments
All mock code is marked with comments:
- `// MOCK MODE:`
- `// MOCK KYC`
- `// TODO: Connect real KYC API`

Search for these comments to find all mock-related code.

## Testing

Users can now:
- Sign up without Aadhaar verification
- Complete onboarding and go directly to dashboard
- Access all features without KYC barriers
- **OR** Visit `/auth/kyc` page and enter:
  - Any 12-digit number as Aadhaar (e.g., 123456789012)
  - Any 6-digit code as OTP (e.g., 123456)
  - System will accept and complete KYC

The KYC page (`/auth/kyc`) is fully functional in mock mode but not part of the default flow.
