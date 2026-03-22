import type { GolfScore, Charity, Draw, DrawEntry, WinnerVerification, AdminStats } from '@/types'

export const DEMO_SCORES: GolfScore[] = [
  { id: '1', user_id: 'demo-user-1', score: 34, played_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
  { id: '2', user_id: 'demo-user-1', score: 28, played_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
  { id: '3', user_id: 'demo-user-1', score: 31, played_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
  { id: '4', user_id: 'demo-user-1', score: 22, played_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
  { id: '5', user_id: 'demo-user-1', score: 38, played_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
]

export const DEMO_CHARITIES: Charity[] = [
  {
    id: 'charity-1',
    name: 'Golf Foundation',
    description: 'Providing young people from all backgrounds with the opportunity to try golf, develop life skills and reach their potential.',
    image_url: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=400&h=300&fit=crop',
    website: 'https://www.golf-foundation.org',
    category: 'Youth Sports',
    is_featured: true,
    is_active: true,
    upcoming_events: 'Junior Golf Day — April 12, 2026 at Wentworth Club',
    created_at: new Date().toISOString(),
  },
  {
    id: 'charity-2',
    name: 'Cancer Research UK',
    description: 'The world\'s leading cancer research charity, funding science and driving progress that saves lives.',
    image_url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&h=300&fit=crop',
    website: 'https://www.cancerresearchuk.org',
    category: 'Medical Research',
    is_featured: true,
    is_active: true,
    upcoming_events: 'Charity Golf Tournament — May 3, 2026 at St Andrews',
    created_at: new Date().toISOString(),
  },
  {
    id: 'charity-3',
    name: 'Macmillan Cancer Support',
    description: 'Providing physical, financial and emotional support to people living with cancer and their loved ones.',
    image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    website: 'https://www.macmillan.org.uk',
    category: 'Health Support',
    is_featured: false,
    is_active: true,
    upcoming_events: 'Macmillan Golf Challenge — June 15, 2026',
    created_at: new Date().toISOString(),
  },
  {
    id: 'charity-4',
    name: 'Alzheimer\'s Society',
    description: 'United against dementia — funding research, providing support, and driving forward change for people affected.',
    image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop',
    website: 'https://www.alzheimers.org.uk',
    category: 'Medical Research',
    is_featured: false,
    is_active: true,
    upcoming_events: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'charity-5',
    name: 'Comic Relief',
    description: 'Fighting poverty and injustice in the UK and internationally through fundraising, campaigns and comedy.',
    image_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=300&fit=crop',
    website: 'https://www.comicrelief.com',
    category: 'International Aid',
    is_featured: false,
    is_active: true,
    upcoming_events: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'charity-6',
    name: 'Mental Health Foundation',
    description: 'The UK\'s leading charity for everyone\'s mental health. Preventing mental health problems for a world with good mental health for all.',
    image_url: 'https://images.unsplash.com/photo-1559757175-7cb057fba93a?w=400&h=300&fit=crop',
    website: 'https://www.mentalhealth.org.uk',
    category: 'Mental Health',
    is_featured: false,
    is_active: true,
    upcoming_events: 'Mental Health Golf Day — July 20, 2026',
    created_at: new Date().toISOString(),
  },
]

export const DEMO_DRAWS: Draw[] = [
  {
    id: 'draw-1',
    draw_month: new Date().toISOString().slice(0, 7),
    draw_logic: 'algorithmic',
    winning_numbers: [18, 28, 34, 22, 31],
    status: 'published',
    jackpot_amount: 1840.25,
    tier_4_amount: 1610.22,
    tier_3_amount: 1150.16,
    total_subscribers: 924,
    rolled_over: false,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'draw-2',
    draw_month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
    draw_logic: 'random',
    winning_numbers: [7, 15, 29, 38, 42],
    status: 'published',
    jackpot_amount: 0,
    tier_4_amount: 1450.00,
    tier_3_amount: 1035.71,
    total_subscribers: 831,
    rolled_over: true,
    created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    published_at: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const DEMO_ENTRIES: DrawEntry[] = [
  {
    id: 'entry-1',
    draw_id: 'draw-1',
    user_id: 'demo-user-1',
    scores_snapshot: [34, 28, 31, 22, 38],
    match_type: 3,
    prize_amount: 287.54,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const DEMO_WINNERS: WinnerVerification[] = [
  {
    id: 'winner-1',
    user_id: 'demo-user-1',
    draw_id: 'draw-1',
    proof_url: 'https://example.com/proof.png',
    status: 'pending',
    payment_status: 'pending',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const DEMO_ADMIN_STATS: AdminStats = {
  total_users: 1247,
  active_subscribers: 924,
  total_prize_pool: 4600.63,
  total_charity_contributions: 9201.26,
  monthly_revenue: 9224.76,
  pending_verifications: 3,
}

export const DEMO_USERS = [
  { id: 'u1', full_name: 'Jamie Wilson', email: 'jamie@example.com', subscription_status: 'active', subscription_plan: 'monthly', charity_percentage: 15, created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'u2', full_name: 'Sarah Chen', email: 'sarah@example.com', subscription_status: 'active', subscription_plan: 'yearly', charity_percentage: 20, created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'u3', full_name: 'Marcus Thompson', email: 'marcus@example.com', subscription_status: 'active', subscription_plan: 'monthly', charity_percentage: 10, created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'u4', full_name: 'Emma Rodriguez', email: 'emma@example.com', subscription_status: 'lapsed', subscription_plan: 'monthly', charity_percentage: 10, created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'u5', full_name: 'Oliver Kim', email: 'oliver@example.com', subscription_status: 'active', subscription_plan: 'yearly', charity_percentage: 25, created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'u6', full_name: 'Priya Patel', email: 'priya@example.com', subscription_status: 'active', subscription_plan: 'monthly', charity_percentage: 15, created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
]
