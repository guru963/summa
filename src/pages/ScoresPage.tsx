import { useState } from 'react'
import { Plus, Trash2, Edit2, Check, X, Info, Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useScores, addScore, updateScore, deleteScore } from '@/hooks/useSupabaseData'
import { useAuth } from '@/context/AuthContext'
import { formatDate, getScoreColor, getScoreLabel, validateScore } from '@/lib/drawEngine'
import toast from 'react-hot-toast'

export default function ScoresPage() {
  const { user } = useAuth()
  const { scores, loading, refetch } = useScores(user?.id)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [newScore, setNewScore] = useState({ score: '', date: new Date().toISOString().split('T')[0] })
  const [editScore, setEditScore] = useState({ score: '', date: '' })
  const [saving, setSaving] = useState(false)

  const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b.score, 0) / scores.length).toFixed(1) : '—'
  const best = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : null
  const lowest = scores.length > 0 ? Math.min(...scores.map(s => s.score)) : null

  const handleAdd = async () => {
    const val = parseInt(newScore.score)
    if (!validateScore(val)) { toast.error('Score must be between 1 and 45'); return }
    if (!newScore.date) { toast.error('Please select a date'); return }
    if (!user?.id) return
    setSaving(true)
    const { error } = await addScore(user.id, val, newScore.date)
    setSaving(false)
    if (error) { toast.error(error); return }
    toast.success(scores.length >= 5 ? 'Score added! Oldest removed to keep your latest 5.' : 'Score added!')
    setNewScore({ score: '', date: new Date().toISOString().split('T')[0] })
    setShowAdd(false)
    refetch()
  }

  const handleUpdate = async (id: string) => {
    const val = parseInt(editScore.score)
    if (!validateScore(val)) { toast.error('Score must be between 1 and 45'); return }
    setSaving(true)
    const { error } = await updateScore(id, val, editScore.date)
    setSaving(false)
    if (error) { toast.error(error); return }
    toast.success('Score updated!')
    setEditId(null)
    refetch()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this score?')) return
    const { error } = await deleteScore(id)
    if (error) { toast.error(error); return }
    toast.success('Score removed')
    refetch()
  }

  return (
    <DashboardLayout title="My Scores" subtitle="Track your Stableford golf scores">
      <div className="max-w-3xl space-y-6">

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
          <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-blue-300 text-sm">
            Store up to <strong>5 scores</strong> (Stableford, 1–45). Your scores are your monthly draw numbers.
            Adding a 6th automatically removes the oldest.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Average', value: avg, color: 'text-dark-50' },
            { label: 'Best', value: best ?? '—', color: 'text-gold-400' },
            { label: 'Lowest', value: lowest ?? '—', color: 'text-blue-400' },
          ].map((s, i) => (
            <div key={i} className="stat-card text-center">
              <p className="text-dark-500 text-xs mb-1">{s.label}</p>
              <p className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Header + Add button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-semibold text-dark-100">Your Scores</h2>
            <p className="text-dark-600 text-xs mt-0.5">{scores.length} of 5 slots used</p>
          </div>
          {!showAdd && (
            <button onClick={() => setShowAdd(true)} className="btn-primary text-sm py-2 flex items-center gap-2">
              <Plus size={15} /> {scores.length >= 5 ? 'Add (replaces oldest)' : 'Add Score'}
            </button>
          )}
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="card border-brand-500/30 bg-brand-500/5">
            <h3 className="font-semibold text-dark-100 mb-4 text-sm">Add New Score</h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Stableford Score (1–45)</label>
                <input type="number" min="1" max="45"
                  value={newScore.score}
                  onChange={e => setNewScore(n => ({ ...n, score: e.target.value }))}
                  className="input-field" placeholder="e.g. 32" autoFocus />
              </div>
              <div>
                <label className="label">Date Played</label>
                <input type="date"
                  value={newScore.date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setNewScore(n => ({ ...n, date: e.target.value }))}
                  className="input-field" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAdd} disabled={saving} className="btn-primary text-sm py-2 flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save Score
              </button>
              <button onClick={() => setShowAdd(false)} className="btn-secondary text-sm py-2 flex items-center gap-2">
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Score list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="text-dark-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {scores.map((score, i) => (
              <div key={score.id} className="card hover:border-dark-700 transition-colors">
                {editId === score.id ? (
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex gap-3 flex-1">
                      <input type="number" min="1" max="45"
                        value={editScore.score}
                        onChange={e => setEditScore(s => ({ ...s, score: e.target.value }))}
                        className="input-field w-24 text-center" />
                      <input type="date"
                        value={editScore.date}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={e => setEditScore(s => ({ ...s, date: e.target.value }))}
                        className="input-field flex-1" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(score.id)} disabled={saving}
                        className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5 disabled:opacity-50">
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
                      </button>
                      <button onClick={() => setEditId(null)} className="btn-secondary text-sm py-2 px-4 flex items-center gap-1.5">
                        <X size={13} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className={`score-ball flex-shrink-0 ${getScoreColor(score.score)}`}>{score.score}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-dark-200 font-medium text-sm">Score {score.score}</span>
                          <span className="ml-2 text-xs text-dark-500">· {getScoreLabel(score.score)}</span>
                        </div>
                        <span className="text-dark-500 text-xs">{formatDate(score.played_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-dark-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{
                              width: `${(score.score / 45) * 100}%`,
                              background: score.score >= 36 ? '#f59e0b' : score.score >= 28 ? '#22c55e' : '#60a5fa'
                            }} />
                        </div>
                        <span className="text-dark-600 text-xs">{score.score}/45</span>
                      </div>
                    </div>
                    <div className="text-center flex-shrink-0">
                      <div className="text-xs text-dark-600 mb-1">Draw #{i + 1}</div>
                      <span className="badge-green text-xs">{score.score}</span>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => { setEditId(score.id); setEditScore({ score: String(score.score), date: score.played_at.split('T')[0] }) }}
                        className="btn-ghost p-2 text-dark-500 hover:text-dark-200">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(score.id)} className="btn-ghost p-2 text-dark-500 hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {scores.length === 0 && !loading && (
              <div className="card text-center py-12">
                <span className="text-4xl mb-4 block">⛳</span>
                <h3 className="font-display font-semibold text-dark-200 mb-2">No scores yet</h3>
                <p className="text-dark-500 text-sm mb-5">Add your first Stableford score to enter the draw</p>
                <button onClick={() => setShowAdd(true)} className="btn-primary inline-flex items-center gap-2">
                  <Plus size={15} /> Add First Score
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bar chart */}
        {scores.length > 0 && (
          <div className="card">
            <h3 className="font-display font-semibold text-dark-100 mb-5">Score History</h3>
            <div className="flex items-end gap-3 h-32">
              {[...scores].reverse().map((s, i) => (
                <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-dark-500">{s.score}</span>
                  <div className="w-full rounded-t-lg min-h-[4px]"
                    style={{
                      height: `${Math.max(8, (s.score / 45) * 100)}%`,
                      background: s.score >= 36 ? '#f59e0b' : s.score >= 28 ? '#22c55e' : '#60a5fa'
                    }} />
                  <span className="text-[10px] text-dark-700">{formatDate(s.played_at).split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
