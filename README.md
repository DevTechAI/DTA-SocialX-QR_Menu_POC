# DTA-SocialX QR Menu POC

A complete QR-based order receiving and management system for **SocialX Community Café**, built with Next.js 14 and Supabase.

## 🎯 Overview

This application provides a contactless ordering experience for café customers via QR codes, along with a comprehensive dashboard for staff to manage orders in real-time.

### Customer Experience
- Scan QR code → Enter name → Browse menu → Place order
- Mobile-optimized interface with easy navigation
- Real-time order total and item tracking
- Call waiter feature for assistance

### Staff Experience
- Desktop/tablet dashboard for order management
- Color-coded order status tracking
- Today's analytics and statistics
- One-click status updates

## ✨ Key Features

### Customer Portal (`/order`)
- 📱 **Mobile-First Design** - Optimized for phone screens
- 🎨 **SocialX Branding** - Custom logo and theme integration
- 📋 **Categorized Menu** - HOT, COLD, and NON-COFFEE sections
- ➕ **Easy Ordering** - Add/remove items with quantity control
- 🙋 **Call Waiter** - Request assistance button
- 💰 **Live Total** - Real-time order amount calculation
- ✅ **Order Confirmation** - Clear feedback after placing order

### Manager Dashboard (`/manager`)
- 💼 **Order Management** - View and track all orders
- 📊 **Statistics Bar** - Total value, order count, settled amount
- 🎨 **Color-Coded Status**:
  - 🟨 Yellow - Order Received
  - 🟩 Light Green - Delivered to table
  - ⬜ Light Grey - Payment completed
  - 🟧 Orange/Red - Payment pending
- 🔄 **Auto-Refresh** - Updates every 10 seconds
- 📱 **Responsive** - Works on tablets and desktops
- 🔍 **Expandable Details** - Click to see full order breakdown
- ⚡ **Quick Actions** - One-click status updates

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create project at [supabase.com](https://supabase.com)
2. In SQL Editor, run the schema from `supabase/schema.sql`
3. Get your API credentials from Project Settings → API

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

Visit:
- **Customer**: `http://localhost:3000/order`
- **Manager**: `http://localhost:3000/manager`
- **Home**: `http://localhost:3000`

## 📋 Menu Items

All menu items from the café menu are included:

### HOT ☕
- Latte (₹228)
- Cappuccino (₹228)
- Mocha (₹178) - *Recommended*
- Americano (₹178)
- Vietnamese Coffee (₹198)

### COLD 🧊
- Cold Coffee (₹228)
- Cranberry Espresso (₹178) - *Recommended*
- Iced Americano (₹228)
- Iced Mocha (₹178)
- Iced Vietnamese (₹198)

### NON-COFFEE 🥤
- Hot Chocolate (₹78)
- Coke/Diet Coke (₹168)
- Redbull (₹198)

## 🛠️ Tech Stack

- **Framework:** Next.js 14 with App Router
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Deployment:** Vercel-ready

## 📱 QR Code Setup

### For Production
1. Deploy to Vercel (or your hosting)
2. Generate QR codes for: `https://your-domain.com/order`
3. Print and place on café tables

### For Local Testing
1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Generate QR for: `http://YOUR-IP:3000/order`
3. Test with mobile devices on same network

## 📊 Order Workflow

```
1. Customer scans QR code
2. Enters their name
3. Browses menu by category
4. Adds items to order
5. Places order
6. Staff receives order (Yellow status)
7. Staff prepares food
8. Staff marks as Delivered (Green status)
9. Customer pays
10. Staff marks as Paid (Grey status)
```

## 📂 Project Structure

```
├── app/
│   ├── order/              # Customer-facing pages
│   │   ├── page.tsx        # Landing page with name entry
│   │   └── menu/page.tsx   # Menu browsing and ordering
│   ├── manager/page.tsx    # Order management dashboard
│   └── api/
│       └── orders/         # Order API endpoints
├── components/
│   ├── ui/                 # Reusable UI components
│   └── layout/             # Layout components
├── lib/
│   ├── data/menu-items.ts  # Menu data
│   └── supabase/           # Database clients
├── supabase/
│   ├── schema.sql          # Database schema
│   └── README.md           # Database setup guide
└── types/                  # TypeScript definitions
```

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for complete details.

## 📝 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Code organization
- **[supabase/README.md](./supabase/README.md)** - Database configuration

## 🔧 Configuration

### Update Menu Items
Edit menu in two places:
1. `lib/data/menu-items.ts` (for local/demo)
2. Supabase `menu_items` table (for production)

### Customize Branding
- Logo: `public/images/socialx-logo.svg`
- Colors: `tailwind.config.ts`
- Theme: `app/globals.css`

## 🚀 Deployment to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

```bash
# Build for production
npm run build

# Test production build locally
npm run start
```

## 📄 License

Private - SocialX Community Café

## 🤝 Credits

**Powered by [DevTechAi.Org](https://www.devtechai.org)**

## 📞 Support

For issues or feature requests, refer to the documentation or contact the development team.