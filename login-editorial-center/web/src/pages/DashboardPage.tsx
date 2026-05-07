import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Logo } from '@/components/Logo'

const features = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    label: 'Deploy',
    description: 'Push to the edge in seconds',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
    label: 'Database',
    description: 'Built-in Drizzle ORM + D1',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    label: 'Auth',
    description: 'OAuth + email, zero config',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    label: 'Logs',
    description: 'Real-time edge worker logs',
  },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, loading, signOut } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/', { replace: true })
    }
  }, [user, loading, navigate])

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  if (loading || !user) return null

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{
        background: 'radial-gradient(ellipse 90% 60% at 50% -5%, rgba(100, 60, 180, 0.07) 0%, #000 65%)',
      }}
    >
      {/* Header */}
      <header className="border-b border-white/[0.07] px-6 h-14 flex items-center justify-between">
        <Logo size={24} />
        <div className="flex items-center gap-4">
          <span className="text-neutral-500 text-sm hidden sm:block">{user.email}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-neutral-400 hover:text-white text-sm transition-colors duration-100 cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-[640px] mx-auto px-6 pt-16 pb-24">

        {/* Welcome */}
        <div className="mb-12 animate-fade-up" style={{ animationDelay: '0ms' }}>
          <h1 className="text-white text-3xl font-semibold tracking-tight mb-2">
            You're in.
          </h1>
          <p className="text-neutral-500 text-base">
            Signed in as <span className="text-neutral-300">{user.email}</span>
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: '80ms' }}>
          {features.map((f) => (
            <div
              key={f.label}
              className="group rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 transition-all duration-200 hover:-translate-y-px hover:border-white/[0.15] hover:bg-white/[0.04] cursor-pointer"
            >
              <div className="text-neutral-400 group-hover:text-white mb-3 transition-colors duration-200">
                {f.icon}
              </div>
              <p className="text-white text-sm font-medium mb-0.5">{f.label}</p>
              <p className="text-neutral-600 text-xs leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>

        {/* Deploy hint */}
        <div
          className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-4 flex items-center gap-3 animate-fade-up"
          style={{ animationDelay: '160ms' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <p className="text-neutral-500 text-sm font-mono">
            <span className="text-neutral-300">edgespark deploy</span>
            {'  '}— ship your next project to the edge
          </p>
        </div>

      </main>
    </div>
  )
}
