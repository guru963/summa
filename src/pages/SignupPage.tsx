import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trophy, Eye, EyeOff, ArrowRight, Check, AlertCircle, Mail } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

const PERKS = [
  'Monthly prize draws with real cash prizes',
  'Automatic charity contributions from day one',
  'Track unlimited Stableford score rounds',
  'Jackpot rolls over if unclaimed',
]

export default function SignupPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const update = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!form.fullName.trim()) { setFormError('Please enter your full name'); return }
    if (!form.email.trim()) { setFormError('Please enter your email address'); return }
    if (!form.password) { setFormError('Please enter a password'); return }
    if (form.password.length < 6) { setFormError('Password must be at least 6 characters'); return }
    if (form.password !== form.confirmPassword) { setFormError('Passwords do not match'); return }

    setLoading(true)
    const { error } = await signUp(form.email.trim(), form.password, form.fullName.trim())
    setLoading(false)

    if (error) {
      if (error.toLowerCase().includes('already registered') || error.toLowerCase().includes('already exists')) {
        setFormError('An account with this email already exists. Please sign in instead.')
      } else {
        setFormError(error)
      }
      return
    }

    // Check if we got redirected to dashboard (email confirm disabled)
    // or if we need to show confirmation message
    // The AuthContext will auto-navigate if session exists
    // Otherwise show the confirmation screen
    setConfirmationSent(true)
  }

  // ── Confirmation sent screen ─────────────────────────────
  if (confirmationSent) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-brand-500/10 border border-brand-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Mail size={36} className="text-brand-400" />
          </div>
          <h1 className="font-display font-bold text-3xl text-dark-50 mb-3">Check your email</h1>
          <p className="text-dark-400 mb-2">
            We sent a confirmation link to
          </p>
          <p className="text-brand-400 font-semibold mb-6">{form.email}</p>
          <p className="text-dark-500 text-sm mb-8">
            Click the link in the email to activate your account, then come back here to sign in.
            <br /><br />
            <strong className="text-dark-400">Tip:</strong> If you don't see it, check your spam folder.
          </p>
          <Link to="/login" className="btn-primary inline-flex items-center gap-2">
            Go to Sign In <ArrowRight size={16} />
          </Link>
          <p className="text-dark-600 text-xs mt-6">
            Wrong email?{' '}
            <button
              onClick={() => { setConfirmationSent(false); setForm(f => ({ ...f, email: '' })) }}
              className="text-dark-400 hover:text-dark-200 underline"
            >
              Go back
            </button>
          </p>
        </div>
      </div>
    )
  }

  // ── Sign up form ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Left visual */}
      <div className="hidden lg:flex flex-1 bg-dark-900 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="orb orb-green w-[400px] h-[400px] top-[10%] left-[-50px] opacity-70" />
          <div className="orb orb-gold w-[350px] h-[350px] bottom-[5%] right-[-80px] opacity-40" />
        </div>
        <div className="relative z-10 px-12 max-w-md">
          <Link to="/" className="flex items-center gap-2.5 mb-12">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Trophy size={16} className="text-dark-950" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              Par<span className="text-brand-400">For</span>Good
            </span>
          </Link>
          <h2 className="font-display font-bold text-4xl text-dark-50 leading-tight mb-6">
            Join the movement.<br />Play with purpose.
          </h2>
          <p className="text-dark-400 text-base mb-10">
            Every round matters. Every subscription creates impact. Be part of a golfing community that gives back.
          </p>
          <ul className="space-y-4">
            {PERKS.map((perk, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-brand-500/20 border border-brand-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={11} className="text-brand-400" />
                </div>
                <span className="text-dark-300 text-sm">{perk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
                <Trophy size={14} className="text-dark-950" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight">
                Par<span className="text-brand-400">For</span>Good
              </span>
            </Link>
          </div>

          <h1 className="font-display font-bold text-3xl text-dark-50 mb-2">Create your account</h1>
          <p className="text-dark-400 mb-6">Start free — choose your plan after signup</p>

          {/* Error */}
          {formError && (
            <div className="flex gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-5">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-red-300">{formError}</p>
                {formError.includes('already exists') && (
                  <Link to="/login" className="text-brand-400 hover:text-brand-300 mt-1 inline-block">
                    → Go to sign in
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={e => update('fullName', e.target.value)}
                className="input-field"
                placeholder="Jamie Wilson"
                autoComplete="name"
                autoFocus
              />
            </div>
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  className="input-field pr-12"
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={e => update('confirmPassword', e.target.value)}
                className="input-field"
                placeholder="Repeat password"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 group mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? <span className="w-5 h-5 border-2 border-dark-950/50 border-t-dark-950 rounded-full animate-spin" />
                : <><span>Create account</span><ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" /></>
              }
            </button>
          </form>

          <p className="text-center text-dark-500 text-xs mt-5">
            By signing up, you agree to our{' '}
            <a href="#" className="text-dark-400 hover:text-dark-200">Terms of Service</a>{' '}and{' '}
            <a href="#" className="text-dark-400 hover:text-dark-200">Privacy Policy</a>.
          </p>
          <p className="text-center text-dark-500 text-sm mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
