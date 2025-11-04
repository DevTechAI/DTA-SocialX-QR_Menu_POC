# SocialX QR Menu - Feature Documentation

Complete feature list and user flows for the QR Menu POC.

## 🎯 System Overview

The system consists of two main interfaces:
1. **Customer Interface** - Mobile-optimized ordering
2. **Manager Interface** - Desktop/tablet order management

---

## 📱 Customer Interface

### 1. Landing Page (`/order`)

**Purpose:** Customer entry point after scanning QR code

**Features:**
- ✅ SocialX branded header with logo
- ✅ Name entry field (required)
- ✅ "Click for Menu" button
- ✅ Responsive mobile layout
- ✅ "Powered by DevTechAi.Org" footer with link
- ✅ Warm, welcoming color scheme

**User Flow:**
```
Scan QR → Landing Page → Enter Name → Click for Menu → Menu Page
```

**Design Elements:**
- Custom SocialX logo with café theme
- Gradient background (amber/orange/yellow)
- Large, touch-friendly input field
- Clear call-to-action button

---

### 2. Customer Menu Page (`/order/menu`)

**Purpose:** Browse menu and place orders

**Features:**

#### Header Section
- ✅ Personalized greeting: "Hi, [Customer Name]! 👋"
- ✅ Sticky header (stays visible while scrolling)
- ✅ Gradient background matching brand

#### Category Navigation
- ✅ Three expandable categories:
  - HOT ☕
  - COLD 🧊
  - NON-COFFEE 🥤
- ✅ Selected tab indication (highlighted)
- ✅ Horizontal scroll on smaller screens
- ✅ Smooth transitions between categories

#### Menu Items Display
- ✅ Item name and description
- ✅ Price in rupees (₹)
- ✅ Add/Remove quantity controls
- ✅ Visual quantity indicator
- ✅ "Add +" button for new items
- ✅ Touch-optimized +/− buttons

#### Order Summary (Fixed Bottom)
- ✅ Total items count
- ✅ Total amount
- ✅ Breakdown of selected items
- ✅ Item quantities and subtotals

#### Action Buttons
- ✅ **Call Waiter** button
  - Shows "Help Requested" confirmation
  - Auto-dismisses after 3 seconds
  - Blue color scheme
- ✅ **Place Order** button
  - Gradient amber/orange
  - Disabled when cart is empty
  - Submits order to database

#### Order Confirmation
- ✅ Success screen with checkmark
- ✅ "Cooking in Progress" status
- ✅ "Start New Order" button
- ✅ Redirects to landing page

**User Flow:**
```
Menu Page → Browse Categories → Add Items → 
Call Waiter (optional) → Place Order → Confirmation → 
Start New Order
```

**Design Details:**
- Card-based layout for items
- Quantity controls with clear visibility
- Fixed bottom bar for order summary
- Smooth animations and transitions
- Mobile-first responsive design

---

## 💼 Manager Interface

### 3. Order Manager Dashboard (`/manager`)

**Purpose:** Staff order management and tracking

**Features:**

#### Top Statistics Bar
- ✅ **Total Order Value (Today)** - Sum of all today's orders
- ✅ **Number of Orders** - Count of orders placed today
- ✅ **Amount Settled** - Total of paid orders
- ✅ Real-time updates
- ✅ Gradient header (amber to orange)

#### Order Cards Grid
- ✅ Responsive grid layout (1-2 columns)
- ✅ Color-coded by status:
  - 🟨 **Yellow** (bg-yellow-100) - Received
  - 🟩 **Light Green** (bg-green-100) - Delivered
  - ⬜ **Light Grey** (bg-gray-100) - Paid
  - 🟧 **Light Red/Orange** (bg-red-100) - Unpaid

#### Order Card Header (Collapsed)
- ✅ Customer name
- ✅ Status badge
- ✅ Order time
- ✅ Number of items
- ✅ Total amount
- ✅ Click to expand indicator

#### Order Card Details (Expanded)
- ✅ Full list of ordered items
- ✅ Item quantities
- ✅ Item subtotals
- ✅ Total order amount
- ✅ Status update buttons (4 options)

#### Status Update Buttons
- ✅ **⏳ Received** (Yellow)
- ✅ **✅ Delivered** (Green)
- ✅ **💳 Unpaid** (Red/Orange)
- ✅ **💰 Paid** (Grey)
- ✅ One-click status change
- ✅ Visual feedback on current status

#### Auto-Refresh
- ✅ Polls for new orders every 10 seconds
- ✅ Seamless updates without page reload
- ✅ Maintains expanded/collapsed state

**User Flow:**
```
Dashboard → View Orders → Click Order → 
See Details → Update Status → Continue Managing
```

**Design Details:**
- Desktop/tablet optimized layout
- Card-based design with shadows
- Color psychology for status indication
- Quick-access status buttons
- Expandable/collapsible cards
- Real-time statistics

---

## 🔄 Order Status Workflow

### Status Definitions

1. **Received** (Yellow)
   - Order just placed by customer
   - Waiting to be prepared
   - Initial status for all orders

2. **Delivered** (Light Green)
   - Food prepared and served
   - Customer is consuming
   - Ready for payment

3. **Unpaid** (Light Red/Orange)
   - Service complete
   - Payment not yet received
   - Needs attention

4. **Paid** (Light Grey)
   - Transaction complete
   - Order fully settled
   - Final status

### Typical Flow
```
Received → Delivered → Unpaid → Paid
   ↓          ↓          ↓        ↓
 Yellow → Light Green → Red → Grey
```

---

## 🎨 Design System

### Color Palette

**Primary Colors:**
- Amber: #F59E0B, #FBBF24
- Orange: #F97316, #FB923C
- Yellow: #FCD34D

**Status Colors:**
- Received: #FEF3C7 (yellow-100), #F59E0B (yellow-400)
- Delivered: #D1FAE5 (green-100), #34D399 (green-400)
- Paid: #F3F4F6 (gray-100), #9CA3AF (gray-400)
- Unpaid: #FEE2E2 (red-100), #F87171 (red-400)

**Text Colors:**
- Primary: #1F2937 (gray-800)
- Secondary: #6B7280 (gray-600)
- Light: #F9FAFB (gray-50)

### Typography
- Headings: Bold, sans-serif
- Logo: Cursive style
- Subtitle: Georgia, serif, italic
- Body: Default sans-serif

### Spacing
- Mobile padding: 4 (1rem)
- Card padding: 6-8 (1.5-2rem)
- Component gaps: 3-4 (0.75-1rem)

---

## 🔐 Data Structure

### Order Object
```typescript
{
  id: string (UUID)
  customer_name: string
  items: Array<{
    menu_item_id: string
    name: string
    quantity: number
    price: number
  }>
  total_amount: number
  status: 'received' | 'delivered' | 'paid' | 'unpaid'
  table_number?: string
  created_at: timestamp
  updated_at: timestamp
}
```

### Menu Item Object
```typescript
{
  id: string
  name: string
  description: string
  price: number
  category: 'HOT' | 'COLD' | 'NON-COFFEE'
  available: boolean
}
```

---

## 📊 Analytics & Tracking

### Manager Dashboard Metrics

1. **Total Order Value**
   - Sum of all order amounts for current day
   - Updates in real-time
   - Currency format: ₹

2. **Number of Orders**
   - Count of orders placed today
   - Includes all statuses
   - Integer display

3. **Amount Settled**
   - Sum of orders with "paid" status
   - Today's completed transactions
   - Currency format: ₹

### Future Enhancement Ideas
- Order completion time tracking
- Peak hour analysis
- Popular item statistics
- Customer satisfaction ratings
- Daily/weekly/monthly reports
- Revenue trends

---

## 🚀 Technical Implementation

### Frontend
- Next.js 14 App Router
- React Server Components
- Client-side state management
- LocalStorage for customer name
- Responsive CSS (Tailwind)

### Backend
- Next.js API Routes
- Supabase PostgreSQL
- RESTful endpoints
- JSON data format
- Server-side validation

### Real-time Features
- Auto-refresh polling (10s interval)
- Optimistic UI updates
- Error handling with fallbacks
- Demo data when offline

---

## 🔮 Future Enhancements

### Customer Features
- [ ] Table number selection
- [ ] Order history
- [ ] Favorites/Quick reorder
- [ ] Special instructions per item
- [ ] Allergen information
- [ ] Nutritional data
- [ ] Multiple language support
- [ ] Order modification before confirmation
- [ ] Estimated preparation time

### Manager Features
- [ ] Staff authentication
- [ ] Role-based permissions
- [ ] Kitchen display integration
- [ ] Print receipts
- [ ] Push notifications for new orders
- [ ] Order search and filtering
- [ ] Export reports (CSV/PDF)
- [ ] Inventory management
- [ ] Staff performance metrics
- [ ] Customer database

### System Enhancements
- [ ] Payment gateway integration
- [ ] SMS/Email notifications
- [ ] Supabase Realtime subscriptions
- [ ] PWA (Progressive Web App)
- [ ] Offline mode
- [ ] Multi-location support
- [ ] Custom branding per location
- [ ] Loyalty program integration
- [ ] Table availability status
- [ ] Reservation system

---

## 📱 Mobile Responsiveness

### Breakpoints
- **Mobile**: < 768px (primary focus)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Optimizations
- Touch targets: minimum 44x44px
- Fixed bottom navigation
- Sticky headers
- Swipe gestures (future)
- Safe area insets for iOS
- Viewport optimization

### Desktop Optimizations
- Multi-column layouts
- Hover states
- Keyboard navigation
- Larger font sizes
- More information density

---

## ✅ Accessibility

### Current Features
- Semantic HTML
- ARIA labels on buttons
- Focus states
- Keyboard navigation
- Color contrast ratios
- Touch-friendly sizing

### Future Improvements
- Screen reader optimization
- High contrast mode
- Reduced motion option
- Font size controls
- Voice ordering (future)

---

This feature documentation covers all implemented functionality in the current version of the SocialX QR Menu POC.

