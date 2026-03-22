# Stripe Integration Guide — ParForGood

## Overview of how it works
User clicks "Subscribe" → Stripe Checkout opens → User pays → 
Stripe webhook fires → Your DB updates → User gets access

---

## STEP 1: Create Stripe Account & Get Keys

1. Go to https://dashboard.stripe.com/register
2. After login, go to **Developers → API Keys**
3. Copy:
   - **Publishable key**: pk_test_xxxxx  (safe for frontend)
   - **Secret key**: sk_test_xxxxx       (backend only, never expose)

Add to your .env.local:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx   ← backend only
STRIPE_WEBHOOK_SECRET=whsec_xxxxx ← from Step 4
```

---

## STEP 2: Create Products in Stripe Dashboard

Go to **Products → Add Product**:

**Product 1: Monthly Plan**
- Name: ParForGood Monthly
- Price: £9.99 / month (recurring)
- Copy the Price ID: price_xxxxx → save as STRIPE_MONTHLY_PRICE_ID

**Product 2: Yearly Plan**  
- Name: ParForGood Yearly
- Price: £99.99 / year (recurring)
- Copy the Price ID: price_xxxxx → save as STRIPE_YEARLY_PRICE_ID

---

## STEP 3: Deploy a Backend (Vercel Serverless Functions)

Create these two API route files in your project.

### File: api/create-checkout-session.ts
Handles: User clicks Subscribe → Creates Stripe Checkout session → Returns URL

### File: api/webhook.ts  
Handles: Stripe sends payment events → Updates your Supabase DB

---

## STEP 4: Set Up Webhook

1. Go to **Stripe → Developers → Webhooks → Add Endpoint**
2. URL: https://your-vercel-app.vercel.app/api/webhook
3. Select events:
   - checkout.session.completed
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
4. Copy the **Webhook Signing Secret**: whsec_xxxxx

---

## STEP 5: Test with Stripe Test Cards

Use these card numbers in Stripe Checkout:
- ✅ Success: 4242 4242 4242 4242 (any future date, any CVC)
- ❌ Decline: 4000 0000 0000 0002
- 🔐 3D Secure: 4000 0025 0000 3155

---

## Environment Variables needed in Vercel:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_MONTHLY_PRICE_ID=price_xxx
STRIPE_YEARLY_PRICE_ID=price_xxx
VITE_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx   ← from Supabase Settings → API (NOT anon key)
VITE_APP_URL=https://your-app.vercel.app
```

Note: SUPABASE_SERVICE_ROLE_KEY is different from anon key.
It bypasses RLS — only use on server side (never in frontend).
