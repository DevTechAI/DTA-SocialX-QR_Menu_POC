# Project Structure

This is a Next.js 14 application with Supabase integration, designed for a mobile-responsive QR Menu web app.

## 📁 Folder Structure

```
DTA-SocialX-QR_Menu_POC/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   └── callback/         # Auth callback handler
│   │   ├── health/               # Health check endpoint
│   │   └── menu/                 # Menu CRUD operations
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── ui/                       # UI components (Button, Card, Input)
│   └── layout/                   # Layout components (Header, BottomNav)
│
├── contexts/                     # React Context providers
│   └── AuthContext.tsx           # Authentication context
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Authentication hook
│   ├── useMediaQuery.ts          # Responsive breakpoints
│   └── useLocalStorage.ts        # Local storage management
│
├── lib/                          # Utilities and libraries
│   ├── supabase/                 # Supabase configuration
│   │   ├── client.ts             # Client-side Supabase client
│   │   ├── server.ts             # Server-side Supabase client
│   │   └── middleware.ts         # Session management middleware
│   └── utils/                    # Helper functions
│       ├── cn.ts                 # Class name utility
│       └── format.ts             # Formatting utilities
│
├── public/                       # Static assets
│   └── images/                   # Image files
│
├── types/                        # TypeScript type definitions
│   ├── index.ts                  # Common types
│   └── database.types.ts         # Supabase database types
│
├── middleware.ts                 # Next.js middleware for auth
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── postcss.config.js             # PostCSS configuration
├── .eslintrc.json                # ESLint configuration
├── .gitignore                    # Git ignore rules
├── .env.example                  # Environment variables template
├── package.json                  # Dependencies and scripts
└── README.md                     # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm, yarn, or pnpm
- Supabase account

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Then fill in your Supabase credentials in `.env.local`

3. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 🏗️ Architecture

### Frontend
- **Framework:** Next.js 14 with App Router
- **Styling:** Tailwind CSS
- **UI Components:** Custom component library in `/components/ui`
- **State Management:** React Context API
- **Type Safety:** TypeScript

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **API:** Next.js API Routes
- **Real-time:** Supabase Realtime (ready to use)

### Mobile Responsiveness
- Mobile-first design approach
- Custom responsive utilities in `globals.css`
- Safe area insets for notch devices
- Tailwind breakpoints configured for common device sizes

## 📱 Mobile Features

- **Container Utility:** `.container-mobile` class for max-width mobile layouts
- **Safe Area Support:** iOS notch/home indicator spacing
- **Touch-Optimized:** Button sizes and spacing optimized for touch
- **Bottom Navigation:** Fixed bottom nav for easy thumb access
- **PWA Ready:** Can be extended to Progressive Web App

## 🔐 Authentication Flow

1. User authenticates via Supabase Auth
2. Middleware intercepts requests and updates session
3. Auth context provides user state throughout app
4. Protected routes can check auth status

## 📊 Database Schema (Example)

You'll need to create these tables in Supabase:

```sql
-- menu_items table
create table menu_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric not null,
  category text not null,
  image_url text,
  available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🎨 Theming

The app includes a basic theme system with:
- Light/dark mode support (via CSS variables)
- Customizable color palette in `tailwind.config.ts`
- Component variants (primary, secondary, outline, ghost)

## 📝 Next Steps

1. Set up your Supabase database schema
2. Configure authentication providers in Supabase
3. Add your custom theme/UI components to `/theme-ui` (when provided)
4. Implement business logic for menu management
5. Add order processing functionality
6. Integrate payment processing (if needed)

## 🤝 Contributing

This is a proof of concept. Extend and customize as needed for your use case.

## 📄 License

Private project for SocialX

