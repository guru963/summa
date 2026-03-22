import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Trophy, ArrowRight } from 'lucide-react'

// Pages
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import DashboardPage from '@/pages/DashboardPage'
import ScoresPage from '@/pages/ScoresPage'
import DrawPage from '@/pages/DrawPage'
import CharitiesPage from '@/pages/CharitiesPage'
import SubscribePage from '@/pages/SubscribePage'
import ProfilePage from '@/pages/ProfilePage'
import AdminPage from '@/pages/AdminPage'
import WinnersPage from '@/pages/WinnersPage'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
          <Trophy size={20} className="text-dark-950" />
        </div>
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}

// Shown when a user is authenticated but has no profile row in the DB
function ProfileSetupScreen() {
  const { createMissingProfile, signOut, session } = useAuth()
  const [name, setName] = useState(session?.user?.email?.split('@')[0] ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter your name'); return }
    setLoading(true)
    const { error } = await createMissingProfile(name)
    setLoading(false)
    if (error) setError(error)
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Trophy size={28} className="text-dark-950" />
        </div>
        <h1 className="font-display font-bold text-2xl text-dark-50 mb-2">Almost there!</h1>
        <p className="text-dark-400 text-sm mb-6">
          We need to set up your profile. Enter your name to continue.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handle} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError(null) }}
            className="input-field text-center"
            placeholder="Your full name"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading
              ? <span className="w-5 h-5 border-2 border-dark-950/50 border-t-dark-950 rounded-full animate-spin" />
              : <><span>Continue</span><ArrowRight size={15} /></>
            }
          </button>
        </form>

        <button
          onClick={signOut}
          className="text-dark-600 hover:text-dark-400 text-xs mt-6 transition-colors"
        >
          Sign out and try a different account
        </button>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, requireActive = false }: { children: React.ReactNode; requireActive?: boolean }) {
  const { user, loading, profileMissing } = useAuth()
  if (loading) return <LoadingScreen />
  if (profileMissing) return <ProfileSetupScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  // Block inactive users from protected pages that require a subscription
  if (requireActive && user.subscription_status !== 'active') {
    return <Navigate to="/subscribe" replace />
  }
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, profileMissing } = useAuth()
  if (loading) return <LoadingScreen />
  if (profileMissing) return <ProfileSetupScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/charities" element={<CharitiesPage />} />
      <Route path="/subscribe" element={<SubscribePage />} />
      <Route path="/dashboard" element={<ProtectedRoute requireActive><DashboardPage /></ProtectedRoute>} />
      <Route path="/scores" element={<ProtectedRoute requireActive><ScoresPage /></ProtectedRoute>} />
      <Route path="/draw" element={<ProtectedRoute requireActive><DrawPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/winners" element={<ProtectedRoute requireActive><WinnersPage /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#020617' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#020617' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
