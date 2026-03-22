// api/webhook.ts
// Vercel Serverless Function
// Stripe calls this URL when payment events happen
// This is what actually activates/deactivates subscriptions in your DB

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

// Service role bypasses RLS — safe here since this is server-side only
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// IMPORTANT: Disable body parsing so we can verify the Stripe signature
export const config = {
  api: {
    bodyParser: false,
  },
}

// Helper to read raw body for signature verification
async function getRawBody(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rawBody = await getRawBody(req)
  const signature = req.headers['stripe-signature']

  let event: Stripe.Event

  // Verify the webhook came from Stripe (not a fake request)
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  // Handle each event type
  try {
    switch (event.type) {

      // ── Payment successful → activate subscription ────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        const plan = session.metadata?.plan as 'monthly' | 'yearly'

        if (!userId) break

        const renewalDate = new Date()
        if (plan === 'yearly') {
          renewalDate.setFullYear(renewalDate.getFullYear() + 1)
        } else {
          renewalDate.setMonth(renewalDate.getMonth() + 1)
        }

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_plan: plan,
            subscription_renewal_date: renewalDate.toISOString(),
            stripe_customer_id: session.customer as string,
          })
          .eq('id', userId)

        console.log(`✅ Subscription activated for user ${userId} (${plan})`)
        break
      }

      // ── Invoice paid → renew subscription ────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Find user by Stripe customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, subscription_plan')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) break

        const renewalDate = new Date()
        if (profile.subscription_plan === 'yearly') {
          renewalDate.setFullYear(renewalDate.getFullYear() + 1)
        } else {
          renewalDate.setMonth(renewalDate.getMonth() + 1)
        }

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_renewal_date: renewalDate.toISOString(),
          })
          .eq('id', profile.id)

        console.log(`🔄 Subscription renewed for customer ${customerId}`)
        break
      }

      // ── Payment failed → mark as lapsed ──────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabase
          .from('profiles')
          .update({ subscription_status: 'lapsed' })
          .eq('stripe_customer_id', customerId)

        console.log(`❌ Payment failed for customer ${customerId}`)
        break
      }

      // ── Subscription cancelled ────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'cancelled',
            subscription_plan: null,
            subscription_renewal_date: null,
          })
          .eq('stripe_customer_id', customerId)

        console.log(`🚫 Subscription cancelled for customer ${customerId}`)
        break
      }

      // ── Subscription updated (plan change) ────────────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Determine new plan from price ID
        const priceId = subscription.items.data[0]?.price.id
        const plan = priceId === process.env.STRIPE_YEARLY_PRICE_ID ? 'yearly' : 'monthly'
        const status = subscription.status === 'active' ? 'active' : 'lapsed'

        await supabase
          .from('profiles')
          .update({
            subscription_status: status,
            subscription_plan: plan,
          })
          .eq('stripe_customer_id', customerId)

        console.log(`📝 Subscription updated for customer ${customerId}: ${plan} / ${status}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return res.status(200).json({ received: true })

  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return res.status(500).json({ error: error.message })
  }
}
