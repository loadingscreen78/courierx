# Rate Calculator → Auth → Booking Form Redirect Fix

## Problem
When users clicked "Book This Shipment" in the rate calculator:
1. Selected shipment type (Gift/Medicine/Document)
2. Clicked "Book This Shipment"
3. Got redirected to /auth to sign in
4. After signing in, went to /dashboard instead of the specific booking form

## Root Cause
The Auth component had TWO redirect handlers:
1. `useEffect` hook that runs automatically when user is authenticated
2. `handleEmailAuth` function that runs after email sign-in

Both were checking for `authReturnUrl` but the `useEffect` was running FIRST and sometimes redirecting to dashboard before checking the return URL properly.

## Solution
Updated BOTH redirect handlers to prioritize the return URL from rate calculator:

### Changes Made:

#### 1. Updated `useEffect` redirect handler
```typescript
// PRIORITY 1: Check for return URL from rate calculator FIRST
const returnUrl = localStorage.getItem('authReturnUrl');

if (selectedPanel === 'customer') {
  // ... profile checks ...
  if (returnUrl) {
    console.log('[Auth useEffect] Redirecting to return URL:', returnUrl);
    localStorage.removeItem('authReturnUrl');
    router.replace(returnUrl);
  } else {
    router.replace(from || '/dashboard');
  }
}
```

#### 2. Updated `handleEmailAuth` redirect handler
```typescript
// PRIORITY 1: Check for return URL from rate calculator
const returnUrl = localStorage.getItem('authReturnUrl');
if (returnUrl) {
  console.log('[Auth] Redirecting to return URL from rate calculator:', returnUrl);
  localStorage.removeItem('authReturnUrl');
  window.location.href = returnUrl;
} else {
  console.log('[Auth] No return URL, redirecting to dashboard');
  window.location.href = from || '/dashboard';
}
```

## How It Works Now

### User Flow:
1. **Landing Page** → User goes to rate calculator
2. **Rate Calculator** → User selects:
   - Destination country (e.g., United Kingdom)
   - Weight (e.g., 500g)
   - Shipment type (Gift/Medicine/Document)
3. **Click "Book This Shipment"**:
   - Rate calculator saves: `localStorage.setItem('authReturnUrl', '/book/gift')`
   - Rate calculator saves: `localStorage.setItem('rateCalculatorBooking', JSON.stringify({...}))`
   - Redirects to: `/auth?panel=customer`
4. **Auth Page** → User signs in
5. **After Sign-In**:
   - Auth checks: `localStorage.getItem('authReturnUrl')` → finds `/book/gift`
   - Redirects to: `/book/gift`
   - Removes: `localStorage.removeItem('authReturnUrl')`
6. **Booking Form** → Opens with pre-filled data:
   - Destination country: United Kingdom
   - Weight: 500g
   - Shows toast: "Loaded data from rate calculator"

## Data Flow

### Rate Calculator Saves:
```javascript
// Return URL for redirect after auth
localStorage.setItem('authReturnUrl', '/book/gift');

// Booking data for pre-filling form
localStorage.setItem('rateCalculatorBooking', JSON.stringify({
  destinationCountry: 'United Kingdom',
  weight: 0.5,
  shipmentType: 'gift',
  selectedCarrier: 'DHL',
  estimatedCost: 3558
}));
```

### Auth Component Reads:
```javascript
const returnUrl = localStorage.getItem('authReturnUrl');
// Returns: '/book/gift'
```

### Booking Form Reads:
```javascript
const rateCalculatorData = localStorage.getItem('rateCalculatorBooking');
// Returns: { destinationCountry: 'United Kingdom', weight: 0.5, ... }
```

## Testing Steps

1. **Go to landing page**: http://localhost:8080
2. **Scroll to rate calculator section**
3. **Select**:
   - Country: United Kingdom
   - Weight: 500g
   - Type: Gift
4. **Click "Book This Shipment"** on DHL card
5. **Should redirect to**: `/auth?panel=customer`
6. **Sign in** with your credentials
7. **Should redirect to**: `/book/gift` (NOT /dashboard)
8. **Check form**:
   - Destination country should be pre-filled: "United Kingdom"
   - Toast should show: "Loaded data from rate calculator"

## Console Logs to Check

Open browser console (F12) and look for:
```
[Auth] Redirecting to return URL from rate calculator: /book/gift
```

Or:
```
[Auth useEffect] Redirecting to return URL: /book/gift
```

## Files Modified
- ✅ `courierx2/src/views/Auth.tsx` - Fixed both redirect handlers

## Related Files (No Changes Needed)
- `courierx2/src/views/RateCalculator.tsx` - Already saving authReturnUrl correctly
- `courierx2/src/views/GiftBooking.tsx` - Already reading rateCalculatorBooking correctly
- `courierx2/src/views/MedicineBooking.tsx` - Already reading rateCalculatorBooking correctly
- `courierx2/src/views/DocumentBooking.tsx` - Already reading rateCalculatorBooking correctly

## Status
✅ **FIXED** - Users will now be redirected to the correct booking form after sign-in!
