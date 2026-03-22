import { useState } from 'react'
import { Users, Trophy, Heart, BarChart3, Play, Eye, CheckCircle, XCircle, DollarSign, UserCheck, Shield, Loader2, RefreshCw } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAllUsers, useAllDraws, useAllCharities, useAllVerifications, useAdminStats, publishDraw, updateVerification, markPaid, toggleCharity } from '@/hooks/useSupabaseData'
import type { UserProfile, VerificationWithRelations } from '@/hooks/useSupabaseData'
import { formatCurrency, formatDate, formatMonth, generateRandomDraw, generateAlgorithmicDraw, calculatePrizePool } from '@/lib/drawEngine'
import toast from 'react-hot-toast'

type Tab = 'overview' | 'users' | 'draws' | 'charities' | 'winners'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [drawLogic, setDrawLogic] = useState<'random' | 'algorithmic'>('algorithmic')
  const [simResult, setSimResult] = useState<number[] | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const stats = useAdminStats()
  const { users, loading: usersLoading, refetch: refetchUsers } = useAllUsers()
  const { draws, loading: drawsLoading, refetch: refetchDraws } = useAllDraws()
  const { charities, loading: charitiesLoading, refetch: refetchCharities } = useAllCharities()
  const { verifications, loading: verifLoading, refetch: refetchVerif } = useAllVerifications()

  const activeCount = users.filter(u => u.subscription_status === 'active').length
  const pool = calculatePrizePool(activeCount)
  const pendingVerif = verifications.filter(v => v.status === 'pending')

  const handleSimulate = async () => {
    setSimulating(true)
    await new Promise(r => setTimeout(r, 1200))
    const nums = drawLogic === 'random' ? generateRandomDraw() : generateAlgorithmicDraw([[28, 34, 31, 22, 38]])
    setSimResult(nums)
    setSimulating(false)
    toast.success('Draw simulated! Review numbers before publishing.')
  }

  const handlePublish = async () => {
    if (!simResult) { toast.error('Simulate the draw first'); return }
    setPublishing(true)
    const drawMonth = new Date().toISOString().slice(0, 7)
    const { error } = await publishDraw({
      draw_month: drawMonth,
      draw_logic: drawLogic,
      winning_numbers: simResult,
      jackpot_amount: pool.jackpot,
      tier_4_amount: pool.tier4,
      tier_3_amount: pool.tier3,
      total_subscribers: activeCount,
      rolled_over: false,
    })
    setPublishing(false)
    if (error) { toast.error(error); return }
    toast.success('Draw published! All subscribers have been automatically entered.')
    setSimResult(null)
    refetchDraws()
  }

  const handleVerify = async (id: string, approved: boolean) => {
    const { error } = await updateVerification(id, approved ? 'approved' : 'rejected')
    if (error) { toast.error(error); return }
    toast.success(approved ? 'Winner approved!' : 'Submission rejected.')
    refetchVerif()
  }

  const handleMarkPaid = async (id: string) => {
    const { error } = await markPaid(id)
    if (error) { toast.error(error); return }
    toast.success('Payment marked as completed.')
    refetchVerif()
  }

  const handleToggleCharity = async (id: string, current: boolean) => {
    const { error } = await toggleCharity(id, !current)
    if (error) { toast.error(error); return }
    toast.success(current ? 'Charity disabled' : 'Charity enabled')
    refetchCharities()
  }

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: BarChart3 },
    { id: 'users' as Tab, label: 'Users', icon: Users },
    { id: 'draws' as Tab, label: 'Draws', icon: Trophy },
    { id: 'charities' as Tab, label: 'Charities', icon: Heart },
    { id: 'winners' as Tab, label: 'Winners', icon: UserCheck, badge: pendingVerif.length },
  ]

  return (
    <DashboardLayout title="Admin Panel" subtitle="Full platform control">
      <div className="space-y-6">

        <div className="flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-xl px-4 py-2 w-fit">
          <Shield size={14} className="text-gold-400" />
          <span className="text-gold-400 text-sm font-medium">Administrator — All controls live</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-900 border border-dark-800 p-1 rounded-xl overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === id ? 'bg-dark-700 text-dark-50' : 'text-dark-500 hover:text-dark-300'
              }`}>
              <Icon size={14} />
              {label}
              {badge != null && badge > 0 && (
                <span className="w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">{badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: stats.total_users.toLocaleString(), icon: Users, color: 'text-blue-400' },
                { label: 'Active Subscribers', value: stats.active_subscribers.toLocaleString(), icon: UserCheck, color: 'text-brand-400' },
                { label: 'Total Donations', value: formatCurrency(stats.total_donations), icon: Heart, color: 'text-red-400' },
                { label: 'Pending Reviews', value: stats.pending_verifications.toString(), icon: Trophy, color: 'text-gold-400' },
              ].map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="stat-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-dark-500 text-xs">{s.label}</span>
                      <Icon size={16} className={s.color} />
                    </div>
                    <p className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</p>
                  </div>
                )
              })}
            </div>

            <div className="card">
              <h3 className="font-display font-semibold text-dark-100 mb-4">Current Prize Pool ({activeCount} active subscribers)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-4">
                  <p className="text-gold-400 text-xs mb-1">5-Match Jackpot (40%)</p>
                  <p className="font-display font-bold text-xl text-gold-300">{formatCurrency(pool.jackpot)}</p>
                </div>
                <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4">
                  <p className="text-brand-400 text-xs mb-1">4-Match Pool (35%)</p>
                  <p className="font-display font-bold text-xl text-brand-300">{formatCurrency(pool.tier4)}</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-blue-400 text-xs mb-1">3-Match Pool (25%)</p>
                  <p className="font-display font-bold text-xl text-blue-300">{formatCurrency(pool.tier3)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div className="card overflow-x-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-semibold text-dark-100">All Users ({users.length})</h3>
              <button onClick={refetchUsers} className="btn-secondary text-sm py-2 flex items-center gap-2">
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
            {usersLoading ? <div className="flex justify-center py-8"><Loader2 size={24} className="text-dark-600 animate-spin" /></div> : (
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-dark-800">
                    {['Name', 'Email', 'Plan', 'Status', 'Charity %', 'Role', 'Joined'].map(h => (
                      <th key={h} className="text-left text-dark-500 font-medium py-2 pr-4 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="table-row">
                      <td className="py-3 pr-4 text-dark-200 font-medium">{u.full_name}</td>
                      <td className="py-3 pr-4 text-dark-500 text-xs">{u.email}</td>
                      <td className="py-3 pr-4 text-dark-400 capitalize text-xs">{u.subscription_plan ?? '—'}</td>
                      <td className="py-3 pr-4">
                        <span className={`badge text-[10px] ${u.subscription_status === 'active' ? 'badge-green' : u.subscription_status === 'lapsed' ? 'badge-red' : 'badge-gray'}`}>
                          {u.subscription_status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-brand-400 text-xs">{u.charity_percentage}%</td>
                      <td className="py-3 pr-4">
                        <span className={`badge text-[10px] ${u.role === 'admin' ? 'badge-gold' : 'badge-gray'}`}>{u.role}</span>
                      </td>
                      <td className="py-3 text-dark-600 text-xs">{formatDate(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* DRAWS */}
        {tab === 'draws' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="font-display font-semibold text-dark-100 mb-5">Configure & Run Monthly Draw</h3>
              <div className="mb-5">
                <label className="label">Draw Logic</label>
                <div className="flex gap-3">
                  <button onClick={() => setDrawLogic('random')}
                    className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all ${drawLogic === 'random' ? 'border-brand-500/50 bg-brand-500/10 text-brand-300' : 'border-dark-700 text-dark-500 hover:border-dark-600'}`}>
                    🎲 Random Draw
                    <p className="text-xs font-normal opacity-70 mt-1">Standard lottery-style</p>
                  </button>
                  <button onClick={() => setDrawLogic('algorithmic')}
                    className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all ${drawLogic === 'algorithmic' ? 'border-gold-500/50 bg-gold-500/10 text-gold-300' : 'border-dark-700 text-dark-500 hover:border-dark-600'}`}>
                    ⚡ Algorithmic
                    <p className="text-xs font-normal opacity-70 mt-1">Weighted by score frequency</p>
                  </button>
                </div>
              </div>

              {simResult && (
                <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 mb-5">
                  <p className="text-brand-400 text-xs font-semibold mb-3 uppercase">Simulated Result — Review Before Publishing</p>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {simResult.map((n, i) => (
                      <div key={i} className="w-12 h-12 rounded-xl bg-brand-500/20 border-2 border-brand-500/50 text-brand-300 flex items-center justify-center font-display font-bold text-lg">{n}</div>
                    ))}
                  </div>
                  <p className="text-dark-600 text-xs">Pool: Jackpot {formatCurrency(pool.jackpot)} · 4-match {formatCurrency(pool.tier4)} · 3-match {formatCurrency(pool.tier3)}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={handleSimulate} disabled={simulating}
                  className="btn-secondary flex items-center gap-2 disabled:opacity-50">
                  {simulating ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                  {simulating ? 'Simulating...' : 'Simulate Draw'}
                </button>
                <button onClick={handlePublish} disabled={!simResult || publishing}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50">
                  {publishing ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                  {publishing ? 'Publishing...' : 'Publish Draw'}
                </button>
              </div>
              <p className="text-dark-600 text-xs mt-3">
                Publishing will automatically calculate matches for all {activeCount} active subscribers and create their draw entries.
              </p>
            </div>

            <div className="card">
              <h3 className="font-display font-semibold text-dark-100 mb-4">All Draws</h3>
              {drawsLoading ? <Loader2 size={20} className="text-dark-600 animate-spin" /> : draws.length === 0 ? (
                <p className="text-dark-500 text-sm">No draws yet. Simulate and publish above.</p>
              ) : (
                <div className="space-y-3">
                  {draws.map(draw => (
                    <div key={draw.id} className="flex items-center justify-between p-4 bg-dark-800 rounded-xl gap-4">
                      <div>
                        <p className="font-semibold text-dark-100 text-sm">{formatMonth(draw.draw_month)}</p>
                        <p className="text-dark-500 text-xs mt-0.5">
                          {draw.draw_logic} · {draw.total_subscribers} subscribers
                          {draw.rolled_over && ' · Jackpot rolled over'}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        {draw.winning_numbers.map((n, i) => (
                          <span key={i} className="w-7 h-7 bg-dark-700 rounded-lg text-xs text-dark-300 flex items-center justify-center font-bold">{n}</span>
                        ))}
                      </div>
                      <span className={`badge text-xs flex-shrink-0 ${draw.status === 'published' ? 'badge-green' : 'badge-gray'}`}>{draw.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHARITIES */}
        {tab === 'charities' && (
          <div className="card">
            <h3 className="font-display font-semibold text-dark-100 mb-5">Manage Charities</h3>
            {charitiesLoading ? <Loader2 size={20} className="text-dark-600 animate-spin" /> : (
              <div className="space-y-3">
                {charities.map(c => (
                  <div key={c.id} className="flex items-center gap-4 p-4 bg-dark-800 rounded-xl">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-700 flex-shrink-0">
                      {c.image_url && <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-dark-100 text-sm truncate">{c.name}</p>
                        {c.is_featured && <span className="badge-gold text-[10px]">Featured</span>}
                      </div>
                      <p className="text-dark-500 text-xs">{c.category}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`badge text-xs ${c.is_active ? 'badge-green' : 'badge-red'}`}>
                        {c.is_active ? 'Active' : 'Disabled'}
                      </span>
                      <button onClick={() => handleToggleCharity(c.id, c.is_active)}
                        className="btn-ghost text-xs py-1 px-3 text-dark-500 border border-dark-700 rounded-lg">
                        {c.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WINNERS */}
        {tab === 'winners' && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-semibold text-dark-100">Winner Verifications</h3>
                <button onClick={refetchVerif} className="btn-ghost text-xs flex items-center gap-1.5 text-dark-500">
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>

              {verifLoading ? <Loader2 size={20} className="text-dark-600 animate-spin" /> :
                verifications.length === 0 ? (
                  <p className="text-dark-500 text-sm text-center py-8">No verifications submitted yet</p>
                ) : (
                  <div className="space-y-4">
                    {verifications.map((v: VerificationWithRelations) => (
                      <div key={v.id} className="border border-dark-700 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <p className="font-semibold text-dark-100 text-sm">
                              {v.profiles?.full_name ?? 'Unknown user'}
                            </p>
                            <p className="text-dark-500 text-xs">{v.profiles?.email}</p>
                            <p className="text-dark-600 text-xs mt-1">
                              Draw: {v.draws?.draw_month ? formatMonth(v.draws.draw_month) : v.draw_id}
                              {' · '}Submitted: {formatDate(v.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`badge text-xs ${v.status === 'approved' ? 'badge-green' : v.status === 'rejected' ? 'badge-red' : 'badge-gold'}`}>{v.status}</span>
                            <span className={`badge text-xs ${v.payment_status === 'paid' ? 'badge-green' : 'badge-gray'}`}>{v.payment_status}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4 p-3 bg-dark-800 rounded-lg">
                          <span className="text-dark-500 text-xs">Proof:</span>
                          <a href={v.proof_url} target="_blank" rel="noopener noreferrer" className="text-brand-400 text-xs hover:text-brand-300 truncate">
                            {v.proof_url}
                          </a>
                        </div>

                        <div className="flex gap-2">
                          {v.status === 'pending' && (
                            <>
                              <button onClick={() => handleVerify(v.id, true)} className="btn-primary text-sm py-2 flex items-center gap-2">
                                <CheckCircle size={14} /> Approve
                              </button>
                              <button onClick={() => handleVerify(v.id, false)} className="btn-secondary text-sm py-2 flex items-center gap-2 text-red-400 hover:text-red-300">
                                <XCircle size={14} /> Reject
                              </button>
                            </>
                          )}
                          {v.status === 'approved' && v.payment_status === 'pending' && (
                            <button onClick={() => handleMarkPaid(v.id)} className="btn-gold text-sm py-2 flex items-center gap-2">
                              <DollarSign size={14} /> Mark as Paid
                            </button>
                          )}
                          {v.status === 'approved' && v.payment_status === 'paid' && (
                            <span className="flex items-center gap-2 text-brand-400 text-sm">
                              <CheckCircle size={14} /> Payment completed
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
