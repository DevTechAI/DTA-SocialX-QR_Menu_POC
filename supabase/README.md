# Supabase Setup Instructions

## Database Schema Setup

To set up your Supabase database for the QR Menu POC, follow these steps:

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in your project details:
   - Name: `SocialX QR Menu`
   - Database Password: (choose a strong password)
   - Region: (select closest to your location)
5. Click "Create new project"

### Step 2: Run the Schema SQL

1. In your Supabase project dashboard, go to the **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the contents of `schema.sql` from this directory
4. Paste it into the SQL editor
5. Click "Run" to execute the schema

This will create:
- `orders` table with proper structure and indexes
- `menu_items` table with all menu data
- Row Level Security (RLS) policies
- Automatic timestamp triggers

### Step 3: Get Your API Keys

1. Go to **Project Settings** (gear icon in left sidebar)
2. Click on **API** in the settings menu
3. Copy the following:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Step 4: Configure Environment Variables

1. In your project root, create `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 5: Verify Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test the order flow:
   - Visit `http://localhost:3000/order`
   - Enter a name and proceed to menu
   - Place a test order
   - Visit `http://localhost:3000/manager` to see the order

## Database Tables

### `orders` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| customer_name | TEXT | Name of the customer |
| items | JSONB | Array of ordered items with quantities |
| total_amount | NUMERIC | Total order amount |
| status | TEXT | Order status (received, delivered, paid, unpaid) |
| table_number | TEXT | Optional table number |
| created_at | TIMESTAMP | When order was created |
| updated_at | TIMESTAMP | Last update time (auto-updated) |

### `menu_items` Table

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (e.g., 'hot-latte') |
| name | TEXT | Display name |
| description | TEXT | Item description |
| price | NUMERIC | Price in rupees |
| category | TEXT | HOT, COLD, or NON-COFFEE |
| available | BOOLEAN | Whether item is available |
| created_at | TIMESTAMP | When item was added |
| updated_at | TIMESTAMP | Last update time |

## Optional: Enable Realtime

To get real-time order updates in the manager dashboard:

1. In Supabase dashboard, go to **Database** → **Replication**
2. Find the `orders` table
3. Enable replication for INSERT and UPDATE operations
4. The manager dashboard will automatically receive live updates

## Security Notes

⚠️ **Important for Production:**

The current RLS policy allows all access for development. Before going to production:

1. Set up proper authentication
2. Update RLS policies to restrict access
3. Create separate policies for customers and staff
4. Enable API rate limiting in Supabase settings

## Troubleshooting

### Orders not saving?
- Check that your environment variables are set correctly
- Verify the schema was executed successfully
- Check the browser console for error messages

### Can't see orders in manager?
- Make sure at least one order has been placed
- Check Network tab in browser DevTools for API errors
- Verify Supabase connection in the API routes

### Menu items not loading?
- Ensure the schema.sql INSERT statements ran successfully
- Check the `menu_items` table in Supabase Table Editor
- Verify RLS policies are enabled

## Next Steps

1. Customize menu items in the database
2. Add table number functionality
3. Implement authentication for manager dashboard
4. Add order notifications (email/SMS)
5. Enable realtime updates
6. Add analytics and reporting

