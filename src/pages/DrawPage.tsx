import { useState } from 'react'
import { Trophy, Calendar, ChevronDown, ChevronUp, RotateCcw, Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useDraws, useMyEntries, useScores } from '@/hooks/useSupabaseData'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency, formatMonth } from '@/lib/drawEngine'

export default function DrawPage() {
  const { user } = useAuth()
  const { draws, loading: drawsLoading } = useDraws()
  const { scores } = useScores(user?.id)
  const { entries } = useMyEntries(user?.id)
  const [expanded, setExpanded] = useState<string | null>(draws[0]?.id ?? null)
  const [revealedNums, setRevealedNums] = useState<Record<string, number[]>>({})

  const userScores = scores.map(s => s.score)
  const latestDraw = draws[0]

  const replayDraw = (draw: typeof draws[0]) => {
    setRevealedNums(prev => ({ ...prev, [draw.id]: [] }))
    draw.winning_numbers.forEach((n, i) => {
      setTimeout(() => {
        setRevealedNums(prev => ({ ...prev, [draw.id]: [...(prev[draw.id] ?? []), n] }))
      }, (i + 1) * 500)
    })
  }

  const getEntry = (drawId: string) => entries.find(e => e.draw_id === drawId)

  if (drawsLoading) {
    return (
      <DashboardLayout title="Monthly Draw">
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="text-dark-600 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Monthly Draw" subtitle="Your draw entries and results">
      <div className="max-w-3xl space-y-6">

        {/* Jackpot banner */}
        {latestDraw && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gold-900/40 via-dark-900 to-dark-900 border border-gold-500/30 p-6">
            <div className="absolute inset-0 pointer-events-none">
              <div className="orb orb-gold w-[300px] h-[200px] -right-20 -top-10 opacity-30" />
            </div>
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-gold-400 rounded-full animate-pulse" />
                  <span className="text-gold-400 text-xs font-semibold uppercase tracking-wide">Latest Jackpot</span>
                </div>
                <p className="font-display font-bold text-4xl sm:text-5xl text-dark-50">
                  {formatCurrency(latestDraw.jackpot_amount)}
                </p>
                <p className="text-dark-400 text-sm mt-1">{formatMonth(latestDraw.draw_month)}</p>
              </div>
              <Trophy size={48} className="text-gold-400/30 flex-shrink-0" />
            </div>
          </div>
        )}

        {/* Your draw numbers */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-semibold text-dark-100">Your Draw Numbers</h2>
              <p className="text-dark-600 text-xs mt-0.5">From your latest 5 Stableford scores</p>
            </div>
            <span className={`badge ${userScores.length === 5 ? 'badge-green' : 'badge-gold'}`}>
              {userScores.length}/5
            </span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {userScores.map((score, i) => (
              <div key={i} className="w-14 h-14 rounded-2xl border-2 border-brand-500/50 bg-brand-500/10 flex items-center justify-center font-display font-bold text-xl text-brand-400">
                {score}
              </div>
            ))}
            {userScores.length === 0 && (
              <p className="text-dark-500 text-sm">Add scores to get your draw numbers</p>
            )}
          </div>
          {userScores.length < 5 && userScores.length > 0 && (
            <p className="text-gold-500 text-xs mt-3">
              ⚠ Add {5 - userScores.length} more score{5 - userScores.length > 1 ? 's' : ''} to maximise your chances
            </p>
          )}
        </div>

        {/* Prize pool */}
        <div className="card">
          <h2 className="font-display font-semibold text-dark-100 mb-5">How Prizes Are Split</h2>
          <div className="space-y-3">
            {[
              { label: '5 Numbers Match', share: '40%', tier: 'Jackpot', color: 'text-gold-400', bg: 'bg-gold-500/10 border-gold-500/20', bar: 'bg-gold-500', rollover: true },
              { label: '4 Numbers Match', share: '35%', tier: 'Major Prize', color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20', bar: 'bg-brand-500', rollover: false },
              { label: '3 Numbers Match', share: '25%', tier: 'Prize', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', bar: 'bg-blue-500', rollover: false },
            ].map((tier, i) => (
              <div key={i} className={`rounded-xl p-4 flex items-center gap-4 border ${tier.bg}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold text-sm ${tier.color}`}>{tier.label}</span>
                    {tier.rollover && <span className="badge-gold text-[10px]">Rolls Over</span>}
                  </div>
                  <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden mt-2">
                    <div className={`h-full ${tier.bar} rounded-full`} style={{ width: tier.share }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`font-display font-bold text-xl ${tier.color}`}>{tier.share}</div>
                  <div className="text-dark-600 text-xs">of pool</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-dark-600 text-xs mt-4">
            Prizes are split equally if multiple winners match. The 5-match jackpot rolls over to the next month if unclaimed.
          </p>
        </div>

        {/* Draw History */}
        <div>
          <h2 className="font-display font-semibold text-dark-100 mb-4">Draw History</h2>

          {draws.length === 0 ? (
            <div className="card text-center py-12">
              <Trophy size={32} className="text-dark-700 mx-auto mb-3" />
              <p className="text-dark-500">No draws have been published yet</p>
              <p className="text-dark-600 text-xs mt-2">The admin publishes draws monthly — check back soon!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {draws.map(draw => {
                const entry = getEntry(draw.id)
                const isExpanded = expanded === draw.id
                const revealed = revealedNums[draw.id] ?? draw.winning_numbers

                return (
                  <div key={draw.id} className="card">
                    <button className="w-full flex items-center justify-between gap-4"
                      onClick={() => setExpanded(isExpanded ? null : draw.id)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center">
                          <Calendar size={18} className="text-dark-400" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-dark-100 text-sm">{formatMonth(draw.draw_month)}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="badge-green text-[10px]">Published</span>
                            <span className="text-dark-600 text-[10px] capitalize">{draw.draw_logic}</span>
                            {draw.rolled_over && <span className="badge-gold text-[10px]">Jackpot rolled</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {entry?.match_type && <span className="badge-green text-xs">{entry.match_type}-Match ✓</span>}
                        {entry?.prize_amount && <span className="text-brand-400 font-bold text-sm">{formatCurrency(entry.prize_amount)}</span>}
                        {isExpanded ? <ChevronUp size={16} className="text-dark-500" /> : <ChevronDown size={16} className="text-dark-500" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-5 pt-5 border-t border-dark-800">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-dark-500 text-sm">Winning Numbers</p>
                          <button onClick={() => replayDraw(draw)}
                            className="flex items-center gap-1.5 text-dark-500 hover:text-brand-400 text-xs transition-colors">
                            <RotateCcw size={12} /> Replay
                          </button>
                        </div>

                        <div className="flex gap-2 flex-wrap mb-4">
                          {draw.winning_numbers.map((n, i) => {
                            const isMyNum = userScores.includes(n)
                            const isRevealed = revealed.includes(n)
                            return (
                              <div key={i} className={`w-12 h-12 rounded-2xl flex items-center justify-center font-display font-bold text-base border-2 transition-all duration-500
                                ${!isRevealed ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}
                                ${isMyNum ? 'border-brand-400 bg-brand-400/20 text-brand-300 shadow-lg shadow-brand-500/20' : 'border-dark-600 bg-dark-800 text-dark-400'}`}>
                                {n}
                              </div>
                            )
                          })}
                        </div>

                        {/* Match result */}
                        {entry?.match_type ? (
                          <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 mb-4">
                            <p className="text-brand-300 font-semibold">{entry.match_type}-Number Match! 🎉</p>
                            <p className="text-dark-400 text-sm mt-1">Prize: <span className="text-brand-400 font-bold">{formatCurrency(entry.prize_amount ?? 0)}</span></p>
                          </div>
                        ) : entry ? (
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex gap-1">
                              {userScores.map((s, j) => (
                                <div key={j} className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold
                                  ${draw.winning_numbers.includes(s) ? 'bg-brand-500/20 text-brand-400' : 'bg-dark-800 text-dark-600'}`}>{s}</div>
                              ))}
                            </div>
                            <span className="text-dark-500 text-xs">
                              {userScores.filter(s => draw.winning_numbers.includes(s)).length} matched (need 3+ to win)
                            </span>
                          </div>
                        ) : (
                          <p className="text-dark-600 text-xs mb-4">You were not entered in this draw</p>
                        )}

                        {/* Pool amounts */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-dark-800 rounded-xl p-3 text-center">
                            <div className="text-dark-500 text-[10px] mb-1">Jackpot</div>
                            <div className="text-gold-400 font-bold text-sm">{formatCurrency(draw.jackpot_amount)}</div>
                          </div>
                          <div className="bg-dark-800 rounded-xl p-3 text-center">
                            <div className="text-dark-500 text-[10px] mb-1">4-Match Pool</div>
                            <div className="text-brand-400 font-bold text-sm">{formatCurrency(draw.tier_4_amount)}</div>
                          </div>
                          <div className="bg-dark-800 rounded-xl p-3 text-center">
                            <div className="text-dark-500 text-[10px] mb-1">3-Match Pool</div>
                            <div className="text-blue-400 font-bold text-sm">{formatCurrency(draw.tier_3_amount)}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
