import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Heart, Trophy, Target, Star, ChevronRight, Zap, Shield, TrendingUp } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import type { Charity } from '@/types'

const STATS = [
  { label: 'Active Members', value: '2,847', change: '+12% this month' },
  { label: 'Donated to Charity', value: '£184,320', change: 'All time' },
  { label: 'Prize Pool This Month', value: '£14,200', change: 'Jackpot available' },
  { label: 'Charities Supported', value: '24', change: 'Across UK' },
]

const HOW_IT_WORKS = [
  { step: '01', icon: Target, title: 'Track Your Game', desc: 'Enter your Stableford scores after each round. Your best 5 scores shape your draw entries.', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  { step: '02', icon: Trophy, title: 'Enter the Monthly Draw', desc: 'Every subscriber automatically enters the monthly draw. 3, 4, or 5-number matches win prizes.', color: 'text-brand-400', bg: 'bg-brand-400/10 border-brand-400/20' },
  { step: '03', icon: Heart, title: 'Support a Charity', desc: 'A portion of every subscription goes directly to your chosen charity — minimum 10%.', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
  { step: '04', icon: Zap, title: 'Win & Celebrate', desc: 'Matched numbers? Verify your win, get paid, and share the moment. Jackpot rolls over if unclaimed.', color: 'text-gold-400', bg: 'bg-gold-400/10 border-gold-400/20' },
]

const PRIZE_TIERS = [
  { match: '5 Numbers', share: '40%', label: 'Jackpot', rollover: true, color: 'border-gold-500 bg-gold-500/5' },
  { match: '4 Numbers', share: '35%', label: 'Major Prize', rollover: false, color: 'border-brand-500 bg-brand-500/5' },
  { match: '3 Numbers', share: '25%', label: 'Prize', rollover: false, color: 'border-blue-500 bg-blue-500/5' },
]

const TESTIMONIALS = [
  { name: 'Marcus T.', location: 'Surrey', quote: 'Won £340 last month. My charity also got a donation. This platform is genuinely different.', rating: 5 },
  { name: 'Sarah K.', location: 'Edinburgh', quote: "Love how it feels nothing like a golf app. Modern, clean, and actually exciting to use.", rating: 5 },
  { name: 'Oliver J.', location: 'Bristol', quote: "Supporting Cancer Research while playing golf is the best subscription I've ever bought.", rating: 5 },
]

export default function HomePage() {
  const [featuredCharities, setFeaturedCharities] = useState<Charity[]>([])

  useEffect(() => {
    supabase
      .from('charities')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .limit(2)
      .then(({ data }) => setFeaturedCharities(data ?? []))
  }, [])

  return (
    <div className="min-h-screen bg-dark-950 overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="orb orb-green w-[600px] h-[600px] top-[-100px] left-[-200px] opacity-60" />
          <div className="orb orb-gold w-[400px] h-[400px] bottom-[-50px] right-[-100px] opacity-40" />
          <div className="orb orb-blue w-[300px] h-[300px] top-[40%] right-[20%] opacity-30" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 mb-8 animate-fade-in">
            <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
            <span className="text-brand-400 text-sm font-medium">New draw every month · £14,200 jackpot live</span>
          </div>

          <h1 className="font-display font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[0.95] mb-6 animate-fade-up">
            <span className="text-dark-50">Golf with</span><br />
            <span className="gradient-text">Purpose.</span><br />
            <span className="text-dark-50">Win with</span><br />
            <span className="gold-gradient-text">Heart.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-dark-400 text-lg sm:text-xl leading-relaxed mb-10 animate-fade-up delay-100">
            Subscribe. Track your Stableford scores. Enter our monthly draw. Support the charity you believe in.
            <span className="text-dark-200"> Golf, reimagined.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up delay-200">
            <Link to="/subscribe" className="btn-primary text-base px-8 py-4 flex items-center gap-2 group">
              Start for £9.99/month
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/charities" className="btn-secondary text-base px-8 py-4 flex items-center gap-2">
              <Heart size={16} className="text-red-400" />
              See Charities
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-dark-500 animate-fade-up delay-300">
            <span className="flex items-center gap-1.5"><Shield size={14} className="text-brand-500" />Stripe Secured</span>
            <span className="text-dark-700">·</span>
            <span className="flex items-center gap-1.5"><Heart size={14} className="text-red-500" />10% min. to charity</span>
            <span className="text-dark-700">·</span>
            <span className="flex items-center gap-1.5"><Trophy size={14} className="text-gold-500" />Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-dark-800 bg-dark-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-dark-800">
            {STATS.map((stat, i) => (
              <div key={i} className="px-6 py-6 sm:py-8">
                <div className="font-display font-bold text-2xl sm:text-3xl text-dark-50 mb-1">{stat.value}</div>
                <div className="text-dark-400 text-sm">{stat.label}</div>
                <div className="text-brand-500 text-xs mt-1">{stat.change}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="section-label mb-3">Simple & Transparent</p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-dark-50 tracking-tight">How it works</h2>
          <p className="text-dark-400 mt-4 max-w-xl mx-auto">Four steps to a better golf experience. No complexity. No hidden rules.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((item, i) => {
            const Icon = item.icon
            return (
              <div key={i} className="relative group">
                <div className="card hover:border-dark-700 transition-all duration-300 h-full">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-5 ${item.bg}`}>
                    <Icon size={22} className={item.color} />
                  </div>
                  <div className="text-dark-700 font-mono text-xs mb-2">{item.step}</div>
                  <h3 className="font-display font-semibold text-lg text-dark-100 mb-3">{item.title}</h3>
                  <p className="text-dark-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
                {i < 3 && <ChevronRight size={20} className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 text-dark-700 z-10" />}
              </div>
            )
          })}
        </div>
      </section>

      {/* Prize Pool */}
      <section className="py-24 bg-dark-900/50 border-y border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="section-label mb-3">Monthly Draw</p>
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-dark-50 tracking-tight mb-6">
                Three ways<br />to <span className="gradient-text">win</span>
              </h2>
              <p className="text-dark-400 text-lg mb-8 leading-relaxed">
                Every month, 5 winning numbers are drawn. Match 3, 4, or all 5 and win your share of the prize pool.
              </p>
              <Link to="/subscribe" className="btn-primary inline-flex items-center gap-2 group">
                Join the draw <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="space-y-4">
              {PRIZE_TIERS.map((tier, i) => (
                <div key={i} className={`border rounded-2xl p-5 flex items-center justify-between ${tier.color} hover:scale-[1.01] transition-all duration-200`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display font-bold text-xl text-dark-50">{tier.match}</span>
                      {tier.rollover && <span className="badge-gold text-xs">Jackpot Rollover</span>}
                    </div>
                    <span className="text-dark-400 text-sm">{tier.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-3xl text-dark-50">{tier.share}</div>
                    <div className="text-dark-500 text-xs">of pool</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Charities */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="section-label mb-3">Make a Difference</p>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-dark-50 tracking-tight">
              Charities we<br /><span className="gradient-text">support</span>
            </h2>
          </div>
          <Link to="/charities" className="btn-ghost flex items-center gap-1 text-brand-400 hover:text-brand-300">
            View all <ChevronRight size={16} />
          </Link>
        </div>

        {featuredCharities.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-6">
            {featuredCharities.map((charity) => (
              <div key={charity.id} className="card-hover overflow-hidden group">
                <div className="h-48 rounded-xl overflow-hidden mb-5 bg-dark-800">
                  {charity.image_url && (
                    <img src={charity.image_url} alt={charity.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="badge-green text-xs mb-2">{charity.category}</span>
                    <h3 className="font-display font-semibold text-lg text-dark-100 mb-2 mt-2">{charity.name}</h3>
                    <p className="text-dark-500 text-sm leading-relaxed line-clamp-2">{charity.description}</p>
                    {charity.upcoming_events && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-gold-400">
                        <Star size={12} /><span>{charity.upcoming_events}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-dark-600 group-hover:text-brand-400 transition-colors flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-dark-800 rounded-xl mb-5" />
                <div className="h-4 bg-dark-800 rounded w-1/3 mb-3" />
                <div className="h-5 bg-dark-800 rounded w-2/3 mb-2" />
                <div className="h-4 bg-dark-800 rounded w-full" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-dark-900/50 border-y border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="section-label mb-3">Member Stories</p>
            <h2 className="font-display font-bold text-4xl text-dark-50 tracking-tight">Real members. Real wins.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="glass p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={14} className="text-gold-400 fill-gold-400" />
                  ))}
                </div>
                <p className="text-dark-300 text-sm leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-dark-200 font-medium text-sm">{t.name}</p>
                    <p className="text-dark-600 text-xs">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900/40 via-dark-900 to-dark-950 border border-brand-500/20 p-12 sm:p-16 text-center">
          <div className="absolute inset-0 pointer-events-none">
            <div className="orb orb-green w-[400px] h-[400px] top-[-100px] left-[-100px]" />
            <div className="orb orb-gold w-[300px] h-[300px] bottom-[-80px] right-[-80px] opacity-50" />
          </div>
          <div className="relative z-10">
            <TrendingUp size={40} className="text-brand-400 mx-auto mb-6" />
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-dark-50 tracking-tight mb-4">Ready to play with purpose?</h2>
            <p className="text-dark-400 text-lg mb-8 max-w-xl mx-auto">Join thousands of golfers who compete, win, and give back — all in one subscription.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/subscribe" className="btn-primary text-lg px-10 py-4 flex items-center gap-2 justify-center group">
                Start Today — £9.99/mo <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/charities" className="btn-secondary text-lg px-10 py-4">Explore Charities</Link>
            </div>
            <p className="text-dark-600 text-sm mt-5">No commitment. Cancel anytime. Minimum 10% to charity.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
                <Trophy size={14} className="text-dark-950" />
              </div>
              <span className="font-display font-bold tracking-tight">Par<span className="text-brand-400">For</span>Good</span>
            </div>
            <p className="text-dark-600 text-sm">© 2026 ParForGood. Subscriptions processed securely via Stripe.</p>
            <div className="flex items-center gap-4 text-sm text-dark-600">
              <a href="#" className="hover:text-dark-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-dark-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-dark-400 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
