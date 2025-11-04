# Mock Data for UI Demo

## ✅ Mock Data is Now Active!

The application now includes **full mock data functionality** so you can test and demo the entire UI without setting up Supabase first.

## What Works Without Database

### 📱 Customer Portal
- ✅ Name entry and navigation
- ✅ Browse menu by category
- ✅ Add/remove items
- ✅ Place orders (saved in memory)
- ✅ Order confirmation

### 💼 Manager Dashboard
- ✅ View 6 sample orders
- ✅ See real-time statistics
- ✅ Update order status
- ✅ Expand/collapse order details
- ✅ All color-coded statuses

## Sample Mock Orders Included

The app comes pre-loaded with 6 realistic orders:

1. **Rahul Sharma** - 2 Lattes, 1 Mocha (₹634) - Received
2. **Priya Patel** - Cold Coffee, Coke (₹396) - Delivered
3. **Amit Kumar** - 3 Cappuccinos, 2 Hot Chocolates (₹840) - Unpaid
4. **Sneha Reddy** - Cranberry Espresso (₹178) - Paid
5. **Vikram Singh** - 2 Vietnamese Coffee, Iced Mocha (₹574) - Received
6. **Anjali Gupta** - Iced Americano, Redbull (₹426) - Delivered

## How It Works

### Automatic Fallback
The app automatically uses mock data when:
- Supabase is not configured
- Database connection fails
- Environment variables are missing/placeholder

### Console Messages
Watch the terminal for these indicators:
- `📋 Using mock data (Supabase not configured)` - GET orders
- `📝 Adding order to mock data` - POST new order
- `✏️ Updating mock order status` - PATCH order status

## Testing the System

### Test 1: Place New Order
1. Visit `http://localhost:3000/order`
2. Enter any name (e.g., "Test User")
3. Add items to cart
4. Place order
5. Check Manager Dashboard - your order appears!

### Test 2: Manage Orders
1. Visit `http://localhost:3000/manager`
2. See 6 pre-loaded orders + any you created
3. Click any order to expand
4. Change status (Received → Delivered → Unpaid → Paid)
5. Status updates instantly!

### Test 3: Full Customer Flow
1. Open browser in mobile view (F12, toggle device toolbar)
2. Go through complete ordering process
3. Switch to desktop view
4. Open Manager Dashboard
5. See your order and manage it

## Mock Data Features

### In-Memory Storage
- Orders stored in memory during session
- Survives page refreshes within same session
- Resets when server restarts
- New orders get unique IDs

### Realistic Data
- Proper timestamps (relative times)
- Varied order statuses
- Different customers
- Mix of items
- Realistic prices

### Full CRUD Operations
- ✅ CREATE - Place new orders
- ✅ READ - View all orders
- ✅ UPDATE - Change order status
- ✅ DELETE - (Not exposed in UI, but supported)

## Switching to Real Database

When you're ready to use Supabase:

### Step 1: Set Up Supabase
See `DATABASE_SETUP.md` for complete instructions.

### Step 2: Update Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-key-here
```

### Step 3: Restart Server
```bash
npm run dev
```

### Automatic Transition
The app will automatically:
- Detect valid Supabase credentials
- Switch from mock to real database
- Store orders permanently
- No code changes needed!

## Mock Data API

If you need to customize mock data:

### File Location
`lib/mock/orders.ts`

### Available Functions

```typescript
// Get all orders
getMockOrders(): MockOrder[]

// Get single order
getMockOrderById(id: string): MockOrder | undefined

// Add new order
addMockOrder(order: Omit<MockOrder, 'id' | 'created_at'>): MockOrder

// Update status
updateMockOrderStatus(id: string, status: OrderStatus): MockOrder | undefined

// Clear all orders
clearMockOrders(): void

// Reset to defaults
resetMockOrders(): void
```

### Example: Add Custom Order

```typescript
import { addMockOrder } from '@/lib/mock/orders';

const order = addMockOrder({
  customer_name: 'Your Name',
  items: [
    { menu_item_id: 'hot-latte', name: 'Latte', quantity: 1, price: 228 }
  ],
  total_amount: 228,
  status: 'received',
  table_number: 'Table 10'
});
```

## Benefits of Mock Data

### For Development
- ✅ No database setup required
- ✅ Fast iteration and testing
- ✅ Work offline
- ✅ Instant feedback

### For Demo/Presentation
- ✅ Show full functionality immediately
- ✅ Realistic sample data
- ✅ No dependencies
- ✅ Works anywhere

### For Testing
- ✅ Predictable data state
- ✅ Easy to reset
- ✅ No database cleanup needed
- ✅ Fast test execution

## Limitations

### Session-Based
- Data lost on server restart
- Not shared between users
- No persistent history

### No Real-Time Sync
- Updates only when API called
- No WebSocket/Supabase Realtime
- Manual refresh needed

### For Demo Only
- Don't use in production
- No data backup
- Limited scalability

## Next Steps

1. ✅ **Right Now**: Test with mock data
2. 📋 Set up Supabase (when ready)
3. 🔄 Switch to real database
4. 🚀 Deploy to production

---

**Current Status**: Mock data is **ACTIVE** ✅

The app is fully functional for demo and testing purposes without any database configuration!

