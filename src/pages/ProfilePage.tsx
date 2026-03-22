import { useState } from 'react'
import { User, Heart, CreditCard, Save, ChevronRight, AlertCircle } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { DEMO_CHARITIES } from '@/lib/demoData'
import { formatDate, formatCurrency } from '@/lib/drawEngine'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [charityPct, setCharityPct] = useState(user?.charity_percentage || 10)
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [selectedCharity, setSelectedCharity] = useState(user?.charity_id || '')
  const [tab, setTab] = useState<'profile' | 'subscription' | 'charity'>('profile')

  const monthlyAmount = user?.subscription_plan === 'yearly' ? 99.99 / 12 : 9.99
  const charityMonthly = monthlyAmount * (charityPct / 100)

  // Save profile name
  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() || user.full_name })
      .eq('id', user.id)
    if (error) { toast.error('Failed to save. Please try again.'); setSaving(false); return }
    await refreshUser()
    setSaving(false)
    toast.success('Profile updated!')
  }

  // Save charity percentage
  const saveCharity = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        charity_percentage: charityPct,
        charity_id: selectedCharity || null,
      })
      .eq('id', user.id)
    if (error) { toast.error('Failed to save. Please try again.'); setSaving(false); return }
    await refreshUser()
    setSaving(false)
    toast.success('Charity settings saved!')
  }

  // Cancel subscription
  const cancelSubscription = async () => {
    if (!user) return
    if (!window.confirm('Are you sure you want to cancel your subscription?')) return
    setCancelling(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'cancelled',
        subscription_plan: null,
        subscription_renewal_date: null,
      })
      .eq('id', user.id)
    if (error) { toast.error('Failed to cancel. Please try again.'); setCancelling(false); return }
    await refreshUser()
    setCancelling(false)
    toast.success('Subscription cancelled.')
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'charity', label: 'Charity', icon: Heart },
  ] as const

  return (
    <DashboardLayout title="Profile & Settings">
      <div className="max-w-2xl space-y-6">

        {/* User card */}
        <div className="card flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-700 rounded-2xl flex items-center justify-center font-display font-bold text-2xl text-white flex-shrink-0">
            {user?.full_name?.charAt(0) ?? '?'}
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-dark-50">{user?.full_name}</h2>
            <p className="text-dark-500 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge ${user?.subscription_status === 'active' ? 'badge-green' : 'badge-red'}`}>
                {user?.subscription_status}
              </span>
              {user?.subscription_plan && (
                <span className="text-dark-600 text-xs capitalize">{user.subscription_plan} plan</span>
              )}
              {user?.role === 'admin' && <span className="badge-gold">Admin</span>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-900 border border-dark-800 p-1 rounded-xl">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === id ? 'bg-dark-700 text-dark-50' : 'text-dark-500 hover:text-dark-300'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <div className="card space-y-5">
            <h3 className="font-display font-semibold text-dark-100">Personal Information</h3>
            <div>
              <label className="label">Full Name</label>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="input-field"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input
                value={user?.email ?? ''}
                className="input-field opacity-60 cursor-not-allowed"
                readOnly
              />
              <p className="text-dark-600 text-xs mt-1">Email cannot be changed here</p>
            </div>
            <div>
              <label className="label">Member Since</label>
              <input
                value={user?.created_at ? formatDate(user.created_at) : '—'}
                className="input-field opacity-60 cursor-not-allowed"
                readOnly
              />
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {saving
                ? <span className="w-4 h-4 border-2 border-dark-950/40 border-t-dark-950 rounded-full animate-spin" />
                : <Save size={15} />
              }
              Save Changes
            </button>
          </div>
        )}

        {/* ── SUBSCRIPTION TAB ── */}
        {tab === 'subscription' && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-display font-semibold text-dark-100 mb-5">Current Plan</h3>
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-xl mb-4">
                <div>
                  <p className="font-semibold text-dark-100 capitalize">
                    {user?.subscription_plan ? `${user.subscription_plan} plan` : 'No active plan'}
                  </p>
                  <p className="text-dark-500 text-sm">
                    {user?.subscription_plan === 'yearly' ? '£99.99 / year'
                      : user?.subscription_plan === 'monthly' ? '£9.99 / month'
                      : 'Subscribe to enter draws'}
                  </p>
                </div>
                <span className={`badge ${user?.subscription_status === 'active' ? 'badge-green' : 'badge-red'}`}>
                  {user?.subscription_status}
                </span>
              </div>
              {user?.subscription_renewal_date && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dark-500">Renewal date</span>
                  <span className="text-dark-200">{formatDate(user.subscription_renewal_date)}</span>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="font-display font-semibold text-dark-100 mb-4">Actions</h3>
              <div className="space-y-3">
                {user?.subscription_status !== 'active' ? (
                  <Link
                    to="/subscribe"
                    className="flex items-center justify-between p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl hover:bg-brand-500/15 transition-colors"
                  >
                    <span className="text-brand-300 text-sm font-medium">Activate a plan</span>
                    <ChevronRight size={16} className="text-brand-500" />
                  </Link>
                ) : (
                  <Link
                    to="/subscribe"
                    className="flex items-center justify-between p-3 bg-dark-800 rounded-xl hover:bg-dark-700 transition-colors"
                  >
                    <span className="text-dark-200 text-sm">
                      {user.subscription_plan === 'monthly' ? 'Upgrade to Yearly (save 17%)' : 'View plan details'}
                    </span>
                    <ChevronRight size={16} className="text-dark-500" />
                  </Link>
                )}

                {user?.subscription_status === 'active' && (
                  <button
                    onClick={cancelSubscription}
                    disabled={cancelling}
                    className="flex items-center justify-between w-full p-3 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/15 transition-colors text-left disabled:opacity-50"
                  >
                    <span className="text-red-400 text-sm flex items-center gap-2">
                      {cancelling && <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />}
                      Cancel subscription
                    </span>
                    <ChevronRight size={16} className="text-red-500" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── CHARITY TAB ── */}
        {tab === 'charity' && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-display font-semibold text-dark-100 mb-2">Charity Contribution</h3>
              <p className="text-dark-500 text-sm mb-5">
                Adjust what percentage of your subscription goes to your chosen charity (minimum 10%).
              </p>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="label mb-0">Contribution percentage</label>
                  <span className="font-display font-bold text-2xl text-brand-400">{charityPct}%</span>
                </div>
                <input
                  type="range" min="10" max="50" step="5"
                  value={charityPct}
                  onChange={e => setCharityPct(Number(e.target.value))}
                  className="w-full accent-brand-500"
                />
                <div className="flex justify-between text-xs text-dark-600 mt-1">
                  <span>10% (min)</span><span>50% (max)</span>
                </div>
              </div>

              <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-dark-400 text-sm">Monthly charity contribution</span>
                  <span className="font-display font-bold text-xl text-brand-400">{formatCurrency(charityMonthly)}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-display font-semibold text-dark-100 mb-4">Select Charity</h3>
              <div className="space-y-2">
                {DEMO_CHARITIES.slice(0, 6).map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCharity(c.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      selectedCharity === c.id
                        ? 'border-brand-500/40 bg-brand-500/10'
                        : 'border-dark-700 bg-dark-800 hover:border-dark-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-dark-700 flex-shrink-0">
                        {c.image_url && <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${selectedCharity === c.id ? 'text-brand-300' : 'text-dark-200'}`}>{c.name}</p>
                        <p className="text-xs text-dark-600">{c.category}</p>
                      </div>
                    </div>
                    {selectedCharity === c.id && (
                      <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-dark-950 text-xs font-bold">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <Link to="/charities" className="block text-center text-brand-400 text-sm mt-4 hover:text-brand-300">
                Browse all charities →
              </Link>

              <button
                onClick={saveCharity}
                disabled={saving}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {saving
                  ? <span className="w-4 h-4 border-2 border-dark-950/40 border-t-dark-950 rounded-full animate-spin" />
                  : <Save size={15} />
                }
                Save Charity Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
