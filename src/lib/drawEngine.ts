import type { GolfScore } from '@/types'

export function generateRandomDraw(count = 5, min = 1, max = 45): number[] {
  const numbers = new Set<number>()
  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * (max - min + 1)) + min)
  }
  return Array.from(numbers).sort((a, b) => a - b)
}

export function generateAlgorithmicDraw(allScores: number[][], count = 5): number[] {
  // Count frequency of each score
  const freq: Record<number, number> = {}
  allScores.flat().forEach(score => {
    freq[score] = (freq[score] || 0) + 1
  })

  // Weight: blend of most frequent and least frequent scores
  const allPossible = Array.from({ length: 45 }, (_, i) => i + 1)
  const weighted = allPossible.map(n => ({
    n,
    weight: freq[n] !== undefined ? (freq[n] + 1) : 0.5,
  }))

  // Pick 5 using weighted selection
  const selected = new Set<number>()
  while (selected.size < count) {
    const totalWeight = weighted.filter(w => !selected.has(w.n)).reduce((a, b) => a + b.weight, 0)
    let rand = Math.random() * totalWeight
    for (const item of weighted) {
      if (selected.has(item.n)) continue
      rand -= item.weight
      if (rand <= 0) {
        selected.add(item.n)
        break
      }
    }
  }

  return Array.from(selected).sort((a, b) => a - b)
}

export function checkMatch(userScores: number[], winningNumbers: number[]): 5 | 4 | 3 | null {
  const matches = userScores.filter(s => winningNumbers.includes(s)).length
  if (matches >= 5) return 5
  if (matches >= 4) return 4
  if (matches >= 3) return 3
  return null
}

export function calculatePrizePool(subscriberCount: number, planMix = 0.6): {
  total: number
  jackpot: number
  tier4: number
  tier3: number
} {
  // Assume plan mix: 60% monthly @ £9.99, 40% yearly @ £99.99/12
  const monthlyRevenue = subscriberCount * planMix * 9.99
  const yearlyRevenue = subscriberCount * (1 - planMix) * (99.99 / 12)
  const totalRevenue = monthlyRevenue + yearlyRevenue
  const prizePool = totalRevenue * 0.5 // 50% to prize pool

  return {
    total: prizePool,
    jackpot: prizePool * 0.4,
    tier4: prizePool * 0.35,
    tier3: prizePool * 0.25,
  }
}

export function getScoreColor(score: number): string {
  if (score >= 36) return 'border-gold-400 text-gold-400 bg-gold-400/10'
  if (score >= 28) return 'border-brand-400 text-brand-400 bg-brand-400/10'
  if (score >= 20) return 'border-blue-400 text-blue-400 bg-blue-400/10'
  return 'border-dark-500 text-dark-400 bg-dark-800'
}

export function getScoreLabel(score: number): string {
  if (score >= 36) return 'Excellent'
  if (score >= 28) return 'Good'
  if (score >= 20) return 'Average'
  return 'Below Par'
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr))
}

export function formatMonth(monthStr: string): string {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date(monthStr + '-01'))
}

export function getMonthlyRevenue(subscribers: number): number {
  return subscribers * 9.99 * 0.6 + subscribers * (99.99 / 12) * 0.4
}

export function getCharityContribution(subscriptionAmount: number, percentage: number): number {
  return subscriptionAmount * (percentage / 100)
}

export function validateScore(score: number): boolean {
  return Number.isInteger(score) && score >= 1 && score <= 45
}

export function sortScoresByDate(scores: GolfScore[]): GolfScore[] {
  return [...scores].sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())
}

export function getLatestFiveScores(scores: GolfScore[]): GolfScore[] {
  return sortScoresByDate(scores).slice(0, 5)
}
