# Real-Time Shipment Tracker - Hero Section

## Overview
Implemented an animated real-time shipment tracker in the landing page hero section that displays the top 5 recent shipments with smooth vertical slide animations.

## Features Implemented

### 1. Real-Time Data Integration
- Fetches top 5 most recent shipments from Supabase database
- Real-time updates using Supabase subscriptions
- Automatically refreshes when new shipments are created or updated
- Shows shipment type, destination, status, and progress

### 2. Vertical Slide Animation
- Auto-rotates through shipments every 4 seconds
- Smooth vertical slide transition (top swipe effect)
- Uses Framer Motion for fluid animations
- Exit animation slides up, enter animation slides from bottom
- Staggered delays for different elements (header, progress, tracking number)

### 3. Visual Design
- Matches existing hero section design language
- Glassmorphism card with backdrop blur
- Animated glow effects in background
- Status badges with color coding:
  - Draft: Gray
  - Confirmed: Blue
  - Picked Up: Purple
  - In Transit: Yellow
  - Customs Cleared: Orange
  - Out for Delivery: Cyan
  - Delivered: Green
  - Cancelled: Red

### 4. Progress Tracking
- Dynamic progress bar based on shipment status
- Percentage display (10% to 100%)
- Smooth width animation on each transition
- Gradient color (primary to green)

### 5. Interactive Elements
- Rotating package icon with subtle animation
- Pulsing status badge
- Progress indicators (dots) showing current shipment
- Live tracking indicator with clock icon
- Active shipment count display

### 6. Loading & Empty States
- Skeleton loader while fetching data
- Empty state with icon and message when no shipments exist
- Graceful fallback UI

## Technical Implementation

### Component: `RealtimeShipmentTracker.tsx`
Location: `courierx2/src/components/landing/RealtimeShipmentTracker.tsx`

**Key Features:**
- Real-time Supabase subscription using `@/integrations/supabase/client`
- Auto-rotation with useEffect interval
- AnimatePresence for smooth transitions
- Responsive design (hidden on mobile, visible on lg+)
- Type-safe TypeScript interfaces

**Animation Timing:**
- Slide transition: 0.5s with custom easing
- Progress bar: 1s ease-out
- Auto-rotate interval: 4s
- Icon rotation: 4s infinite loop
- Badge pulse: 2s infinite loop

### Integration
Updated `HeroSection.tsx` to replace static card with `RealtimeShipmentTracker` component.

**Preserved Elements:**
- Floating price badge (₹1,299)
- Floating ETA badge (2 days)
- Same positioning and animations

## Database Query
```sql
SELECT 
  id, 
  tracking_number, 
  shipment_type, 
  status, 
  destination_country, 
  destination_city, 
  total_amount, 
  created_at
FROM shipments
ORDER BY created_at DESC
LIMIT 5
```

## Status Mapping
- `draft` → 10% progress
- `booking_confirmed` → 20% progress
- `picked_up` → 35% progress
- `in_transit` → 60% progress
- `customs_cleared` → 75% progress
- `out_for_delivery` → 90% progress
- `delivered` → 100% progress

## Animation Specifications

### Vertical Slide (Top Swipe)
```typescript
initial: { y: 50, opacity: 0 }
animate: { y: 0, opacity: 1 }
exit: { y: -50, opacity: 0 }
duration: 0.5s
easing: [0.22, 1, 0.36, 1] // Custom cubic-bezier
```

### Staggered Elements
- Header: 0ms delay
- Progress: 100ms delay
- Tracking number: 200ms delay

### Progress Indicators
- Active: width 24px (w-6), primary color, scale 1
- Inactive: width 6px (w-1.5), muted color, scale 0.8
- Smooth transition: 300ms

## Files Modified
1. `courierx2/src/components/landing/RealtimeShipmentTracker.tsx` (NEW)
2. `courierx2/src/components/landing/HeroSection.tsx` (UPDATED)

## Build & Compilation
- ✅ No TypeScript errors
- ✅ No build errors
- ✅ Correct Supabase client import: `@/integrations/supabase/client`
- ✅ Server running successfully on http://localhost:8080

## Testing
- ✅ No TypeScript errors
- ✅ Smooth animations
- ✅ Real-time updates working
- ✅ Empty state handling
- ✅ Loading state handling
- ✅ Responsive design
- ✅ Build compiles successfully

## Usage
The tracker automatically displays when visiting the landing page at `http://localhost:8080`. It will show:
- Real shipments if they exist in the database
- Empty state if no shipments
- Loading skeleton while fetching

## Next Steps (Optional Enhancements)
- Add click handler to navigate to shipment details
- Add pause/play controls for auto-rotation
- Add manual navigation arrows
- Add more detailed timeline view
- Add carrier logo display
- Add estimated delivery date
