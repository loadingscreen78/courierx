# CourierX Admin Panel - Complete Documentation

## 🎨 Color Palette

### Design Philosophy: 60-30-10 Rule
CourierX follows a premium, elegant design system with a strict 60-30-10 color distribution:

### Brand Colors

#### Primary Colors (60% - Backgrounds)
- **Paper White**: `#FAFAF8` / `hsl(40 33% 98%)`
  - Main background color
  - Card backgrounds
  - Primary surfaces
  - Usage: 60% of the interface

#### Secondary Colors (30% - Text & Borders)
- **Charcoal**: `#262626` / `hsl(0 0% 15%)`
  - Primary text color
  - Dark elements
  - Borders and dividers
  - Usage: 30% of the interface

- **Pencil Black**: `#2D2D2D` / `hsl(0 0% 18%)`
  - Secondary text
  - Subtle dark elements

#### Accent Colors (10% - CTAs & Highlights)
- **Coke Red**: `#F40000` / `hsl(0 100% 48%)`
  - Primary CTA buttons
  - Links and interactive elements
  - Highlights and accents
  - Error/destructive actions
  - Usage: 10% of the interface (sparingly for impact)

#### Supporting Colors
- **Candlestick Green**: `hsl(145 40% 45%)`
  - Success states
  - Positive indicators
  - Confirmation messages

- **Warning Orange**: `hsl(38 92% 50%)`
  - Warning states
  - Caution indicators

### Dark Mode Colors
- **Background**: `#141414` / `hsl(0 0% 8%)`
- **Card**: `hsl(0 0% 11%)`
- **Text**: Paper White variations for readability
- **Accent**: Same Coke Red for consistency

### Sidebar Colors
- **Background**: `hsl(0 0% 12%)` with gradient to `hsl(200 18% 16%)`
- **Text**: Paper White `hsl(40 20% 95%)`
- **Active/Hover**: Coke Red `hsl(0 100% 48%)`
- **Border**: `hsl(0 0% 20%)`

---

## 📱 Admin Panel Features & Pages

### 1. Dashboard (`/admin`)
**File**: `app/admin/page.tsx` → `src/views/admin/AdminDashboard.tsx`

**Features**:
- Overview statistics
- Recent shipments
- Quick actions
- Performance metrics
- Real-time updates

**Access**: Requires `admin` or `warehouse_operator` role

---

### 2. All Shipments (`/admin/shipments`)
**File**: `app/admin/shipments/page.tsx` → `src/views/admin/AllShipments.tsx`

**Features**:
- View all shipments across the system
- Filter by status, date, type
- Search by tracking number
- Bulk actions
- Export functionality
- Status updates

**Shipment Types**:
- Medicine shipments
- Document shipments
- Gift shipments

**Status Management**:
- Booking confirmed
- Picked up
- In transit
- Out for delivery
- Delivered
- Failed delivery
- Returned

---

### 3. Inbound Station (`/admin/inbound`)
**File**: `app/admin/inbound/page.tsx` → `src/views/admin/InboundStation.tsx`

**Features**:
- Receive incoming shipments
- Scan and verify packages
- Update shipment status
- Assign to warehouse locations
- Generate inbound reports
- Quality check initiation

**Workflow**:
1. Scan shipment barcode/tracking number
2. Verify package details
3. Check for damage
4. Update status to "received"
5. Assign storage location
6. Trigger QC if needed

---

### 4. Outbound Manifest (`/admin/outbound`)
**File**: `app/admin/outbound/page.tsx` → `src/views/admin/OutboundManifest.tsx`

**Features**:
- Create outbound manifests
- Assign shipments to carriers
- Generate shipping labels
- Print manifests
- Track dispatch status
- Carrier handover documentation

**Workflow**:
1. Select shipments for dispatch
2. Group by destination/carrier
3. Generate manifest
4. Print labels and documents
5. Mark as dispatched
6. Update tracking information

---

### 5. QC Workbench (`/admin/qc`)
**File**: `app/admin/qc/page.tsx` → `src/views/admin/QCWorkbench.tsx`

**Features**:
- Quality control dashboard
- Pending QC shipments list
- Quick QC actions
- Issue flagging
- Approval/rejection workflow
- QC history and reports

**QC Checks**:
- Package integrity
- Weight verification
- Dimensions check
- Label accuracy
- Documentation completeness
- Prohibited items screening

---

### 6. QC Detail (`/admin/qc/[shipmentId]`)
**File**: `app/admin/qc/[shipmentId]/page.tsx` → `src/views/admin/QCDetail.tsx`

**Features**:
- Detailed shipment inspection
- Photo upload for issues
- Checklist completion
- Notes and comments
- Approve/reject with reasons
- Re-inspection requests

**Inspection Points**:
- Physical condition
- Weight accuracy
- Dimensions accuracy
- Label quality
- Documentation
- Contents verification (if applicable)

---

### 7. CXBC Partner Management (`/admin/cxbc-partners`)
**File**: `app/admin/cxbc-partners/page.tsx` → `src/views/admin/CXBCPartnerManagement.tsx`

**Features**:
- View all CXBC partner applications
- Approve/reject applications
- Manage partner accounts
- Set commission rates
- View partner performance
- Suspend/activate partners

**Partner Status**:
- Pending review
- Approved
- Rejected
- Active
- Suspended

**Actions**:
- Review KYC documents
- Verify business information
- Set pricing tiers
- Manage permissions
- View transaction history

---

### 8. Role Management (`/admin/roles`)
**File**: `app/admin/roles/page.tsx` → `src/views/admin/RoleManagement.tsx`

**Features**:
- Manage user roles
- Assign admin privileges
- Create warehouse operators
- View role assignments
- Audit role changes

**Available Roles**:
- `admin`: Full system access
- `warehouse_operator`: Warehouse operations access
- `user`: Regular customer (default)

**Actions**:
- Add admin role to users
- Remove admin privileges
- Promote to warehouse operator
- View role history

---

### 9. Medicine Booking (Admin) (`/admin/book/medicine`)
**File**: `app/admin/book/medicine/page.tsx` → `src/views/admin/AdminMedicineBooking.tsx`

**Features**:
- Book medicine shipments on behalf of customers
- Bypass wallet requirements
- Direct booking without payment
- Full access to all booking features
- Override restrictions

**Use Cases**:
- Customer service bookings
- Bulk bookings
- Special arrangements
- Emergency shipments

---

## 🔐 Authentication & Authorization

### Admin Access Requirements
1. **User Account**: Must have valid Supabase auth account
2. **Admin Role**: Entry in `user_roles` table with role = `admin` or `warehouse_operator`
3. **RLS Policies**: Row-level security allows users to view their own roles

### Login Flow
1. Navigate to `/auth?panel=admin`
2. Enter email/password
3. System checks `user_roles` table
4. If admin role exists → redirect to `/admin`
5. If no admin role → "Access Denied" + sign out

### Adding Admin Role (SQL)
```sql
-- Add admin role to user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('user-id-here', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify role
SELECT ur.role, au.email 
FROM user_roles ur 
JOIN auth.users au ON au.id = ur.user_id 
WHERE au.email = 'admin@example.com';
```

---

## 🎯 Design System

### Typography
- **Headings**: Courier Prime (Typewriter font)
- **Body**: Inter (Clean sans-serif)
- **Monospace**: Courier New (for tracking numbers, codes)

### Spacing
- Mobile-first responsive design
- Safe area insets for mobile devices
- Consistent padding and margins
- Grid-based layouts

### Components
- **Cards**: Glass morphism effect with backdrop blur
- **Buttons**: Metallic effect with press animation
- **Inputs**: Premium focus states with Coke Red ring
- **Badges**: Color-coded status indicators
- **Modals**: Centered with backdrop blur
- **Tables**: Responsive with horizontal scroll
- **Sidebar**: Fixed desktop, bottom nav mobile

### Animations
- Fade in/out
- Slide up/down
- Scale in
- Shimmer loading
- Pulse notifications
- Hover lift effects
- Smooth transitions (200-300ms)

### Effects
- **Glass Morphism**: Frosted glass effect for overlays
- **Metallic**: Light/dark metallic gradients for premium feel
- **Glow**: Subtle glow on interactive elements
- **Shadow**: Layered shadows for depth
- **Gradient**: Subtle gradients for visual interest

---

## 📊 Database Tables (Admin-Related)

### `user_roles`
```sql
- id: uuid (primary key)
- user_id: uuid (references auth.users)
- role: app_role enum ('admin', 'warehouse_operator', 'user')
- created_at: timestamp
```

### `shipments`
Main shipments table with columns:
- tracking_number
- status
- shipment_type
- user_id
- origin/destination details
- carrier information
- timestamps

### `medicine_shipments`
Medicine-specific details:
- prescription documents
- medicine details
- regulatory information

### `document_shipments`
Document-specific details:
- document type
- page count
- special handling

### `gift_shipments`
Gift-specific details:
- item descriptions
- customs declarations
- HSN codes

### `cxbc_partners`
Partner management:
- business information
- KYC documents
- status
- commission rates

---

## 🚀 Performance Optimizations

### CSS Performance
- Hardware acceleration with `translateZ(0)`
- `will-change` for animated properties
- `backface-visibility: hidden` to prevent flickering
- `contain: layout style paint` for isolation
- Debounced inputs for search/filters

### React Performance
- Lazy loading for routes
- Code splitting
- Memoization for expensive computations
- Virtual scrolling for large lists
- Optimistic UI updates

---

## 🔧 Admin Panel Routes Summary

| Route | Component | Access | Purpose |
|-------|-----------|--------|---------|
| `/admin` | AdminDashboard | Admin/Operator | Main dashboard |
| `/admin/shipments` | AllShipments | Admin/Operator | All shipments view |
| `/admin/inbound` | InboundStation | Admin/Operator | Receive shipments |
| `/admin/outbound` | OutboundManifest | Admin/Operator | Dispatch shipments |
| `/admin/qc` | QCWorkbench | Admin/Operator | Quality control list |
| `/admin/qc/[id]` | QCDetail | Admin/Operator | QC inspection detail |
| `/admin/cxbc-partners` | CXBCPartnerManagement | Admin only | Partner management |
| `/admin/roles` | RoleManagement | Admin only | User role management |
| `/admin/book/medicine` | AdminMedicineBooking | Admin/Operator | Admin medicine booking |

---

## 📝 Notes

### Mobile Responsiveness
- All admin pages are mobile-responsive
- Bottom navigation on mobile
- Fixed sidebar on desktop
- Touch-friendly buttons and inputs
- Swipe gestures where applicable

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus indicators
- Screen reader support

### Security
- Row-level security (RLS) on all tables
- Role-based access control
- Secure file uploads
- Input validation
- XSS protection

---

## 🎨 Color Usage Guidelines

### Do's ✅
- Use Paper White for main backgrounds (60%)
- Use Charcoal for text and borders (30%)
- Use Coke Red sparingly for CTAs and accents (10%)
- Maintain contrast ratios for accessibility
- Use consistent color tokens from design system

### Don'ts ❌
- Don't overuse Coke Red (breaks 60-30-10 rule)
- Don't use random colors outside the palette
- Don't use low-contrast color combinations
- Don't mix color systems (stick to HSL tokens)
- Don't forget dark mode variants

---

## 🔄 Status Color Coding

- **Success/Delivered**: Candlestick Green
- **Warning/Pending**: Warning Orange
- **Error/Failed**: Coke Red
- **Info/In Transit**: Blue (muted)
- **Neutral/Draft**: Gray (muted)

---

This documentation provides a complete overview of the CourierX admin panel, its color system, features, and implementation details.
