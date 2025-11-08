# Supabase Setup Checklist ✅

Follow these steps in order to set up your Supabase database for the SocialX QR Menu POC.

## Step 1: Run the Database Schema

1. **Go to SQL Editor**
   - In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
   - Click **"New Query"** button (top right)

2. **Copy and Run the Schema**
   - Open the file: `supabase/schema.sql` in your project
   - Copy **ALL** the contents (Ctrl+A, Ctrl+C / Cmd+A, Cmd+C)
   - Paste into the SQL Editor
   - Click **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)

3. **Verify Success**
   - You should see: "Success. No rows returned" or similar success message
   - If you see errors, check the error message and fix any issues

---

## Step 2: Verify Tables Were Created

1. **Go to Table Editor**
   - Click **"Table Editor"** in the left sidebar
   - You should see 3 tables:
     - ✅ `authorized_emails`
     - ✅ `orders`
     - ✅ `menu_items`

2. **Check Menu Items**
   - Click on `menu_items` table
   - You should see 13 sample menu items already inserted
   - If empty, the schema insert might have failed (check for conflicts)

---

## Step 3: Add Your Superadmin Email

1. **Go back to SQL Editor**
   - Click **"SQL Editor"** → **"New Query"**

2. **Run this SQL** (replace with YOUR email):
   ```sql
   INSERT INTO authorized_emails (email, role) VALUES
     ('your-email@gmail.com', 'superadmin');
   ```
   **⚠️ IMPORTANT:** Replace `'your-email@gmail.com'` with your actual email address

3. **Verify Insert**
   - Go to **Table Editor** → `authorized_emails`
   - You should see your email with role `superadmin`

---

## Step 4: Create User Account in Supabase Auth

1. **Go to Authentication**
   - Click **"Authentication"** in the left sidebar
   - Click **"Users"** tab

2. **Add User**
   - Click **"Add User"** or **"Invite User"** button
   - Enter the **SAME email** you used in Step 3
   - Choose one:
     - **Option A:** Set a password manually
     - **Option B:** Use "Send magic link" (passwordless)
   - Click **"Create User"** or **"Send Invite"**

3. **Verify User Created**
   - You should see your user in the Users list
   - Status should be "Active"

---

## Step 5: Get Your API Keys

1. **Go to Project Settings**
   - Click the **gear icon** (⚙️) at the bottom of the left sidebar
   - Click **"API"** in the settings menu

2. **Copy Your Keys**
   - **Project URL:**
     - Copy the value under "Project URL"
     - Example: `https://xxxxxxxxxxxxx.supabase.co`
   
   - **anon/public key:**
     - Copy the value under "Project API keys" → "anon" → "public"
     - This is a long string starting with `eyJ...`

3. **Add to Your Project**
   - Open `.env.local` file in your project root
   - Add or update:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```
   - Save the file
   - **Restart your Next.js dev server** if it's running

---

## Step 6: (Optional) Add More Managers

If you want to add additional manager accounts:

1. **Add Email to authorized_emails:**
   ```sql
   INSERT INTO authorized_emails (email, role) VALUES
     ('manager1@gmail.com', 'manager'),
     ('manager2@gmail.com', 'manager');
   ```

2. **Create User Accounts:**
   - Go to **Authentication** → **Users**
   - Add each manager email as a user (same as Step 4)

---

## Step 7: Test Your Setup

1. **Start Your App** (if not running):
   ```bash
   npm run dev
   ```

2. **Test Authentication:**
   - Visit: `http://localhost:3000/auth/signin`
   - Sign in with your superadmin email
   - Should redirect to `/admin`

3. **Test Admin Dashboard:**
   - Visit: `http://localhost:3000/admin`
   - Should see orders dashboard (may be empty initially)

4. **Test Menu Editor:**
   - Click "📝 Menu Editor" button or visit `/admin/menu`
   - Should see all 13 menu items
   - Try editing an item, toggling availability

5. **Test Customer Flow:**
   - Visit: `http://localhost:3000/`
   - Place a test order
   - Check if it appears in admin dashboard

---

## ✅ Quick Verification Checklist

Before you start using the app, verify:

- [ ] All 3 tables exist (`authorized_emails`, `orders`, `menu_items`)
- [ ] `menu_items` table has 13 items
- [ ] Your email is in `authorized_emails` with role `superadmin`
- [ ] Your user account exists in Authentication → Users
- [ ] `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `.env.local` has correct `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] You can sign in at `/auth/signin`
- [ ] You can access `/admin` after signing in

---

## 🐛 Troubleshooting

### "Table doesn't exist" error
- **Solution:** Make sure you ran the entire `schema.sql` file in Step 1
- Check SQL Editor for any error messages

### "Unauthorized" when signing in
- **Solution:** 
  1. Verify your email is in `authorized_emails` table (exact match, case-sensitive)
  2. Verify you created a user account in Authentication → Users
  3. Try signing out and signing in again

### "Failed to fetch" errors in app
- **Solution:**
  1. Check `.env.local` has correct values
  2. Restart your Next.js dev server
  3. Check browser console for specific error messages

### Menu items not showing
- **Solution:**
  1. Check `menu_items` table has data
  2. If empty, run the INSERT statements from `schema.sql` manually
  3. Check RLS policies are set correctly

### RLS Policy errors
- **Solution:**
  - Current policies are permissive for development
  - If you see RLS errors, check that policies exist in SQL Editor:
    ```sql
    SELECT * FROM pg_policies WHERE tablename IN ('orders', 'menu_items', 'authorized_emails');
    ```

---

## 📝 SQL Commands Reference

### Check if tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('authorized_emails', 'orders', 'menu_items');
```

### View all authorized emails:
```sql
SELECT * FROM authorized_emails;
```

### View all menu items:
```sql
SELECT * FROM menu_items ORDER BY category, name;
```

### View all orders:
```sql
SELECT * FROM orders ORDER BY created_at DESC;
```

### Add a manager:
```sql
INSERT INTO authorized_emails (email, role) VALUES
  ('manager-email@gmail.com', 'manager');
```

### Remove an authorized email:
```sql
DELETE FROM authorized_emails WHERE email = 'email-to-remove@gmail.com';
```

---

## 🎉 You're Done!

Once you complete Steps 1-5, your Supabase database is fully set up and ready to use!

**Next Steps:**
- Test the admin dashboard
- Add menu items via the menu editor
- Place test orders from the customer menu
- Manage orders in the admin dashboard

