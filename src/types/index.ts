export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'lapsed'
  subscription_plan?: 'monthly' | 'yearly'
  subscription_renewal_date?: string
  charity_id?: string
  charity_percentage: number
  role: 'user' | 'admin'
  created_at: string
}

export interface GolfScore {
  id: string
  user_id: string
  score: number
  played_at: string
  created_at: string
}

export interface Charity {
  id: string
  name: string
  description: string
  image_url?: string
  website?: string
  category: string
  is_featured: boolean
  is_active: boolean
  upcoming_events?: string
  created_at: string
}

export interface Draw {
  id: string
  draw_month: string
  draw_logic: 'random' | 'algorithmic'
  winning_numbers: number[]
  status: 'pending' | 'simulated' | 'published'
  jackpot_amount: number
  tier_4_amount: number
  tier_3_amount: number
  total_subscribers: number
  rolled_over: boolean
  created_at: string
  published_at?: string
}

export interface DrawEntry {
  id: string
  draw_id: string
  user_id: string
  scores_snapshot: number[]
  match_type?: 5 | 4 | 3
  prize_amount?: number
  created_at: string
}

export interface WinnerVerification {
  id: string
  user_id: string
  draw_id: string
  proof_url: string
  status: 'pending' | 'approved' | 'rejected'
  payment_status: 'pending' | 'paid'
  admin_notes?: string
  created_at: string
  reviewed_at?: string
}

export interface PrizePool {
  total: number
  jackpot: number  // 40%
  tier4: number    // 35%
  tier3: number    // 25%
}

export interface AdminStats {
  total_users: number
  active_subscribers: number
  total_prize_pool: number
  total_charity_contributions: number
  monthly_revenue: number
  pending_verifications: number
}

export const SUBSCRIPTION_PRICES = {
  monthly: 9.99,
  yearly: 99.99, // ~17% discount
}

export const PRIZE_POOL_SHARE = 0.5  // 50% of subscriptions go to prize pool
export const CHARITY_MIN_SHARE = 0.1  // 10% minimum
export const PRIZE_TIERS = {
  match5: 0.4,
  match4: 0.35,
  match3: 0.25,
}

export const SCORE_MIN = 1
export const SCORE_MAX = 45
export const MAX_SCORES = 5
