import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Trophy, Target, Heart, User, LogOut,
  Menu, X, ChevronRight, Shield, Award
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

const userNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/scores', label: 'My Scores', icon: Target },
  { path: '/draw', label: 'Monthly Draw', icon: Trophy },
  { path: '/winners', label: 'Winners', icon: Award },
  { path: '/charities', label: 'Charities', icon: Heart },
  { path: '/profile', label: 'Profile', icon: User },
]

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-dark-900 border-r border-dark-800
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex lg:flex-col
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-dark-800">
          <Link to={isAdmin ? '/admin' : '/'} className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Trophy size={14} className="text-dark-950" />
            </div>
            <span className="font-display font-bold text-base tracking-tight">
              Par<span className="text-brand-400">For</span>Good
            </span>
          </Link>
          <button className="lg:hidden btn-ghost p-1.5" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-dark-800">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0
              ${isAdmin ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-dark-950' : 'bg-gradient-to-br from-brand-400 to-brand-600 text-dark-950'}`}>
              {user?.full_name?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-dark-100 text-sm truncate">{user?.full_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isAdmin ? (
                  <span className="text-xs text-gold-400 font-semibold flex items-center gap-1">
                    <Shield size={10} /> Administrator
                  </span>
                ) : (
                  <>
                    <div className={`w-1.5 h-1.5 rounded-full ${user?.subscription_status === 'active' ? 'bg-brand-400' : 'bg-red-400'}`} />
                    <span className="text-xs text-dark-500 capitalize">{user?.subscription_status}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {isAdmin ? (
            // Admin sees ONLY the Admin Panel link
            <>
              <p className="text-[10px] font-semibold text-dark-600 uppercase tracking-widest px-3 pb-2">
                Admin Controls
              </p>
              <Link
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className={isActive('/admin')
                  ? 'sidebar-item text-gold-400 bg-gold-500/10 hover:bg-gold-500/15'
                  : 'sidebar-item text-gold-500 hover:text-gold-400'}
              >
                <Shield size={17} />
                <span>Admin Panel</span>
                {isActive('/admin') && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            </>
          ) : (
            // Regular users see their full nav
            userNavItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={isActive(path) ? 'sidebar-item-active' : 'sidebar-item'}
              >
                <Icon size={17} />
                <span>{label}</span>
                {isActive(path) && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            ))
          )}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-dark-800">
          <button
            onClick={handleSignOut}
            className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut size={17} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-dark-900/50 border-b border-dark-800 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden btn-ghost p-2" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            {title && (
              <div>
                <h1 className="font-display font-bold text-lg text-dark-50">{title}</h1>
                {subtitle && <p className="text-xs text-dark-500 mt-0.5">{subtitle}</p>}
              </div>
            )}
          </div>
          {/* Hide "Activate Plan" for admins */}
          {!isAdmin && user?.subscription_status !== 'active' && (
            <Link to="/subscribe" className="btn-primary text-sm py-2">
              Activate Plan
            </Link>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
