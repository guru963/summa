// api/create-checkout-session.ts
// Vercel Serverless Function
// Called when user clicks "Subscribe" button
// Creates a Stripe Checkout session and returns the URL

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Use service role key here — this runs on the server, not the browser
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, userEmail, plan } = req.body

    if (!userId || !userEmail || !plan) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' })
    }

    // Pick the correct Stripe Price ID based on plan
    const priceId = plan === 'yearly'
      ? process.env.STRIPE_YEARLY_PRICE_ID!
      : process.env.STRIPE_MONTHLY_PRICE_ID!

    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    let customerId = profile?.stripe_customer_id

    // Create Stripe customer if they don't have one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id

      // Save customer ID to Supabase
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    // Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      // Where to send user after payment
      success_url: `${process.env.VITE_APP_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.VITE_APP_URL}/subscribe?payment=cancelled`,
      // Pass user ID so webhook knows who paid
      metadata: {
        supabase_user_id: userId,
        plan,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
          plan,
        },
      },
      // Allow coupon codes
      allow_promotion_codes: true,
    })

    // Return the checkout URL to the frontend
    return res.status(200).json({ url: session.url })

  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return res.status(500).json({ error: error.message })
  }
}
