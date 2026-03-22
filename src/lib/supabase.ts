import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not set. Using demo mode.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          subscription_status: 'active' | 'inactive' | 'cancelled' | 'lapsed'
          subscription_plan: 'monthly' | 'yearly' | null
          subscription_renewal_date: string | null
          charity_id: string | null
          charity_percentage: number
          stripe_customer_id: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      golf_scores: {
        Row: {
          id: string
          user_id: string
          score: number
          played_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['golf_scores']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['golf_scores']['Insert']>
      }
      charities: {
        Row: {
          id: string
          name: string
          description: string
          image_url: string | null
          website: string | null
          category: string
          is_featured: boolean
          is_active: boolean
          upcoming_events: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['charities']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['charities']['Insert']>
      }
      draws: {
        Row: {
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
          published_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['draws']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['draws']['Insert']>
      }
      draw_entries: {
        Row: {
          id: string
          draw_id: string
          user_id: string
          scores_snapshot: number[]
          match_type: 5 | 4 | 3 | null
          prize_amount: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['draw_entries']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['draw_entries']['Insert']>
      }
      winner_verifications: {
        Row: {
          id: string
          user_id: string
          draw_id: string
          proof_url: string
          status: 'pending' | 'approved' | 'rejected'
          payment_status: 'pending' | 'paid'
          admin_notes: string | null
          created_at: string
          reviewed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['winner_verifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['winner_verifications']['Insert']>
      }
      charity_donations: {
        Row: {
          id: string
          user_id: string
          charity_id: string
          amount: number
          type: 'subscription' | 'independent'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['charity_donations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['charity_donations']['Insert']>
      }
    }
  }
}
