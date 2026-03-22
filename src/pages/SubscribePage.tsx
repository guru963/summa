import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Trophy, ArrowRight, Heart, Shield, Zap, CheckCircle } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const FEATURES = [
  'Monthly draw entry (automatic)',
  'Stableford score tracking (5 scores)',
  'Charity contribution (min 10%)',
  'Winner verification access',
  'Draw history & analytics',
  'Priority draw notifications',
]

const YEARLY_FEATURES = [
  ...FEATURES,
  '~17% saving vs monthly',
  'Priority support',
  'Early draw results',
]

const FAQ = [
  { q: 'How are draw numbers selected?', a: 'We use your latest 5 Stableford scores as your draw numbers. You can use either random or algorithmic draws — all transparent and verifiable.' },
  { q: 'What percentage goes to charity?', a: 'A minimum of 10% of your subscription goes to your chosen charity. You can increase this anytime from your profile settings.' },
  { q: 'What happens to the jackpot if no one wins?', a: 'The 5-number jackpot (40% of pool) rolls over to the next month, growing until someone matches all 5 numbers.' },
  { q: 'Can I change my charity?', a: 'Yes, you can update your charity selection anytime from your dashboard profile settings.' },
  { q: 'How do I claim a prize?', a: 'If you win, you\'ll be notified. You upload proof of your scores from the official golf platform, and admin verifies within 48 hours. Payment follows immediately.' },
  { q: 'Can I cancel my subscription?', a: 'Absolutely. Cancel anytime from your profile — no questions asked. Your access continues until the end of the billing period.' },
]

export default function SubscribePage() {
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)
  const [activated, setActivated] = useState(false)
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  const handleSubscribe = async (selectedPlan: 'monthly' | 'yearly') => {
    if (!user) { navigate('/signup'); return }

    if (user.subscription_status === 'active') {
      toast.success('Your subscription is already active!')
      navigate('/dashboard')
      return
    }

    setLoading(true)
    setPlan(selectedPlan)

    try {
      // Try Stripe checkout first (production)
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
      const hasStripe = stripeKey && !stripeKey.includes('your_stripe')

      if (hasStripe) {
        // Call our serverless function to create a Stripe Checkout session
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            userEmail: user.email,
            plan: selectedPlan,
          }),
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || 'Failed to create checkout session')
        }

        const { url } = await response.json()
        // Redirect to Stripe Checkout page
        window.location.href = url
        return
      }

      // Fallback: direct DB update (for testing without Stripe configured)
      const renewalDate = new Date()
      if (selectedPlan === 'monthly') {
        renewalDate.setMonth(renewalDate.getMonth() + 1)
      } else {
        renewalDate.setFullYear(renewalDate.getFullYear() + 1)
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_plan: selectedPlan,
          subscription_renewal_date: renewalDate.toISOString(),
        })
        .eq('id', user.id)

      if (error) throw new Error(error.message)

      await refreshUser()
      setActivated(true)
      toast.success(`${selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'} plan activated!`)

    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Success screen after activation
  if (activated) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-brand-500/10 border border-brand-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-brand-400" />
          </div>
          <h1 className="font-display font-bold text-3xl text-dark-50 mb-3">You're all set!</h1>
          <p className="text-dark-400 mb-2">
            Your <span className="text-brand-400 font-semibold capitalize">{plan}</span> plan is now active.
          </p>
          <p className="text-dark-500 text-sm mb-8">
            You're now entered into the next monthly draw. Start tracking your scores to lock in your numbers.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary inline-flex items-center gap-2 group"
          >
            Go to Dashboard
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="pt-24 pb-20 max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="section-label mb-3">Simple Pricing</p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-dark-50 tracking-tight mb-4">
            One subscription.<br />Endless impact.
          </h1>
          <p className="text-dark-400 text-lg max-w-lg mx-auto">
            Play golf, enter monthly prize draws, and support charity — all in one subscription.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center mb-10">
          <div className="bg-dark-900 border border-dark-700 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setPlan('monthly')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${plan === 'monthly' ? 'bg-dark-700 text-dark-50' : 'text-dark-500 hover:text-dark-300'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPlan('yearly')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${plan === 'yearly' ? 'bg-dark-700 text-dark-50' : 'text-dark-500 hover:text-dark-300'}`}
            >
              Yearly
              <span className="badge-green text-[10px]">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">

          {/* Monthly */}
          <div className={`card relative transition-all duration-200 ${plan === 'monthly' ? 'border-brand-500/50 glow-green' : ''}`}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-display font-bold text-xl text-dark-50 mb-1">Monthly</h2>
                <p className="text-dark-500 text-sm">Flexible, cancel anytime</p>
              </div>
              <div className="text-right">
                <div className="font-display font-bold text-4xl text-dark-50">£9.99</div>
                <div className="text-dark-500 text-sm">per month</div>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-dark-300">
                  <Check size={15} className="text-brand-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && plan === 'monthly'
                ? <span className="w-5 h-5 border-2 border-dark-950/40 border-t-dark-950 rounded-full animate-spin" />
                : <>{user?.subscription_status === 'active' ? 'Current Plan' : 'Activate Monthly'} <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" /></>
              }
            </button>
          </div>

          {/* Yearly */}
          <div className={`card relative transition-all duration-200 ${plan === 'yearly' ? 'border-gold-500/50 glow-gold' : ''}`}>
            <div className="absolute -top-3 left-6">
              <span className="badge-gold text-xs px-3 py-1">Most Popular</span>
            </div>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-display font-bold text-xl text-dark-50 mb-1">Yearly</h2>
                <p className="text-dark-500 text-sm">Best value · save £19.89</p>
              </div>
              <div className="text-right">
                <div className="font-display font-bold text-4xl text-dark-50">£99.99</div>
                <div className="text-dark-500 text-sm">per year</div>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {YEARLY_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-dark-300">
                  <Check size={15} className={i >= FEATURES.length ? 'text-gold-400 flex-shrink-0' : 'text-brand-400 flex-shrink-0'} />
                  <span className={i >= FEATURES.length ? 'text-gold-300' : ''}>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('yearly')}
              disabled={loading}
              className="btn-gold w-full flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && plan === 'yearly'
                ? <span className="w-5 h-5 border-2 border-dark-950/40 border-t-dark-950 rounded-full animate-spin" />
                : <>{user?.subscription_status === 'active' ? 'Current Plan' : 'Activate Yearly'} <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" /></>
              }
            </button>
          </div>
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap justify-center gap-8 mb-16 text-sm text-dark-500">
          <div className="flex items-center gap-2"><Shield size={16} className="text-brand-500" />Secure & safe</div>
          <div className="flex items-center gap-2"><Heart size={16} className="text-red-500" />10% minimum to charity</div>
          <div className="flex items-center gap-2"><Zap size={16} className="text-gold-500" />Instant draw entry</div>
          <div className="flex items-center gap-2"><Trophy size={16} className="text-brand-500" />Cancel anytime</div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="font-display font-bold text-2xl text-dark-50 mb-8 text-center">Frequently asked</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {FAQ.map((item, i) => (
              <div key={i} className="card">
                <h3 className="font-semibold text-dark-100 mb-2 text-sm">{item.q}</h3>
                <p className="text-dark-500 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
