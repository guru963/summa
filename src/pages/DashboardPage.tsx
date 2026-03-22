import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { Link, useSearchParams } from 'react-router-dom'
import { Target, Trophy, Heart, ArrowRight, Calendar, Award, Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { useScores, useCharity, useDraws, useMyEntries, useTotalDonated } from '@/hooks/useSupabaseData'
import { formatCurrency, formatDate, formatMonth, getScoreColor } from '@/lib/drawEngine'

export default function DashboardPage() {
  const { user, refreshUser } = useAuth()
  const [searchParams] = useSearchParams()

  // Handle return from Stripe Checkout
  useEffect(() => {
    const payment = searchParams.get('payment')
    if (payment === 'success') {
      toast.success('Payment successful! Your subscription is now active.')
      refreshUser()
    } else if (payment === 'cancelled') {
      toast.error('Payment cancelled. You can try again anytime.')
    }
  }, [])
  const { scores, loading: scoresLoading } = useScores(user?.id)
  const selectedCharity = useCharity(user?.charity_id)
  const { draws, loading: drawsLoading } = useDraws()
  const { entries } = useMyEntries(user?.id)
  const totalDonated = useTotalDonated(user?.id)

  const latestDraw = draws[0] ?? null
  const myLatestEntry = entries.find(e => e.draw_id === latestDraw?.id)
  const monthlyAmount = user?.subscription_plan === 'yearly' ? 99.99 / 12 : 9.99
  const charityAmount = monthlyAmount * ((user?.charity_percentage ?? 10) / 100)

  const daysLeft = user?.subscription_renewal_date
    ? Math.max(0, Math.ceil((new Date(user.subscription_renewal_date).getTime() - Date.now()) / 86400000))
    : 0

  const wonEntries = entries.filter(e => e.prize_amount && e.prize_amount > 0)

  return (
    <DashboardLayout title="Dashboard" subtitle={`Welcome back, ${user?.full_name?.split(' ')[0]}!`}>
      <div className="space-y-6">

        {/* Inactive banner */}
        {user?.subscription_status !== 'active' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
            <p className="text-red-300 text-sm">Your subscription is inactive. Activate to enter draws and start earning.</p>
            <Link to="/subscribe" className="btn-primary text-sm py-2 flex-shrink-0">Activate Plan</Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-dark-500 text-sm">Subscription</span>
              <div className={`w-2 h-2 rounded-full ${user?.subscription_status === 'active' ? 'bg-brand-400 animate-pulse' : 'bg-red-400'}`} />
            </div>
            <p className="font-display font-bold text-xl text-dark-50 capitalize">{user?.subscription_status}</p>
            <p className="text-dark-600 text-xs mt-1">
              {user?.subscription_status === 'active' ? `${daysLeft} days until renewal` : 'No active plan'}
            </p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-dark-500 text-sm">Scores Entered</span>
              <Target size={16} className="text-blue-400" />
            </div>
            <p className="font-display font-bold text-xl text-dark-50">
              {scoresLoading ? '—' : `${scores.length} / 5`}
            </p>
            <p className="text-dark-600 text-xs mt-1">
              {scores[0] ? `Last: ${formatDate(scores[0].played_at)}` : 'No scores yet'}
            </p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-dark-500 text-sm">Draws Entered</span>
              <Trophy size={16} className="text-gold-400" />
            </div>
            <p className="font-display font-bold text-xl text-dark-50">{entries.length}</p>
            <p className="text-dark-600 text-xs mt-1">All time</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-dark-500 text-sm">Charity Given</span>
              <Heart size={16} className="text-red-400" />
            </div>
            <p className="font-display font-bold text-xl text-dark-50">{formatCurrency(totalDonated)}</p>
            <p className="text-dark-600 text-xs mt-1">{user?.charity_percentage ?? 10}% of subscription</p>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Scores */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display font-semibold text-dark-100">My Scores</h2>
                <p className="text-dark-600 text-xs mt-0.5">Latest 5 Stableford scores (your draw numbers)</p>
              </div>
              <Link to="/scores" className="text-brand-400 text-sm hover:text-brand-300 flex items-center gap-1">
                Manage <ArrowRight size={14} />
              </Link>
            </div>

            {scoresLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={24} className="text-dark-600 animate-spin" />
              </div>
            ) : scores.length === 0 ? (
              <div className="text-center py-10">
                <Target size={32} className="text-dark-700 mx-auto mb-3" />
                <p className="text-dark-500 text-sm mb-4">No scores yet — add your first round!</p>
                <Link to="/scores" className="btn-primary text-sm py-2 px-5">Add First Score</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {scores.map((score, i) => (
                  <div key={score.id} className="flex items-center gap-4">
                    <div className={`score-ball ${getScoreColor(score.score)}`}>{score.score}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-dark-200 text-sm font-medium">Round {i + 1}</span>
                        <span className="text-dark-500 text-xs">{formatDate(score.played_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-dark-800 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(score.score / 45) * 100}%` }} />
                        </div>
                        <span className="text-dark-600 text-xs">{score.score}/45</span>
                      </div>
                    </div>
                    {/* Highlight if score matches latest draw */}
                    {latestDraw?.winning_numbers.includes(score.score) && (
                      <span className="badge-green text-[10px] flex-shrink-0">Match!</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">

            {/* Latest Draw */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-dark-100 text-sm">Latest Draw</h3>
                <Link to="/draw" className="text-brand-400 text-xs hover:text-brand-300 flex items-center gap-1">
                  View <ArrowRight size={12} />
                </Link>
              </div>

              {drawsLoading ? (
                <Loader2 size={18} className="text-dark-600 animate-spin" />
              ) : !latestDraw ? (
                <p className="text-dark-600 text-sm">No draws published yet</p>
              ) : (
                <>
                  <p className="text-dark-500 text-xs mb-3">{formatMonth(latestDraw.draw_month)}</p>
                  <div className="flex gap-1.5 mb-4 flex-wrap">
                    {latestDraw.winning_numbers.map((n, i) => (
                      <div key={i} className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2
                        ${scores.some(s => s.score === n)
                          ? 'border-brand-400 text-brand-400 bg-brand-400/10'
                          : 'border-dark-600 text-dark-500'}`}>
                        {n}
                      </div>
                    ))}
                  </div>
                  {myLatestEntry?.match_type ? (
                    <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Award size={14} className="text-brand-400" />
                        <span className="text-brand-400 text-xs font-semibold">{myLatestEntry.match_type}-Number Match!</span>
                      </div>
                      <p className="text-dark-300 text-xs">Prize: {formatCurrency(myLatestEntry.prize_amount ?? 0)}</p>
                    </div>
                  ) : myLatestEntry ? (
                    <p className="text-dark-500 text-xs">You entered — no match this draw</p>
                  ) : (
                    <p className="text-dark-600 text-xs">You weren't entered in this draw</p>
                  )}
                </>
              )}
            </div>

            {/* My Charity */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-dark-100 text-sm">My Charity</h3>
                <Link to="/profile" className="text-brand-400 text-xs hover:text-brand-300">Change</Link>
              </div>
              {selectedCharity ? (
                <div>
                  <div className="h-20 rounded-xl overflow-hidden mb-3 bg-dark-800">
                    {selectedCharity.image_url && (
                      <img src={selectedCharity.image_url} alt={selectedCharity.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <p className="text-dark-100 text-sm font-medium mb-1">{selectedCharity.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-dark-500 text-xs">{user?.charity_percentage}% of subscription</span>
                    <span className="text-brand-400 text-xs font-semibold">{formatCurrency(charityAmount)}/mo</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Heart size={24} className="text-dark-700 mx-auto mb-2" />
                  <p className="text-dark-500 text-sm mb-3">No charity selected</p>
                  <Link to="/charities" className="text-brand-400 text-sm hover:text-brand-300">Browse Charities →</Link>
                </div>
              )}
            </div>

            {/* Next draw */}
            <div className="card border-gold-500/20 bg-gradient-to-br from-dark-900 to-dark-950">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-gold-400" />
                <span className="text-gold-400 text-xs font-semibold uppercase tracking-wide">Next Draw</span>
              </div>
              <p className="font-display font-bold text-dark-50 text-lg mb-1">
                {new Date(Date.now() + 30 * 86400000).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </p>
              <p className="text-dark-500 text-xs mb-2">Your {scores.length}/5 scores are your entry numbers</p>
              {scores.length < 5 && (
                <Link to="/scores" className="text-brand-400 text-xs hover:text-brand-300">
                  Add {5 - scores.length} more score{5 - scores.length !== 1 ? 's' : ''} →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Winnings */}
        {wonEntries.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-dark-100">My Winnings</h2>
              <Link to="/winners" className="text-brand-400 text-sm hover:text-brand-300 flex items-center gap-1">
                Verify / Claim <ArrowRight size={14} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-800">
                    {['Draw', 'Match', 'Prize', 'Status'].map(h => (
                      <th key={h} className="text-left text-dark-500 font-medium py-2 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {wonEntries.map(e => (
                    <tr key={e.id} className="table-row">
                      <td className="py-3 pr-4 text-dark-300">
                        {formatMonth(draws.find(d => d.id === e.draw_id)?.draw_month ?? '')}
                      </td>
                      <td className="py-3 pr-4 text-dark-300">{e.match_type}-Number</td>
                      <td className="py-3 pr-4 font-semibold text-brand-400">{formatCurrency(e.prize_amount!)}</td>
                      <td className="py-3"><span className="badge-gold">Pending Verification</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
