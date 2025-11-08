# Supabase Functions - What You Need to Know

## ✅ Database Functions (Stored Procedures)

### 1. `update_updated_at_column()` Function

**Status:** ✅ **Automatically created when you run the schema**

This is a PostgreSQL database function that automatically updates the `updated_at` timestamp whenever a record is updated.

**What it does:**
- Automatically sets `updated_at = NOW()` when any row is updated
- Works on: `orders`, `menu_items`, `authorized_emails` tables

**Where it's defined:**
- Already included in `supabase/schema.sql`
- Gets created automatically when you run the schema

**You don't need to do anything** - it's handled by the schema!

---

## ❌ Supabase Edge Functions (Not Needed)

**Status:** ❌ **Not required for this project**

Supabase Edge Functions are serverless functions that run on Supabase's infrastructure. 

**Why we don't need them:**
- All backend logic is handled by **Next.js API routes** (`app/api/`)
- Authentication is handled by Supabase Auth (built-in)
- Database operations use direct Supabase client calls

**If you wanted to use Edge Functions instead:**
- You'd need to create functions in `supabase/functions/` directory
- Deploy them separately
- But it's **not necessary** for this project

---

## 📋 Summary: What Gets Created

When you run `supabase/schema.sql`, these are created automatically:

### ✅ Database Function (1):
- `update_updated_at_column()` - Auto-updates timestamps

### ✅ Triggers (3):
- `update_orders_updated_at` - Uses the function above
- `update_menu_items_updated_at` - Uses the function above  
- `update_authorized_emails_updated_at` - Uses the function above

### ✅ Tables (3):
- `authorized_emails`
- `orders`
- `menu_items`

### ✅ Indexes (6):
- Performance indexes on various columns

### ✅ RLS Policies (6):
- Row Level Security policies for access control

---

## 🔍 How to Verify Functions Were Created

After running the schema, you can verify the function exists:

### In SQL Editor:
```sql
-- Check if function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'update_updated_at_column';
```

**Expected result:** Should return 1 row with the function name.

### Check Triggers:
```sql
-- Check if triggers exist
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE 'update_%_updated_at';
```

**Expected result:** Should return 3 rows (one for each table).

---

## 🎯 What You Need to Do

### ✅ Nothing Extra!

The database function is **already included** in `supabase/schema.sql`. When you:

1. Run the schema in SQL Editor
2. All functions, triggers, tables, and policies are created automatically

**No additional steps needed!**

---

## 🚀 Optional: Custom Functions (Future)

If you want to add custom database functions later, you can create them in SQL Editor:

### Example: Function to get today's orders
```sql
CREATE OR REPLACE FUNCTION get_todays_orders()
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  total_amount NUMERIC,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.customer_name, o.total_amount, o.status
  FROM orders o
  WHERE DATE(o.created_at) = CURRENT_DATE
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql;
```

Then call it:
```sql
SELECT * FROM get_todays_orders();
```

**But this is optional** - the current implementation doesn't need it.

---

## 📝 Quick Reference

| Type | Name | Status | Action Needed |
|------|------|--------|---------------|
| Database Function | `update_updated_at_column()` | ✅ Auto-created | None |
| Edge Functions | N/A | ❌ Not used | None |
| Triggers | 3 triggers | ✅ Auto-created | None |

---

## ✅ Bottom Line

**You don't need to do anything extra for functions!**

Just run the `supabase/schema.sql` file, and everything (including the function) will be created automatically. The function works behind the scenes to keep your `updated_at` timestamps current.

