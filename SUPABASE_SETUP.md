# Supabase Setup Instructions

This document provides step-by-step instructions for setting up the Supabase database for the SocialX QR Menu POC.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created
3. Access to your Supabase project dashboard

## Step 1: Run the Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy the entire contents of `supabase/schema.sql`
5. Paste it into the SQL Editor
6. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)

This will create:
- `authorized_emails` table (for role-based access)
- `orders` table (for customer orders)
- `menu_items` table (for menu catalog)
- All necessary indexes, triggers, and RLS policies

## Step 2: Add Your Initial Superadmin

After running the schema, you need to add your email as a superadmin:

1. In the SQL Editor, run:
```sql
INSERT INTO authorized_emails (email, role) VALUES
  ('your-email@gmail.com', 'superadmin');
```

Replace `'your-email@gmail.com'` with your actual email address.

## Step 3: Create User Account in Supabase Auth

1. Go to **Authentication** → **Users** (left sidebar)
2. Click **"Add User"** or **"Invite User"**
3. Enter the same email you used in Step 2
4. Set a password (or use "Send magic link" for passwordless)
5. Click **"Create User"**

## Step 4: Configure Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

To find these values:
1. Go to **Project Settings** → **API** (left sidebar)
2. Copy the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy the **anon/public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 5: Add More Managers (Optional)

To add additional managers, run in SQL Editor:

```sql
INSERT INTO authorized_emails (email, role) VALUES
  ('manager1@gmail.com', 'manager'),
  ('manager2@gmail.com', 'manager');
```

Then create user accounts for them in **Authentication** → **Users**.

## Step 6: Verify Setup

1. Check that all tables exist:
   - Go to **Table Editor** (left sidebar)
   - You should see: `authorized_emails`, `orders`, `menu_items`

2. Check that menu items are populated:
   - Open the `menu_items` table
   - You should see 13 sample menu items

3. Test authentication:
   - Visit `/auth/signin` in your app
   - Sign in with your superadmin email
   - You should be redirected to `/admin`

## Troubleshooting

### "Table doesn't exist" error
- Make sure you ran the entire `schema.sql` file
- Check that you're in the correct database/project

### "Unauthorized" error when signing in
- Verify your email exists in `authorized_emails` table
- Check that the email matches exactly (case-sensitive)
- Ensure you created a user account in Supabase Auth

### RLS policies blocking access
- The current policies use service role for simplicity
- In production, you may need to adjust RLS policies based on your security requirements
- Check **Authentication** → **Policies** for any conflicting policies

## Role Hierarchy

- **user**: Default role for all authenticated users (no special access)
- **manager**: Can access `/admin`, manage orders, and edit menu items
- **superadmin**: Full access to all features (same as manager, but can manage authorized emails)

## Security Notes

1. **RLS Policies**: The current setup uses permissive policies for development. For production:
   - Tighten RLS policies to check `auth.uid()` properly
   - Remove service role policies if not needed
   - Add proper role checks in policies

2. **Environment Variables**: Never commit `.env.local` to version control

3. **API Keys**: The `anon` key is safe for client-side use, but ensure RLS policies are properly configured

## Next Steps

After setup:
1. Test the admin dashboard at `/admin`
2. Test the menu editor at `/admin/menu`
3. Create test orders from the customer menu
4. Verify order management in the admin dashboard

