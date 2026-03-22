import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Trophy, LogOut, User, Settings, Shield } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-950/80 backdrop-blur-xl border-b border-dark-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
              <Trophy size={16} className="text-dark-950" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              Par<span className="text-brand-400">For</span>Good
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className={`nav-link px-3 py-2 rounded-lg ${isActive('/') ? 'text-dark-50 bg-dark-800' : ''}`}>Home</Link>
            <Link to="/charities" className={`nav-link px-3 py-2 rounded-lg ${isActive('/charities') ? 'text-dark-50 bg-dark-800' : ''}`}>Charities</Link>
            {user ? (
              <>
                <Link to="/dashboard" className={`nav-link px-3 py-2 rounded-lg ${isActive('/dashboard') ? 'text-dark-50 bg-dark-800' : ''}`}>Dashboard</Link>
                <Link to="/draw" className={`nav-link px-3 py-2 rounded-lg ${isActive('/draw') ? 'text-dark-50 bg-dark-800' : ''}`}>Draw</Link>
                <Link to="/scores" className={`nav-link px-3 py-2 rounded-lg ${isActive('/scores') ? 'text-dark-50 bg-dark-800' : ''}`}>Scores</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className={`nav-link px-3 py-2 rounded-lg text-gold-400 hover:text-gold-300 ${isActive('/admin') ? 'bg-gold-500/10' : ''}`}>
                    <Shield size={14} className="inline mr-1" />Admin
                  </Link>
                )}
              </>
            ) : (
              <Link to="/subscribe" className={`nav-link px-3 py-2 rounded-lg ${isActive('/subscribe') ? 'text-dark-50 bg-dark-800' : ''}`}>Pricing</Link>
            )}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-dark-800 transition-colors">
                  <div className="w-7 h-7 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-xs font-bold text-dark-950">
                    {user.full_name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-dark-200">{user.full_name.split(' ')[0]}</span>
                </Link>
                <button onClick={handleSignOut} className="btn-ghost text-dark-500 hover:text-red-400">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">Sign In</Link>
                <Link to="/subscribe" className="btn-primary text-sm py-2">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden btn-ghost p-2" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-dark-900 border-t border-dark-800 px-4 py-4 space-y-1">
          <Link to="/" className="block nav-link py-2.5" onClick={() => setOpen(false)}>Home</Link>
          <Link to="/charities" className="block nav-link py-2.5" onClick={() => setOpen(false)}>Charities</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="block nav-link py-2.5" onClick={() => setOpen(false)}>Dashboard</Link>
              <Link to="/draw" className="block nav-link py-2.5" onClick={() => setOpen(false)}>Draw</Link>
              <Link to="/scores" className="block nav-link py-2.5" onClick={() => setOpen(false)}>Scores</Link>
              <Link to="/profile" className="block nav-link py-2.5" onClick={() => setOpen(false)}>Profile</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="block nav-link py-2.5 text-gold-400" onClick={() => setOpen(false)}>Admin Panel</Link>
              )}
              <button onClick={() => { handleSignOut(); setOpen(false) }} className="block w-full text-left nav-link py-2.5 text-red-400">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block nav-link py-2.5" onClick={() => setOpen(false)}>Sign In</Link>
              <Link to="/subscribe" className="block nav-link py-2.5 text-brand-400" onClick={() => setOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
