# ⛳ ParForGood — Golf Charity Subscription Platform

A modern, subscription-based golf platform combining Stableford performance tracking, monthly prize draws, and charitable giving. Built with React + TypeScript + Tailwind CSS + Supabase.

---

## 🚀 Demo Credentials

Once running, use these to demo the platform without configuring Supabase:

| Role  | Email                    | Password   |
|-------|--------------------------|------------|
| User  | demo@parforgood.com      | demo123    |
| Admin | admin@parforgood.com     | admin123   |

---

## 🛠 Tech Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Frontend      | React 18 + TypeScript + Vite        |
| Styling       | Tailwind CSS v3 + Custom CSS        |
| Routing       | React Router v6                     |
| Backend/DB    | Supabase (PostgreSQL + Auth + Storage)|
| Payments      | Stripe (Checkout + Portal)          |
| Animations    | CSS animations + Framer Motion      |
| Notifications | react-hot-toast                     |
| Deployment    | Vercel (frontend) + Supabase (DB)   |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx          # Public navigation bar
│   │   └── DashboardLayout.tsx # Authenticated sidebar layout
│   └── ui/                     # Shared UI components
├── context/
│   └── AuthContext.tsx          # Auth state + demo mode
├── lib/
│   ├── supabase.ts             # Supabase client + types
│   ├── demoData.ts             # Demo/mock data
│   └── drawEngine.ts           # Draw logic + utilities
├── pages/
│   ├── HomePage.tsx            # Landing page
│   ├── LoginPage.tsx           # Sign in
│   ├── SignupPage.tsx          # Create account
│   ├── SubscribePage.tsx       # Pricing + Stripe checkout
│   ├── DashboardPage.tsx       # User dashboard
│   ├── ScoresPage.tsx          # Score management
│   ├── DrawPage.tsx            # Monthly draw viewer
│   ├── CharitiesPage.tsx       # Charity directory
│   ├── ProfilePage.tsx         # User settings
│   ├── WinnersPage.tsx         # Win verification
│   └── AdminPage.tsx           # Full admin panel
├── types/
│   └── index.ts                # TypeScript types
├── App.tsx                     # Router + auth guards
├── main.tsx                    # Entry point
└── index.css                   # Global styles + Tailwind
```

---

## ⚡ Quick Start (Local)

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase and Stripe keys
```

### 3. Set up Supabase
1. Create a new project at [supabase.com](https://app.supabase.com)
2. Go to **SQL Editor** and run the entire contents of `supabase-schema.sql`
3. Copy your **Project URL** and **anon key** into `.env.local`

### 4. Start the dev server
```bash
npm run dev
```

Visit `http://localhost:5173` — use demo credentials above to explore without Supabase.

---

## 🌐 Deploy to Vercel

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/parforgood
git push -u origin main
```

### Step 2 — Create Vercel Project
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Framework: **Vite** (auto-detected)

### Step 3 — Add Environment Variables in Vercel
In Vercel dashboard → Project → Settings → Environment Variables, add:
```
VITE_SUPABASE_URL        = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY   = your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY = pk_live_...
VITE_APP_URL             = https://your-vercel-url.vercel.app
```

### Step 4 — Deploy
Click **Deploy**. Vercel will build and deploy automatically on every push to main.

---

## 💳 Stripe Setup

### 1. Create Products in Stripe Dashboard
- Product: "ParForGood Monthly" → Price: £9.99/month (recurring)
- Product: "ParForGood Yearly" → Price: £99.99/year (recurring)

### 2. Set up Webhooks (for subscription lifecycle)
In Stripe → Developers → Webhooks, add endpoint:
```
https://your-app.vercel.app/api/webhooks/stripe
```

Events to listen for:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`

### 3. Stripe Customer Portal
Enable the Stripe Customer Portal so users can manage subscriptions themselves.

---

## 🗄 Database Schema

### Tables
| Table                  | Purpose                                    |
|------------------------|--------------------------------------------|
| `profiles`             | User profiles + subscription status        |
| `golf_scores`          | Stableford scores (max 5 per user)         |
| `charities`            | Charity directory                          |
| `draws`                | Monthly draw records                       |
| `draw_entries`         | User entries per draw + match results      |
| `winner_verifications` | Proof uploads + admin review               |
| `charity_donations`    | Donation tracking                          |

### Key Constraints
- `golf_scores`: DB trigger enforces max 5 per user (oldest auto-deleted)
- `profiles.charity_percentage`: 10–100 range enforced
- `profiles.subscription_status`: enum check
- Row Level Security enabled on all tables

---

## 🎮 Feature Overview

### Public
- ✅ Landing page with live stats + prize pool
- ✅ Charity directory with search & filter
- ✅ Pricing page with monthly/yearly toggle
- ✅ Sign up / Sign in

### User Dashboard
- ✅ Subscription status + renewal date
- ✅ Score entry (1–45 Stableford, 5-score rolling window)
- ✅ Score edit & delete with validation
- ✅ Visual score history chart
- ✅ Monthly draw viewer with animated number reveal
- ✅ Match detection (3/4/5 numbers)
- ✅ Prize pool breakdown
- ✅ Charity selection + contribution slider (10–50%)
- ✅ Win verification (proof upload → admin review)
- ✅ Winnings overview + payment status
- ✅ Profile settings (name, email, password, charity)

### Admin Panel
- ✅ Overview stats (users, revenue, pool, charities)
- ✅ User management table
- ✅ Draw configuration (random vs algorithmic)
- ✅ Draw simulation (preview before publish)
- ✅ Draw publishing with member notifications
- ✅ Draw history
- ✅ Charity management (add, enable/disable)
- ✅ Winner verification (approve/reject + mark paid)

---

## 🔐 Security Notes

- All DB tables have Row Level Security (RLS) enabled
- Users can only access their own data
- Admin role checked both in frontend routes and RLS policies
- Stripe handles all payment data (PCI compliant)
- JWT auth via Supabase Auth
- Environment variables never exposed in source code

---

## 📱 Mobile Support

- Mobile-first responsive design throughout
- Collapsible sidebar navigation on mobile
- Touch-friendly score entry and draw viewer
- Optimised for iOS Safari and Chrome Android

---

## 📊 Draw Engine

Located in `src/lib/drawEngine.ts`:

- **Random draw**: standard `Math.random()` across 1–45
- **Algorithmic draw**: weighted selection based on score frequency across all subscribers
- **Match detection**: checks user's 5 scores against winning numbers
- **Prize calculation**: auto-calculated from active subscriber count (50% of revenue → pool → split by tier)
- **Jackpot rollover**: 5-match pool carries forward if no winner

---

## 🎨 Design Notes

- **Dark theme** throughout — modern, non-traditional
- **Emotion-driven** — leads with charity impact, not sport
- **No golf clichés** — no fairways, plaid, or club imagery as primary design language
- **Color palette**: Dark navy base + brand green accent + gold for prizes
- **Typography**: Space Grotesk (display) + DM Sans (body)
- **Micro-animations**: fade-up, float, score reveal animations
- **Glassmorphism**: used selectively for testimonials and overlays

---

Built for Digital Heroes Full-Stack Trainee Selection — March 2026
