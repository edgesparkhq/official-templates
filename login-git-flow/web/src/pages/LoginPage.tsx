import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { client } from '@/lib/edgespark'
import { useAuth } from '@/hooks/useAuth'
import { Logo } from '@/components/Logo'

// ─── Icons ───────────────────────────────────────────────────────────────────

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function GitLabIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#FC6D26" d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path fill="currentColor" fillOpacity="0.75" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── Input styles ─────────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid transparent',
  borderRadius: '9999px',
  transition: 'background 0.15s, box-shadow 0.15s',
}
const inputFocus: React.CSSProperties = {
  background: 'rgba(255,255,255,0.09)',
  border: '1px solid transparent',
  borderRadius: '9999px',
  boxShadow: '0 0 0 2px rgba(255,255,255,0.15)',
}

// ─── Page ────────────────────────────────────────────────────────────────────

type OAuthProvider = 'github' | 'gitlab' | 'google'
type LoadingState = OAuthProvider | 'email' | null

export function LoginPage() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState<LoadingState>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && session) navigate('/dashboard', { replace: true })
  }, [session, authLoading, navigate])

  async function handleOAuth(provider: OAuthProvider) {
    setError(''); setLoading(provider)
    try {
      await client.auth.signIn.social({ provider, callbackURL: '/dashboard' })
    } catch {
      setError(`${provider} sign-in failed. Make sure this provider is configured.`)
      setLoading(null)
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setError(''); setLoading('email')
    try {
      if (mode === 'signin') {
        const r = await client.auth.signIn.email({ email, password })
        if (r.error) setError(r.error.message || 'Incorrect email or password.')
      } else {
        const r = await client.auth.signUp.email({ email, password, name: email.split('@')[0] })
        if (r.error) setError(r.error.message || 'Could not create account.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  if (authLoading) return null
  const isDisabled = loading !== null

  return (
    <div className="min-h-screen flex" style={{ background: '#0e0e0e' }}>

      {/* Noise overlay */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-50" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '180px 180px',
        opacity: 0.1,
        mixBlendMode: 'screen',
      }} />

      {/* Top-left brand */}
      <div className="fixed top-12 left-14 z-20 flex items-center">
        <span className="text-white/80 text-[13px] font-medium tracking-tight">EdgeSpark</span>
      </div>

      {/* ── Left panel: rotating logo ── */}
      <div className="hidden lg:flex flex-[2] items-center justify-center relative overflow-hidden">
        {/* Subtle radial glow behind logo */}
        <div className="absolute" style={{
          width: 560,
          height: 560,
          background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        {/* Rotating logo */}
        <div style={{
          animation: 'spin-slow 22s linear infinite',
          filter: 'drop-shadow(0 0 48px rgba(255,255,255,0.10))',
        }}>
          <Logo size={340} />
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="w-full lg:flex-[3] flex flex-col items-center justify-center px-8 py-16 relative" style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Small logo + heading */}
        <div className="w-full max-w-[320px]">
          <div className="text-center mb-8 animate-fade-up" style={{ animationDelay: '0ms' }}>
            <div className="flex justify-center mb-5">
              <Logo size={36} />
            </div>
            <h1 className="text-white text-[32px] mb-1.5" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, letterSpacing: '0.01em' }}>
              {mode === 'signin' ? 'Log in' : 'Create account'}
            </h1>
            <p className="text-white/40 text-[13px]">
              {mode === 'signin' ? 'or ' : 'already have one? '}
              <button
                type="button"
                onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(''); setShowEmailForm(false) }}
                className="text-white/60 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
              >
                {mode === 'signin' ? 'create an account' : 'sign in'}
              </button>
            </p>
          </div>

          {/* Email/password form or OAuth-first */}
          <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
            {!showEmailForm ? (
              /* OAuth buttons */
              <div className="space-y-2.5">
                {([
                  { provider: 'github' as OAuthProvider, label: 'Continue with GitHub',  icon: <GitHubIcon /> },
                  { provider: 'gitlab' as OAuthProvider, label: 'Continue with GitLab',  icon: <GitLabIcon /> },
                  { provider: 'google' as OAuthProvider, label: 'Continue with Google',  icon: <GoogleIcon /> },
                ]).map(({ provider, label, icon }) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => handleOAuth(provider)}
                    disabled={isDisabled}
                    className="w-full h-[48px] flex items-center justify-center gap-2.5 text-white/70 text-[13px] font-medium cursor-pointer transition-all duration-150 hover:text-white hover:bg-white/[0.06] disabled:opacity-35 disabled:cursor-not-allowed"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: '9999px',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {loading === provider ? <Spinner /> : icon}
                    {label}
                  </button>
                ))}

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/[0.07]" />
                  <span className="text-white/20 text-[11px] tracking-widest uppercase">or</span>
                  <div className="flex-1 h-px bg-white/[0.07]" />
                </div>

                {/* Email field */}
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  className="w-full h-[48px] px-5 text-white text-[13px] outline-none placeholder:text-white/30"
                  placeholder="Email or username"
                  style={inputBase}
                  onFocus={e => Object.assign(e.currentTarget.style, inputFocus)}
                  onBlur={e => Object.assign(e.currentTarget.style, inputBase)}
                />

                <button
                  type="button"
                  onClick={() => { if (email) setShowEmailForm(true) }}
                  disabled={!email || isDisabled}
                  className="w-full h-[48px] flex items-center justify-center bg-white text-black text-[13px] font-medium cursor-pointer transition-all duration-150 hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ borderRadius: '9999px' }}
                >
                  Enter
                </button>
              </div>
            ) : (
              /* Password step */
              <form onSubmit={handleEmailSubmit} className="space-y-2.5">
                {/* Email — read-only */}
                <div className="relative">
                  <input
                    type="text"
                    value={email}
                    readOnly
                    className="w-full h-[48px] px-5 text-white/50 text-[13px] outline-none cursor-default"
                    style={{ ...inputBase, paddingRight: '64px' }}
                  />
                  <button
                    type="button"
                    onClick={() => { setShowEmailForm(false); setError('') }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/60 text-[12px] transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                {/* Password */}
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    required
                    autoFocus
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className="w-full h-[48px] px-5 pr-11 text-white text-[13px] outline-none placeholder:text-white/30"
                    placeholder="Password"
                    style={inputBase}
                    onFocus={e => Object.assign(e.currentTarget.style, inputFocus)}
                    onBlur={e => Object.assign(e.currentTarget.style, inputBase)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>

                {error && <p className="text-red-400/90 text-[12px] px-1">{error}</p>}

                <button
                  type="submit"
                  disabled={isDisabled || !password}
                  className="w-full h-[48px] flex items-center justify-center gap-2 bg-white text-black text-[13px] font-medium cursor-pointer transition-all duration-150 hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ borderRadius: '9999px' }}
                >
                  {loading === 'email'
                    ? <><Spinner /><span>{mode === 'signin' ? 'Signing in…' : 'Creating account…'}</span></>
                    : 'Enter'
                  }
                </button>

                {mode === 'signin' && (
                  <p className="text-center text-white/30 hover:text-white/50 text-[12px] transition-colors cursor-pointer pt-0.5">
                    Forgot password?
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Bottom links */}
          <p className="text-center text-white/20 text-[11px] mt-10 animate-fade-up" style={{ animationDelay: '160ms' }}>
            <button type="button" className="hover:text-white/40 transition-colors cursor-pointer">Terms of Service</button>
            <span className="mx-2">·</span>
            <button type="button" className="hover:text-white/40 transition-colors cursor-pointer">Privacy Policy</button>
          </p>
        </div>
      </div>

    </div>
  )
}
