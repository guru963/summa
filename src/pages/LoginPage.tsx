import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trophy, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const { signIn, user } = useAuth()
  const navigate = useNavigate()

  // Once user is set after login, redirect based on role
  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!email.trim()) { setFormError('Please enter your email'); return }
    if (!password) { setFormError('Please enter your password'); return }
    setLoading(true)
    const { error } = await signIn(email.trim(), password)
    setLoading(false)
    if (error) {
      // Make Supabase errors more readable
      if (error.toLowerCase().includes('invalid login credentials')) {
        setFormError('Incorrect email or password. Please try again.')
      } else if (error.toLowerCase().includes('email not confirmed')) {
        setFormError('Please check your email and confirm your account first.')
      } else {
        setFormError(error)
      }
      return
    }
    toast.success('Welcome back!')
    // Admins go straight to admin panel
    const stored = sessionStorage.getItem('pfg_user')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Left form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Trophy size={16} className="text-dark-950" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              Par<span className="text-brand-400">For</span>Good
            </span>
          </Link>

          <h1 className="font-display font-bold text-3xl text-dark-50 mb-2">Welcome back</h1>
          <p className="text-dark-400 mb-8">Sign in with your registered account</p>

          {/* Error display */}
          {formError && (
            <div className="flex gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-5">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{formError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setFormError(null) }}
                className="input-field"
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setFormError(null) }}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-dark-950/50 border-t-dark-950 rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </button>
          </form>

          <p className="text-center text-dark-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium">Create one free</Link>
          </p>
        </div>
      </div>

      {/* Right visual */}
      <div className="hidden lg:flex flex-1 bg-dark-900 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="orb orb-green w-[500px] h-[500px] top-[-100px] right-[-100px]" />
          <div className="orb orb-gold w-[300px] h-[300px] bottom-[-50px] left-[-50px] opacity-50" />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 bg-brand-500/10 border border-brand-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Trophy size={40} className="text-brand-400" />
          </div>
          <h2 className="font-display font-bold text-3xl text-dark-50 mb-4">
            Golf meets<br />charity &amp; prizes
          </h2>
          <p className="text-dark-500 text-base leading-relaxed max-w-xs mx-auto">
            Track your Stableford scores, enter monthly draws, and support causes that matter.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 max-w-sm mx-auto">
            {[
              { label: 'Prize Pool', value: '£14,200' },
              { label: 'Charity Given', value: '£184k+' },
              { label: 'Active Members', value: '2,847' },
              { label: 'Charities', value: '24' },
            ].map((s, i) => (
              <div key={i} className="glass p-4 text-center">
                <div className="font-display font-bold text-xl text-dark-50">{s.value}</div>
                <div className="text-dark-500 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
