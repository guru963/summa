import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Trophy, ArrowRight, Heart, Shield, Zap, CreditCard, Lock, CheckCircle } from 'lucide-react'
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

const YEARLY_EXTRAS = [
  '~17% saving vs monthly',
  'Priority support',
  'Early draw results',
]

type Step = 'plans' | 'payment' | 'success'

export default function SubscribePage() {
  const [step, setStep] = useState<Step>('plans')
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [processing, setProcessing] = useState(false)

  // Payment form state
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  const selectPlan = (selected: 'monthly' | 'yearly') => {
    if (!user) { navigate('/signup'); return }
    if (user.subscription_status === 'active') {
      toast.success('Your subscription is already active!')
      navigate('/dashboard')
      return
    }
    setPlan(selected)
    setStep('payment')
  }

  // Format card number with spaces
  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  // Format expiry MM/YY
  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
    return digits
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!cardName.trim()) e.cardName = 'Name is required'
    if (cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = 'Enter a valid 16-digit card number'
    if (expiry.length < 5) e.expiry = 'Enter a valid expiry date'
    if (cvv.length < 3) e.cvv = 'Enter a valid CVV'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (!user) return

    setProcessing(true)

    // Simulate payment processing delay
    await new Promise(r => setTimeout(r, 2000))

    try {
      const renewalDate = new Date()
      if (plan === 'monthly') {
        renewalDate.setMonth(renewalDate.getMonth() + 1)
      } else {
        renewalDate.setFullYear(renewalDate.getFullYear() + 1)
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_plan: plan,
          subscription_renewal_date: renewalDate.toISOString(),
        })
        .eq('id', user.id)

      if (error) throw new Error(error.message)

      await refreshUser()
      setStep('success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment failed. Please try again.'
      toast.error(message)
      setProcessing(false)
    }
  }

  // ── Step 3: Success ───────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md animate-fade-up">
          <div className="w-24 h-24 bg-brand-500/10 border-2 border-brand-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={44} className="text-brand-400" />
          </div>
          <h1 className="font-display font-bold text-3xl text-dark-50 mb-3">Payment confirmed!</h1>
          <p className="text-dark-400 mb-2">
            Your <span className="text-brand-400 font-semibold capitalize">{plan}</span> plan is now active.
          </p>
          <div className="card my-8 text-left space-y-3">
            {[
              { label: 'Plan', value: plan === 'monthly' ? 'Monthly — £9.99/mo' : 'Yearly — £99.99/yr' },
              { label: 'Status', value: 'Active ✓' },
              { label: 'Next billing', value: plan === 'monthly' ? 'In 1 month' : 'In 1 year' },
              { label: 'Draw entry', value: 'Automatic ✓' },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-dark-500">{row.label}</span>
                <span className="text-dark-200 font-medium">{row.value}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary w-full flex items-center justify-center gap-2 group text-base py-3.5"
          >
            Go to Dashboard
            <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-dark-600 text-xs mt-4">
            A confirmation receipt has been sent to {user?.email}
          </p>
        </div>
      </div>
    )
  }

  // ── Step 2: Payment form ──────────────────────────────────
  if (step === 'payment') {
    const amount = plan === 'monthly' ? '£9.99' : '£99.99'
    const period = plan === 'monthly' ? 'month' : 'year'

    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Back */}
          <button
            onClick={() => setStep('plans')}
            className="text-dark-500 hover:text-dark-300 text-sm flex items-center gap-1.5 mb-6 transition-colors"
          >
            ← Back to plans
          </button>

          {/* Order summary */}
          <div className="card mb-6 bg-gradient-to-br from-brand-500/5 to-dark-900 border-brand-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">You're subscribing to</p>
                <p className="font-display font-bold text-xl text-dark-50 mt-1 capitalize">
                  ParForGood {plan}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="badge-green text-xs">Active immediately</span>
                  <span className="badge-gray text-xs">Cancel anytime</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-3xl text-brand-400">{amount}</p>
                <p className="text-dark-500 text-xs">per {period}</p>
              </div>
            </div>
          </div>

          {/* Payment form */}
          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <Lock size={15} className="text-brand-400" />
              <h2 className="font-display font-semibold text-dark-100">Payment Details</h2>
              <span className="ml-auto text-xs text-dark-600 flex items-center gap-1">
                <Shield size={11} /> Secure
              </span>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              {/* Card holder name */}
              <div>
                <label className="label">Cardholder Name</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={e => { setCardName(e.target.value); setErrors(er => ({ ...er, cardName: '' })) }}
                  className={`input-field ${errors.cardName ? 'border-red-500' : ''}`}
                  placeholder="John Smith"
                  autoComplete="cc-name"
                />
                {errors.cardName && <p className="text-red-400 text-xs mt-1">{errors.cardName}</p>}
              </div>

              {/* Card number */}
              <div>
                <label className="label">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => { setCardNumber(formatCardNumber(e.target.value)); setErrors(er => ({ ...er, cardNumber: '' })) }}
                    className={`input-field pr-12 ${errors.cardNumber ? 'border-red-500' : ''}`}
                    placeholder="1234 5678 9012 3456"
                    autoComplete="cc-number"
                    inputMode="numeric"
                  />
                  <CreditCard size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500" />
                </div>
                {errors.cardNumber && <p className="text-red-400 text-xs mt-1">{errors.cardNumber}</p>}
              </div>

              {/* Expiry + CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Expiry Date</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={e => { setExpiry(formatExpiry(e.target.value)); setErrors(er => ({ ...er, expiry: '' })) }}
                    className={`input-field ${errors.expiry ? 'border-red-500' : ''}`}
                    placeholder="MM/YY"
                    autoComplete="cc-exp"
                    inputMode="numeric"
                  />
                  {errors.expiry && <p className="text-red-400 text-xs mt-1">{errors.expiry}</p>}
                </div>
                <div>
                  <label className="label">CVV</label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={e => { setCvv(e.target.value.replace(/\D/g, '').slice(0, 4)); setErrors(er => ({ ...er, cvv: '' })) }}
                    className={`input-field ${errors.cvv ? 'border-red-500' : ''}`}
                    placeholder="123"
                    autoComplete="cc-csc"
                    inputMode="numeric"
                  />
                  {errors.cvv && <p className="text-red-400 text-xs mt-1">{errors.cvv}</p>}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={processing}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <span className="w-5 h-5 border-2 border-dark-950/40 border-t-dark-950 rounded-full animate-spin" />
                    Processing payment...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Pay {amount} and Activate
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center justify-center gap-4 mt-5 text-xs text-dark-600">
              <span className="flex items-center gap-1"><Shield size={11} /> SSL Encrypted</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Lock size={11} /> PCI Compliant</span>
              <span>·</span>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 1: Plan selection ────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="pt-24 pb-20 max-w-5xl mx-auto px-4 sm:px-6">

        <div className="text-center mb-14">
          <p className="section-label mb-3">Simple Pricing</p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-dark-50 tracking-tight mb-4">
            One subscription.<br />Endless impact.
          </h1>
          <p className="text-dark-400 text-lg max-w-lg mx-auto">
            Play golf, enter monthly prize draws, and support charity.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">

          {/* Monthly */}
          <div className="card hover:border-brand-500/40 transition-all duration-200 cursor-pointer group"
            onClick={() => selectPlan('monthly')}>
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
                  <Check size={15} className="text-brand-400 flex-shrink-0" />{f}
                </li>
              ))}
            </ul>
            <div className="btn-primary w-full flex items-center justify-center gap-2 group-hover:scale-[1.01] transition-transform">
              Get Started <ArrowRight size={15} />
            </div>
          </div>

          {/* Yearly */}
          <div className="card border-gold-500/30 hover:border-gold-500/60 transition-all duration-200 cursor-pointer group relative"
            onClick={() => selectPlan('yearly')}>
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
              {FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-dark-300">
                  <Check size={15} className="text-brand-400 flex-shrink-0" />{f}
                </li>
              ))}
              {YEARLY_EXTRAS.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <Check size={15} className="text-gold-400 flex-shrink-0" />
                  <span className="text-gold-300">{f}</span>
                </li>
              ))}
            </ul>
            <div className="btn-gold w-full flex items-center justify-center gap-2 group-hover:scale-[1.01] transition-transform">
              Get Started <ArrowRight size={15} />
            </div>
          </div>
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap justify-center gap-8 text-sm text-dark-500">
          <span className="flex items-center gap-2"><Shield size={15} className="text-brand-500" />Secure payments</span>
          <span className="flex items-center gap-2"><Heart size={15} className="text-red-500" />10% min to charity</span>
          <span className="flex items-center gap-2"><Zap size={15} className="text-gold-500" />Instant activation</span>
          <span className="flex items-center gap-2"><Trophy size={15} className="text-brand-500" />Cancel anytime</span>
        </div>
      </div>
    </div>
  )
}
