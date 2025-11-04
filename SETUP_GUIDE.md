# SocialX QR Menu POC - Setup Guide

Complete setup guide for the QR-based order management system.

## 🎯 Overview

This application consists of three main parts:
1. **Customer Landing Page** - Name entry via QR code redirect
2. **Customer Menu Page** - Browse and order from menu
3. **Manager Dashboard** - Track and manage orders

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm, yarn, or pnpm
- Supabase account (free tier is fine)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

#### Create Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Enter project details and create

#### Run Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy contents from `supabase/schema.sql`
4. Paste and click "Run"

This creates:
- `orders` table
- `menu_items` table with pre-populated data
- Proper indexes and RLS policies

#### Get API Credentials
1. Go to **Project Settings** → **API**
2. Copy:
   - Project URL
   - anon public key

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local and add your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📱 Testing the Application

### Customer Flow

1. **Landing Page**: Visit `http://localhost:3000/order`
   - Enter your name
   - Click "Click for Menu"

2. **Menu Page**: Browse and order
   - Switch between HOT, COLD, NON-COFFEE tabs
   - Add items to order
   - Click "Call Waiter" if you need help
   - Click "Place Order" to submit

3. **Confirmation**: See order confirmation
   - Status shows "Cooking in Progress"
   - Click to start a new order

### Manager Flow

1. **Dashboard**: Visit `http://localhost:3000/manager`
   - See all orders in real-time
   - View statistics in top bar
   - Orders color-coded by status:
     - 🟨 Yellow = Received
     - 🟩 Light Green = Delivered
     - ⬜ Light Grey = Paid
     - 🟧 Light Orange/Red = Unpaid

2. **Manage Orders**: Click any order card
   - View full order details
   - Update status with buttons
   - Track payment status

## 🎨 Features

### Customer Features
- ✅ Clean, mobile-first design
- ✅ SocialX branded landing page
- ✅ Expandable category tabs
- ✅ Add/remove items with quantity
- ✅ Real-time order total
- ✅ Call waiter button
- ✅ Order confirmation screen

### Manager Features
- ✅ Desktop/tablet optimized layout
- ✅ Live order dashboard
- ✅ Today's statistics
- ✅ Color-coded order status
- ✅ Expandable order details
- ✅ Quick status updates
- ✅ Auto-refresh (every 10 seconds)

## 🔧 Configuration

### Menu Items

Menu items are stored in two places:

1. **Hardcoded** (for offline/demo): `lib/data/menu-items.ts`
2. **Database** (for production): Supabase `menu_items` table

To update menu:
- Edit `menu-items.ts` for local changes
- Use Supabase Table Editor for database updates

### QR Code Setup

To generate QR codes that redirect to the landing page:

1. Use any QR code generator (e.g., qr-code-generator.com)
2. Enter your landing page URL:
   ```
   https://your-domain.com/order
   ```
3. Print and place QR codes on tables

**For Production:**
```
https://your-domain.vercel.app/order
```

**For Local Testing:**
```
http://your-local-ip:3000/order
```
(Find your local IP with `ipconfig` on Windows or `ifconfig` on Mac/Linux)

## 🎯 Order Status Workflow

```
Received (Yellow) → Order just placed
    ↓
Delivered (Green) → Food served to customer
    ↓
Unpaid (Red) → Waiting for payment
    ↓
Paid (Grey) → Transaction complete
```

## 📊 Database Schema

### Orders Table
```sql
- id: UUID (primary key)
- customer_name: TEXT
- items: JSONB (array of order items)
- total_amount: NUMERIC
- status: TEXT (received/delivered/paid/unpaid)
- table_number: TEXT (optional)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Menu Items Table
```sql
- id: TEXT (primary key, e.g., 'hot-latte')
- name: TEXT
- description: TEXT
- price: NUMERIC
- category: TEXT (HOT/COLD/NON-COFFEE)
- available: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
5. Deploy!

### Generate Production QR Codes

After deployment:
1. Get your Vercel URL (e.g., `your-app.vercel.app`)
2. Generate QR code for: `https://your-app.vercel.app/order`
3. Print and place on tables

## 🔒 Security Notes

**Current Setup** (Development):
- Open access to all endpoints
- No authentication required
- Suitable for demo/testing

**For Production**, implement:
1. Authentication for manager dashboard
2. Restrict API access with RLS policies
3. Add rate limiting
4. Enable HTTPS only
5. Add proper error logging

## 🛠️ Troubleshooting

### Orders Not Saving
- Check `.env.local` has correct Supabase credentials
- Verify schema was created successfully
- Check browser console for errors
- Verify Supabase project is active

### Menu Not Loading
- Confirm `menu_items` table exists
- Check that INSERT statements ran in schema.sql
- Verify RLS policies are correct

### Manager Dashboard Empty
- Place at least one order first
- Check API endpoint: `http://localhost:3000/api/orders`
- Verify orders table has data in Supabase

### Styling Issues
- Run `npm install` again
- Clear browser cache
- Restart dev server

## 📝 Next Steps

- [ ] Add table number selection
- [ ] Implement staff authentication
- [ ] Add order notifications (SMS/Email)
- [ ] Enable real-time updates with Supabase Realtime
- [ ] Add order history for customers
- [ ] Implement payment integration
- [ ] Add analytics dashboard
- [ ] Create printable receipts
- [ ] Add multi-language support

## 🤝 Support

For issues or questions:
- Check `supabase/README.md` for database help
- Review `PROJECT_STRUCTURE.md` for code organization
- Check Supabase logs in dashboard

---

**Powered by DevTechAi.Org**

