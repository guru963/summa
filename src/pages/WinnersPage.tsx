import { useState } from 'react'
import { Upload, Award, CheckCircle, Clock, XCircle, Info, Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useMyVerifications, useMyEntries, useDraws, submitVerificationSmart } from '@/hooks/useSupabaseData'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency, formatMonth, formatDate } from '@/lib/drawEngine'
import toast from 'react-hot-toast'

export default function WinnersPage() {
  const { user } = useAuth()
  const { entries } = useMyEntries(user?.id)
  const { draws } = useDraws()
  const { verifications, loading, refetch } = useMyVerifications(user?.id)
  const [proofInputs, setProofInputs] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<string | null>(null)

  const wonEntries = entries.filter(e => e.prize_amount && e.prize_amount > 0)

  const handleSubmit = async (drawId: string) => {
    const proof = proofInputs[drawId]?.trim()
    if (!proof) { toast.error('Please enter a proof URL or description'); return }
    if (!user?.id) return
    setSubmitting(drawId)
    const { error, autoApproved, matchScore } = await submitVerificationSmart(user.id, drawId, proof)
    setSubmitting(null)
    if (error) { toast.error(error); return }
    if (autoApproved) {
      toast.success(`✅ Auto-verified! Your scores matched ${matchScore.toFixed(0)}% — approved instantly.`)
    } else {
      toast.success(`Proof submitted. Admin will review within 48 hours. (${matchScore.toFixed(0)}% score match)`)
    }
    setProofInputs(prev => ({ ...prev, [drawId]: '' }))
    refetch()
  }

  const getVerification = (drawId: string) => verifications.find(v => v.draw_id === drawId)

  return (
    <DashboardLayout title="Winners & Payouts" subtitle="Verify wins and track prize payments">
      <div className="max-w-2xl space-y-6">

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
          <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-blue-300 text-sm">
            <p className="font-medium mb-1">How prize verification works</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-400/80 text-xs">
              <li>You win a prize when 3, 4, or 5 of your scores match the draw numbers</li>
              <li>Submit a screenshot/URL showing your scores from your golf platform</li>
              <li>Admin reviews and approves within 48 hours</li>
              <li>Payment is processed to your registered account</li>
            </ol>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="text-dark-600 animate-spin" />
          </div>
        ) : wonEntries.length === 0 ? (
          <div className="card text-center py-16">
            <Award size={48} className="text-dark-700 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-dark-200 mb-2">No wins yet</h3>
            <p className="text-dark-500 text-sm">Match 3, 4, or 5 draw numbers to win prizes.</p>
            <p className="text-dark-600 text-xs mt-2">Make sure your scores are entered before each draw!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {wonEntries.map(entry => {
              const draw = draws.find(d => d.id === entry.draw_id)
              const verification = getVerification(entry.draw_id)

              return (
                <div key={entry.id} className="card">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gold-500/10 border border-gold-500/20 rounded-xl flex items-center justify-center">
                        <Award size={20} className="text-gold-400" />
                      </div>
                      <div>
                        <p className="font-display font-semibold text-dark-100">
                          {entry.match_type}-Number Match Win!
                        </p>
                        <p className="text-dark-500 text-xs mt-0.5">
                          {draw ? formatMonth(draw.draw_month) : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-display font-bold text-2xl text-brand-400">
                        {formatCurrency(entry.prize_amount!)}
                      </p>
                      <p className="text-dark-600 text-xs">Prize amount</p>
                    </div>
                  </div>

                  {/* Matching numbers */}
                  <div className="mb-5">
                    <p className="text-dark-600 text-xs mb-2">Your scores vs winning numbers</p>
                    <div className="flex gap-2 flex-wrap">
                      {entry.scores_snapshot.map((n, i) => {
                        const isMatch = draw?.winning_numbers.includes(n)
                        return (
                          <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border-2
                            ${isMatch ? 'border-brand-400 text-brand-400 bg-brand-400/10' : 'border-dark-700 text-dark-600'}`}>
                            {n}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Verification status or upload form */}
                  {verification ? (
                    <div className={`rounded-xl p-4 border ${
                      verification.status === 'approved' ? 'bg-brand-500/10 border-brand-500/20' :
                      verification.status === 'rejected' ? 'bg-red-500/10 border-red-500/20' :
                      'bg-gold-500/10 border-gold-500/20'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {verification.status === 'approved' && <CheckCircle size={16} className="text-brand-400" />}
                          {verification.status === 'rejected' && <XCircle size={16} className="text-red-400" />}
                          {verification.status === 'pending' && <Clock size={16} className="text-gold-400" />}
                          <span className="font-semibold text-sm text-dark-100 capitalize">
                            {verification.status}
                          </span>
                        </div>
                        <span className={`badge text-xs ${verification.payment_status === 'paid' ? 'badge-green' : 'badge-gold'}`}>
                          {verification.payment_status === 'paid' ? '✓ Paid' : 'Payment pending'}
                        </span>
                      </div>
                      <p className="text-dark-500 text-xs">Submitted {formatDate(verification.created_at)}</p>
                      {verification.admin_notes && (
                        <p className="text-dark-400 text-sm mt-2 italic">Note: {verification.admin_notes}</p>
                      )}
                    </div>
                  ) : (
                    <div className="border border-dark-700 rounded-xl p-4 space-y-3">
                      <p className="text-dark-200 text-sm font-medium">Submit proof to claim your prize</p>
                      <p className="text-dark-600 text-xs">
                        Paste the URL of your scorecard or describe where your scores can be verified.
                      </p>
                      <div>
                        <label className="label">Proof URL or description</label>
                        <input
                          type="text"
                          value={proofInputs[entry.draw_id] ?? ''}
                          onChange={e => setProofInputs(prev => ({ ...prev, [entry.draw_id]: e.target.value }))}
                          className="input-field"
                          placeholder="https://my-golf-app.com/scorecard/..."
                        />
                      </div>
                      <button
                        onClick={() => handleSubmit(entry.draw_id)}
                        disabled={submitting === entry.draw_id}
                        className="btn-primary text-sm py-2.5 flex items-center gap-2 disabled:opacity-50"
                      >
                        {submitting === entry.draw_id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Upload size={14} />
                        }
                        Submit Proof
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Summary */}
        {wonEntries.length > 0 && (
          <div className="card">
            <h3 className="font-display font-semibold text-dark-100 mb-4">Earnings Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-800 rounded-xl p-4">
                <p className="text-dark-500 text-xs mb-1">Total Won</p>
                <p className="font-display font-bold text-xl text-brand-400">
                  {formatCurrency(wonEntries.reduce((a, e) => a + (e.prize_amount ?? 0), 0))}
                </p>
              </div>
              <div className="bg-dark-800 rounded-xl p-4">
                <p className="text-dark-500 text-xs mb-1">Verified</p>
                <p className="font-display font-bold text-xl text-gold-400">
                  {verifications.filter(v => v.status === 'approved').length} / {wonEntries.length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
