# Draft System - Complete Guide

## Overview
The draft system automatically saves your progress when booking shipments, so you can continue later without losing any data.

## ✅ Already Implemented Features

### 1. Auto-Save
- **Saves every 5 seconds** while you're filling the form
- **Saves on page unload** (closing tab, navigating away)
- **Saves on step change** (moving to next/previous step)
- No manual save button needed!

### 2. Draft Storage
- Stored in **browser localStorage**
- **30-day expiration** - drafts auto-delete after 30 days
- **One draft per shipment type** - latest draft overwrites previous
- Survives browser refresh and restart

### 3. Draft Types Supported
- ✅ Gift Shipments (`/book/gift`)
- ✅ Document Shipments (`/book/document`)
- ✅ Medicine Shipments (`/book/medicine`)
- ✅ CXBC Shipments (`/cxbc/book`)

### 4. What Gets Saved
- **All form data** (items, addresses, add-ons, etc.)
- **Current step** (which step you're on)
- **Progress percentage**
- **Timestamps** (created, updated, expires)

### 5. Saved Drafts Page
- View all saved drafts at `/drafts`
- Shows progress percentage
- Shows last edited time
- Shows expiration countdown
- Click "Continue" to resume booking
- Click trash icon to delete draft

## How It Works

### Starting a Booking
1. Go to any booking page (Gift, Document, Medicine)
2. Start filling the form
3. Draft is **automatically created** after 5 seconds
4. You'll see "Draft saved X min ago" at the bottom

### Continuing a Draft
1. Go to "Saved Drafts" page (`/drafts`)
2. Find your draft
3. Click "Continue" button
4. You'll be taken back to the booking page
5. All your data will be **automatically loaded**
6. Continue from where you left off

### Discarding a Draft
**Option 1: From Booking Page**
- Click "Discard" button at top-right
- Confirms before deleting

**Option 2: From Drafts Page**
- Click trash icon next to draft
- Confirms before deleting

**Option 3: Complete Booking**
- When you click "Confirm & Pay"
- Draft is automatically deleted after successful booking

## Testing the Draft System

### Test 1: Auto-Save
1. Go to `/book/gift`
2. Add a gift item
3. Fill some address fields
4. Wait 5 seconds
5. Check browser console: `[Draft] Saved successfully`
6. Go to `/drafts` - you should see your draft

### Test 2: Resume Draft
1. Start a gift booking
2. Fill step 1 and step 2
3. Close the tab
4. Open app again
5. Go to `/drafts`
6. Click "Continue" on your draft
7. You should be on step 2 with all data filled

### Test 3: Multiple Drafts
1. Start a gift booking (fill some data)
2. Start a document booking (fill some data)
3. Start a medicine booking (fill some data)
4. Go to `/drafts`
5. You should see 3 drafts (one for each type)

### Test 4: Draft Expiration
Drafts expire after 30 days automatically. To test:
1. Open browser DevTools → Application → Local Storage
2. Find `courierx_drafts`
3. Check the `expiresAt` date
4. Expired drafts are filtered out automatically

## Draft Data Structure

```json
{
  "id": "draft_1707398400000_abc123xyz",
  "type": "gift",
  "title": "Gift Shipment",
  "data": {
    "items": [...],
    "pickupAddress": {...},
    "consigneeAddress": {...},
    "insurance": false,
    "giftWrapping": false
  },
  "currentStep": 2,
  "totalSteps": 5,
  "createdAt": "2024-02-08T10:00:00.000Z",
  "updatedAt": "2024-02-08T10:05:00.000Z",
  "expiresAt": "2024-03-09T10:00:00.000Z"
}
```

## UI Components

### Draft Card (on Drafts Page)
- **Icon** - Shows shipment type (gift/document/medicine)
- **Title** - "Gift Shipment", "Document Shipment", etc.
- **Progress Bar** - Visual progress (e.g., "40% complete")
- **Step Info** - "Step 2 of 5"
- **Last Edited** - "Last edited 5 min ago"
- **Expiration** - "Expires in 29 days"
- **Continue Button** - Resume booking
- **Delete Button** - Discard draft

### Draft Indicator (on Booking Pages)
- **Save Status** - "Draft saved 2 min ago" or "Saving..."
- **Save Button** - Manual save (optional)
- **Discard Button** - Delete draft

## Browser Storage

### Location
- **localStorage** key: `courierx_drafts`
- Accessible in DevTools → Application → Local Storage

### Size Limit
- localStorage limit: ~5-10MB per domain
- Each draft: ~10-50KB (depending on data)
- Can store ~100-500 drafts (more than enough)

### Privacy
- Stored locally in browser
- Not synced across devices
- Cleared when browser data is cleared
- Not accessible by other websites

## Edge Cases Handled

### 1. Multiple Tabs
- Each tab shares the same localStorage
- Latest save wins (last tab to save overwrites)
- Recommended: Use one tab per booking

### 2. Browser Refresh
- Draft is saved before page unloads
- Data is restored on page load
- No data loss

### 3. Browser Crash
- Last auto-save (within 5 seconds) is preserved
- May lose up to 5 seconds of typing
- Better than losing everything!

### 4. Expired Drafts
- Automatically filtered out
- Cleaned up on next page load
- No manual cleanup needed

### 5. Completed Bookings
- Draft is deleted after successful payment
- Prevents confusion with old drafts
- Keeps drafts list clean

## Troubleshooting

### "No Saved Drafts" showing but I have drafts
1. Check browser console for errors
2. Open DevTools → Application → Local Storage
3. Look for `courierx_drafts` key
4. If empty, drafts were cleared or expired

### Draft not loading when I click Continue
1. Check browser console for errors
2. Verify draft data structure in localStorage
3. Try refreshing the page
4. If still broken, delete draft and start fresh

### Draft not auto-saving
1. Check browser console for save logs
2. Verify localStorage is not full
3. Check if localStorage is disabled (private browsing)
4. Try manual save button

### Lost draft after browser crash
- Only last 5 seconds of data may be lost
- Everything else should be saved
- Check `/drafts` page to verify

## Future Enhancements (Optional)

### Cloud Sync
- Store drafts in Supabase database
- Sync across devices
- Requires user authentication
- More reliable than localStorage

### Draft Sharing
- Share draft link with team members
- Collaborative booking
- Requires backend implementation

### Draft Templates
- Save common bookings as templates
- Quick-start with pre-filled data
- Reusable for similar shipments

### Draft History
- Keep history of deleted drafts
- Restore accidentally deleted drafts
- Requires database storage

## Summary

✅ **Auto-save every 5 seconds**
✅ **Saves on page close**
✅ **30-day expiration**
✅ **Resume from any step**
✅ **Multiple draft types**
✅ **Visual progress tracking**
✅ **Easy to continue or discard**

The draft system is **fully functional** and ready to use. Just start a booking, fill some data, and it will be automatically saved!
