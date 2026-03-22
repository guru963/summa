// ============================================================
// Central data-fetching hook — all Supabase queries live here
// Every page imports from this instead of using demo data
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { GolfScore, Charity, Draw, DrawEntry, WinnerVerification } from '@/types'

// ── Scores ───────────────────────────────────────────────────
export function useScores(userId: string | undefined) {
  const [scores, setScores] = useState<GolfScore[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('golf_scores')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(5)
    setScores(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])
  return { scores, loading, refetch: fetch }
}

// ── Add score ────────────────────────────────────────────────
export async function addScore(userId: string, score: number, playedAt: string) {
  const { error } = await supabase
    .from('golf_scores')
    .insert({ user_id: userId, score, played_at: new Date(playedAt).toISOString() })
  return { error: error?.message ?? null }
}

// ── Update score ─────────────────────────────────────────────
export async function updateScore(id: string, score: number, playedAt: string) {
  const { error } = await supabase
    .from('golf_scores')
    .update({ score, played_at: new Date(playedAt).toISOString() })
    .eq('id', id)
  return { error: error?.message ?? null }
}

// ── Delete score ─────────────────────────────────────────────
export async function deleteScore(id: string) {
  const { error } = await supabase.from('golf_scores').delete().eq('id', id)
  return { error: error?.message ?? null }
}

// ── Active charities ──────────────────────────────────────────
export function useCharities() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('charities')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .then(({ data }) => { setCharities(data ?? []); setLoading(false) })
  }, [])

  return { charities, loading }
}

// ── Single charity ────────────────────────────────────────────
export function useCharity(charityId: string | undefined) {
  const [charity, setCharity] = useState<Charity | null>(null)

  useEffect(() => {
    if (!charityId) { setCharity(null); return }
    supabase
      .from('charities').select('*').eq('id', charityId).maybeSingle()
      .then(({ data }) => setCharity(data))
  }, [charityId])

  return charity
}

// ── Published draws ───────────────────────────────────────────
export function useDraws() {
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('draws').select('*').eq('status', 'published')
      .order('draw_month', { ascending: false })
      .then(({ data }) => { setDraws(data ?? []); setLoading(false) })
  }, [])

  return { draws, loading }
}

// ── User's draw entries ───────────────────────────────────────
export function useMyEntries(userId: string | undefined) {
  const [entries, setEntries] = useState<DrawEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    const { data } = await supabase
      .from('draw_entries').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false })
    setEntries(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])
  return { entries, loading, refetch: fetch }
}

// ── User's winner verifications ───────────────────────────────
export function useMyVerifications(userId: string | undefined) {
  const [verifications, setVerifications] = useState<WinnerVerification[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    const { data } = await supabase
      .from('winner_verifications').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false })
    setVerifications(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])
  return { verifications, loading, refetch: fetch }
}

// ── Submit verification proof ────────────────────────────────
export async function submitVerification(userId: string, drawId: string, proofUrl: string) {
  const { error } = await supabase
    .from('winner_verifications')
    .upsert(
      { user_id: userId, draw_id: drawId, proof_url: proofUrl, status: 'pending', payment_status: 'pending' },
      { onConflict: 'user_id,draw_id' }
    )
  return { error: error?.message ?? null }
}

// ── Independent charity donation ──────────────────────────────
export async function makeDonation(userId: string, charityId: string, amount: number) {
  const { error } = await supabase
    .from('charity_donations')
    .insert({ user_id: userId, charity_id: charityId, amount, type: 'independent' })
  return { error: error?.message ?? null }
}

// ── Total charity donated by user ─────────────────────────────
export function useTotalDonated(userId: string | undefined) {
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('charity_donations').select('amount').eq('user_id', userId)
      .then(({ data }) => {
        setTotal((data ?? []).reduce((a, d) => a + (d.amount ?? 0), 0))
      })
  }, [userId])

  return total
}

// ── Admin: all users ──────────────────────────────────────────
export function useAllUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { users, loading, refetch: fetch }
}

// ── Admin: all draws ──────────────────────────────────────────
export function useAllDraws() {
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('draws').select('*').order('draw_month', { ascending: false })
    setDraws(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { draws, loading, refetch: fetch }
}

// ── Admin: all verifications with user + draw info ────────────
export function useAllVerifications() {
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('winner_verifications')
      .select('*, profiles(full_name, email), draws(draw_month)')
      .order('created_at', { ascending: false })
    setVerifications(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { verifications, loading, refetch: fetch }
}

// ── Admin: all charities ──────────────────────────────────────
export function useAllCharities() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('charities').select('*').order('is_featured', { ascending: false })
    setCharities(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { charities, loading, refetch: fetch }
}

// ── Admin: publish draw & auto-calculate entries ──────────────
export async function publishDraw(drawData: {
  draw_month: string
  draw_logic: 'random' | 'algorithmic'
  winning_numbers: number[]
  jackpot_amount: number
  tier_4_amount: number
  tier_3_amount: number
  total_subscribers: number
  rolled_over: boolean
}) {
  const { data: draw, error } = await supabase
    .from('draws')
    .upsert({ ...drawData, status: 'published', published_at: new Date().toISOString() },
      { onConflict: 'draw_month' })
    .select().single()

  if (error) return { error: error.message, draw: null }

  // Fetch all active subscribers with their scores
  const { data: subscribers } = await supabase
    .from('profiles')
    .select('id, golf_scores(score)')
    .eq('subscription_status', 'active')

  if (subscribers && draw) {
    for (const sub of subscribers) {
      const scores: number[] = ((sub as any).golf_scores ?? []).map((s: any) => s.score)
      if (scores.length === 0) continue
      const matches = scores.filter(s => drawData.winning_numbers.includes(s)).length
      const matchType = matches >= 5 ? 5 : matches >= 4 ? 4 : matches >= 3 ? 3 : null
      const prizeBase = matchType === 5 ? drawData.jackpot_amount
        : matchType === 4 ? drawData.tier_4_amount
        : matchType === 3 ? drawData.tier_3_amount : null
      await supabase.from('draw_entries').upsert({
        draw_id: draw.id, user_id: sub.id,
        scores_snapshot: scores, match_type: matchType, prize_amount: prizeBase,
      }, { onConflict: 'draw_id,user_id' })
    }
  }

  return { error: null, draw }
}

// ── Admin: update verification status ────────────────────────
export async function updateVerification(id: string, status: 'approved' | 'rejected', notes?: string) {
  const { error } = await supabase
    .from('winner_verifications')
    .update({ status, admin_notes: notes ?? null, reviewed_at: new Date().toISOString() })
    .eq('id', id)
  return { error: error?.message ?? null }
}

// ── Admin: mark payment as paid ───────────────────────────────
export async function markPaid(id: string) {
  const { error } = await supabase
    .from('winner_verifications')
    .update({ payment_status: 'paid' })
    .eq('id', id)
  return { error: error?.message ?? null }
}

// ── Admin: toggle charity active status ───────────────────────
export async function toggleCharity(id: string, isActive: boolean) {
  const { error } = await supabase
    .from('charities').update({ is_active: isActive }).eq('id', id)
  return { error: error?.message ?? null }
}

// ── Admin: add charity ────────────────────────────────────────
export async function addCharity(charity: Omit<Charity, 'id' | 'created_at'>) {
  const { error } = await supabase.from('charities').insert(charity)
  return { error: error?.message ?? null }
}

// ── Admin stats ───────────────────────────────────────────────
export function useAdminStats() {
  const [stats, setStats] = useState({
    total_users: 0, active_subscribers: 0,
    total_donations: 0, pending_verifications: 0,
  })

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
      supabase.from('charity_donations').select('amount'),
      supabase.from('winner_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]).then(([users, active, donations, pending]) => {
      setStats({
        total_users: users.count ?? 0,
        active_subscribers: active.count ?? 0,
        total_donations: (donations.data ?? []).reduce((a, d) => a + (d.amount ?? 0), 0),
        pending_verifications: pending.count ?? 0,
      })
    })
  }, [])

  return stats
}

// ── Smart verification: auto-checks scores match before submitting ──
// Returns: { autoApproved: true } if scores match DB records
//          { autoApproved: false } if needs manual admin review
export async function submitVerificationSmart(
  userId: string,
  drawId: string,
  proofUrl: string
): Promise<{ error: string | null; autoApproved: boolean; matchScore: number }> {
  try {
    // Step 1: Get the draw entry (scores the user had at draw time)
    const { data: entry } = await supabase
      .from('draw_entries')
      .select('scores_snapshot, match_type, prize_amount')
      .eq('user_id', userId)
      .eq('draw_id', drawId)
      .maybeSingle()

    if (!entry) return { error: 'No draw entry found for this user', autoApproved: false, matchScore: 0 }
    if (!entry.match_type) return { error: 'You did not win this draw', autoApproved: false, matchScore: 0 }

    // Step 2: Get current scores from DB
    const { data: currentScores } = await supabase
      .from('golf_scores')
      .select('score')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(5)

    const dbScores = (currentScores ?? []).map(s => s.score).sort((a, b) => a - b)
    const snapshotScores = [...entry.scores_snapshot].sort((a, b) => a - b)

    // Step 3: Compare snapshot scores (what they had at draw time) vs current DB scores
    // If they still match → high confidence scores are genuine
    const matchCount = snapshotScores.filter(s => dbScores.includes(s)).length
    const matchPercent = snapshotScores.length > 0 ? (matchCount / snapshotScores.length) * 100 : 0

    // Auto-approve if 80%+ of draw scores still exist in their current record
    const autoApprove = matchPercent >= 80

    // Step 4: Insert verification record
    const { error } = await supabase
      .from('winner_verifications')
      .upsert({
        user_id: userId,
        draw_id: drawId,
        proof_url: proofUrl,
        status: autoApprove ? 'approved' : 'pending',
        payment_status: 'pending',
        admin_notes: autoApprove
          ? `Auto-verified: ${matchCount}/${snapshotScores.length} scores matched DB records (${matchPercent.toFixed(0)}% match)`
          : `Needs manual review: only ${matchCount}/${snapshotScores.length} scores matched current DB records`,
      }, { onConflict: 'user_id,draw_id' })

    if (error) return { error: error.message, autoApproved: false, matchScore: matchPercent }

    return { error: null, autoApproved: autoApprove, matchScore: matchPercent }
  } catch (err: any) {
    return { error: err?.message || 'Verification failed', autoApproved: false, matchScore: 0 }
  }
}
