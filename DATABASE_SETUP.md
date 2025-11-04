# Database Tables Required for SocialX QR Menu

## Quick Reference

You need **2 tables** in your Supabase database:

### 1. `orders` (Required)
### 2. `menu_items` (Optional - hardcoded in app)

---

## Table 1: `orders` (REQUIRED)

This table stores all customer orders.

### Schema

```sql
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  items JSONB NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  table_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

### Column Details

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Auto | Primary key (auto-generated) |
| `customer_name` | TEXT | Yes | Name entered by customer |
| `items` | JSONB | Yes | Array of ordered items with details |
| `total_amount` | NUMERIC | Yes | Total order value in rupees |
| `status` | TEXT | Yes | `received`, `delivered`, `paid`, `unpaid` |
| `table_number` | TEXT | No | Optional table identifier |
| `created_at` | TIMESTAMP | Auto | When order was placed |
| `updated_at` | TIMESTAMP | Auto | Last modification time |

### Example `items` JSONB Structure

```json
[
  {
    "menu_item_id": "hot-latte",
    "name": "Latte",
    "quantity": 2,
    "price": 228
  },
  {
    "menu_item_id": "hot-mocha",
    "name": "Mocha",
    "quantity": 1,
    "price": 178
  }
]
```

### Indexes

```sql
-- For faster order retrieval
CREATE INDEX orders_created_at_idx ON orders (created_at DESC);

-- For filtering by status
CREATE INDEX orders_status_idx ON orders (status);
```

---

## Table 2: `menu_items` (OPTIONAL)

Menu items are currently **hardcoded** in `lib/data/menu-items.ts`. This table is optional if you want to manage menu via database.

### Schema

```sql
CREATE TABLE menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

### Column Details

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | TEXT | Yes | Unique item ID (e.g., 'hot-latte') |
| `name` | TEXT | Yes | Display name (e.g., 'Latte') |
| `description` | TEXT | No | Item description |
| `price` | NUMERIC | Yes | Price in rupees |
| `category` | TEXT | Yes | `HOT`, `COLD`, or `NON-COFFEE` |
| `available` | BOOLEAN | Yes | Whether item is available |
| `created_at` | TIMESTAMP | Auto | When item was added |
| `updated_at` | TIMESTAMP | Auto | Last modification time |

### Sample Data

```sql
INSERT INTO menu_items (id, name, description, price, category) VALUES
  ('hot-latte', 'Latte', 'espresso + more milk, less coffee more milk', 228, 'HOT'),
  ('hot-cappuccino', 'Cappuccino', 'espresso + less foam, stronger than latte', 228, 'HOT'),
  ('hot-mocha', 'Mocha', 'espresso + homemade chocolate + milk, our recommendation', 178, 'HOT'),
  -- ... (see supabase/schema.sql for complete list)
```

---

## Quick Setup Instructions

### Step 1: Go to Supabase Dashboard

1. Visit https://supabase.com
2. Sign in and open your project
3. Navigate to **SQL Editor** (left sidebar)

### Step 2: Run the Schema

1. Click "New Query"
2. Copy **all contents** from `supabase/schema.sql` file
3. Click **"Run"**

This will create:
- Both tables
- All indexes
- Row Level Security (RLS) policies
- Auto-update triggers
- Sample menu data

### Step 3: Verify Tables

1. Go to **Table Editor** (left sidebar)
2. You should see:
   - `orders` table (empty initially)
   - `menu_items` table (with 13 items)

### Step 4: Get API Keys

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (long JWT token)

### Step 5: Update Environment Variables

Create/update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-key-here
```

### Step 6: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## Testing Database Connection

### Test 1: Check API Endpoint

```bash
curl http://localhost:3000/api/orders
```

Should return: `[]` (empty array) or mock data

### Test 2: Place Test Order

1. Visit: `http://localhost:3000/order`
2. Enter name and browse menu
3. Add items and place order
4. Check Supabase Table Editor → `orders` table
5. Your order should appear!

### Test 3: Manager Dashboard

1. Visit: `http://localhost:3000/manager`
2. Should show the order you just placed
3. Click to expand order details
4. Update status and verify it saves

---

## Troubleshooting

### Orders Not Saving

**Check:**
- Environment variables are correct
- `.env.local` file exists in project root
- Supabase project is active (not paused)
- RLS policies allow inserts

**Quick Fix:**
In Supabase SQL Editor, run:
```sql
-- Temporarily disable RLS for testing
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

### Can't See Orders in Manager

**Check:**
- At least one order was placed
- Browser console for errors (F12)
- Network tab shows successful API call

**Quick Fix:**
App automatically falls back to mock data if database fails.

### Menu Items Not Loading

Menu items are hardcoded in the app, so this shouldn't happen. If using database:

**Check:**
- `menu_items` table exists
- INSERT statements ran successfully
- Table has 13 rows

---

## Data Management

### View Orders

```sql
SELECT * FROM orders ORDER BY created_at DESC;
```

### Count Today's Orders

```sql
SELECT COUNT(*) FROM orders 
WHERE created_at::date = CURRENT_DATE;
```

### Total Revenue Today

```sql
SELECT SUM(total_amount) FROM orders 
WHERE created_at::date = CURRENT_DATE 
AND status = 'paid';
```

### Clear Test Orders

```sql
DELETE FROM orders WHERE customer_name LIKE 'Test%';
```

### Reset Database

```sql
TRUNCATE TABLE orders;
-- Or drop and recreate:
-- DROP TABLE orders CASCADE;
-- Then run schema.sql again
```

---

## Production Checklist

Before going live:

- [ ] Update RLS policies for proper security
- [ ] Set up database backups in Supabase
- [ ] Enable database replication
- [ ] Add proper error logging
- [ ] Set up monitoring/alerts
- [ ] Test with real payment flow
- [ ] Add rate limiting to API
- [ ] Implement staff authentication
- [ ] Set up SSL/HTTPS only
- [ ] Test on multiple devices

---

## Need Help?

- **Schema File**: `supabase/schema.sql`
- **Setup Guide**: `SETUP_GUIDE.md`
- **Supabase Docs**: https://supabase.com/docs
- **Mock Data**: App works without database for testing

---

**Note:** The app includes mock data functionality, so you can test the UI completely before setting up Supabase!

