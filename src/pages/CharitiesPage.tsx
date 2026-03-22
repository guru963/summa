import { useState } from 'react'
import { Heart, ExternalLink, Search, Star, Loader2 } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { useCharities, makeDonation } from '@/hooks/useSupabaseData'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/drawEngine'
import toast from 'react-hot-toast'

const CATEGORIES = ['All', 'Youth Sports', 'Medical Research', 'Health Support', 'Mental Health', 'International Aid']

export default function CharitiesPage() {
  const { charities, loading } = useCharities()
  const { user, refreshUser } = useAuth()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [donating, setDonating] = useState<string | null>(null)
  const [donationAmounts, setDonationAmounts] = useState<Record<string, string>>({})
  const [selecting, setSelecting] = useState<string | null>(null)

  const filtered = charities.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || c.category === category
    return matchSearch && matchCat
  })

  const selectCharity = async (id: string, name: string) => {
    if (!user) { toast.error('Please sign in first'); return }
    setSelecting(id)
    const { error } = await supabase.from('profiles').update({ charity_id: id }).eq('id', user.id)
    setSelecting(null)
    if (error) { toast.error('Could not update charity'); return }
    await refreshUser()
    toast.success(`Now supporting ${name}!`)
  }

  const handleDonate = async (charityId: string, charityName: string) => {
    if (!user) { toast.error('Please sign in to donate'); return }
    const amount = parseFloat(donationAmounts[charityId] ?? '')
    if (!amount || amount <= 0) { toast.error('Enter a valid donation amount'); return }
    setDonating(charityId)
    const { error } = await makeDonation(user.id, charityId, amount)
    setDonating(null)
    if (error) { toast.error(error); return }
    toast.success(`£${amount.toFixed(2)} donated to ${charityName}! Thank you.`)
    setDonationAmounts(prev => ({ ...prev, [charityId]: '' }))
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6">

        <div className="text-center mb-14">
          <p className="section-label mb-3">Make a Difference</p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-dark-50 tracking-tight mb-4">
            Charities you can <span className="gradient-text">support</span>
          </h1>
          <p className="text-dark-400 text-lg max-w-xl mx-auto">
            Every subscription automatically contributes to your chosen charity. You can also donate independently anytime.
          </p>
        </div>

        {/* Featured */}
        {charities.filter(c => c.is_featured).length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Star size={16} className="text-gold-400" />
              <h2 className="font-display font-semibold text-dark-100">Featured Charities</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {charities.filter(c => c.is_featured).map(charity => (
                <div key={charity.id} className="card-hover overflow-hidden group flex flex-col">
                  <div className="h-52 rounded-xl overflow-hidden mb-5 bg-dark-800 relative">
                    {charity.image_url && (
                      <img src={charity.image_url} alt={charity.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                    <div className="absolute top-3 left-3"><span className="badge-gold text-xs">Featured</span></div>
                    {user?.charity_id === charity.id && (
                      <div className="absolute top-3 right-3"><span className="badge-green text-xs">Your Charity</span></div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <span className="badge-green text-xs mb-2 self-start">{charity.category}</span>
                    <h3 className="font-display font-semibold text-xl text-dark-50 mb-2">{charity.name}</h3>
                    <p className="text-dark-500 text-sm leading-relaxed mb-4 flex-1">{charity.description}</p>
                    {charity.upcoming_events && (
                      <div className="flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-xl p-3 mb-4">
                        <Star size={13} className="text-gold-400 flex-shrink-0" />
                        <span className="text-gold-300 text-xs">{charity.upcoming_events}</span>
                      </div>
                    )}

                    {/* Donate box */}
                    <div className="flex gap-2 mb-3">
                      <input
                        type="number" min="1" step="0.01"
                        placeholder="£ Amount"
                        value={donationAmounts[charity.id] ?? ''}
                        onChange={e => setDonationAmounts(p => ({ ...p, [charity.id]: e.target.value }))}
                        className="input-field flex-1 text-sm py-2"
                      />
                      <button
                        onClick={() => handleDonate(charity.id, charity.name)}
                        disabled={donating === charity.id}
                        className="btn-secondary text-sm py-2 px-4 flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
                      >
                        {donating === charity.id ? <Loader2 size={13} className="animate-spin" /> : <Heart size={13} />}
                        Donate
                      </button>
                    </div>

                    <button
                      onClick={() => selectCharity(charity.id, charity.name)}
                      disabled={user?.charity_id === charity.id || selecting === charity.id}
                      className={`w-full text-sm py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                        user?.charity_id === charity.id
                          ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30 cursor-default'
                          : 'btn-primary'
                      }`}
                    >
                      {selecting === charity.id ? <Loader2 size={14} className="animate-spin" /> : null}
                      {user?.charity_id === charity.id ? '✓ Your Selected Charity' : 'Make This My Charity'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
            <input type="text" placeholder="Search charities..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="input-field pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  category === cat ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-dark-800 text-dark-500 hover:text-dark-300 border border-dark-700'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* All charities */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="text-dark-600 animate-spin" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(charity => (
              <div key={charity.id} className="card-hover group flex flex-col">
                <div className="h-36 rounded-xl overflow-hidden mb-4 bg-dark-800 relative">
                  {charity.image_url && (
                    <img src={charity.image_url} alt={charity.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                  {user?.charity_id === charity.id && (
                    <div className="absolute top-2 right-2"><span className="badge-green text-[10px]">Selected</span></div>
                  )}
                </div>
                <span className="badge-green text-xs mb-2 self-start">{charity.category}</span>
                <h3 className="font-display font-semibold text-dark-100 mb-2">{charity.name}</h3>
                <p className="text-dark-500 text-sm leading-relaxed mb-3 flex-1 line-clamp-3">{charity.description}</p>
                {charity.upcoming_events && (
                  <div className="flex items-center gap-1.5 text-xs text-gold-400 mb-3">
                    <Star size={11} /><span className="truncate">{charity.upcoming_events}</span>
                  </div>
                )}

                {/* Quick donate */}
                <div className="flex gap-2 mb-2">
                  <input type="number" min="1" step="0.01" placeholder="£"
                    value={donationAmounts[charity.id] ?? ''}
                    onChange={e => setDonationAmounts(p => ({ ...p, [charity.id]: e.target.value }))}
                    className="input-field text-sm py-2 flex-1 min-w-0" />
                  <button onClick={() => handleDonate(charity.id, charity.name)}
                    disabled={donating === charity.id}
                    className="btn-ghost text-sm py-2 px-3 border border-dark-700 rounded-xl flex items-center gap-1 disabled:opacity-50">
                    {donating === charity.id ? <Loader2 size={12} className="animate-spin" /> : <Heart size={12} className="text-red-400" />}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => selectCharity(charity.id, charity.name)}
                    disabled={user?.charity_id === charity.id || selecting === charity.id}
                    className={`flex-1 text-sm py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-1 ${
                      user?.charity_id === charity.id
                        ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30 cursor-default'
                        : 'btn-secondary'
                    }`}
                  >
                    {selecting === charity.id ? <Loader2 size={13} className="animate-spin" /> : null}
                    {user?.charity_id === charity.id ? '✓ Selected' : 'Select'}
                  </button>
                  {charity.website && (
                    <a href={charity.website} target="_blank" rel="noopener noreferrer" className="btn-ghost p-2 text-dark-500">
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <Heart size={40} className="text-dark-700 mx-auto mb-4" />
            <p className="text-dark-500">No charities found</p>
          </div>
        )}
      </div>
    </div>
  )
}
