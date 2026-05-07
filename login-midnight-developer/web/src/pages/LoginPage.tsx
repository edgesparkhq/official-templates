import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { client } from '@/lib/edgespark'
import { useAuth } from '@/hooks/useAuth'
import { Logo } from '@/components/Logo'

// ─── Icons ───────────────────────────────────────────────────────────────────

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

// ─── Background blobs ─────────────────────────────────────────────────────────

function Background() {
  return (
    <div className="fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* Pink blob — top-left */}
      <div style={{
        position: 'absolute',
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, #f9c5b8 0%, #f4a49a 40%, transparent 70%)',
        top: '-15%', left: '-18%',
        filter: 'blur(80px)', opacity: 0.75,
      }} />
      {/* Lavender blob — bottom-right */}
      <div style={{
        position: 'absolute',
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, #d4dcf5 0%, #bcc8ee 40%, transparent 70%)',
        bottom: '-15%', right: '-18%',
        filter: 'blur(80px)', opacity: 0.75,
      }} />
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

type LoadingState = 'google' | 'email' | null

const inputStyle: React.CSSProperties = {
  width: '100%', height: '44px', padding: '0 14px',
  background: '#fff', border: '1px solid #d1d5db', borderRadius: '7px',
  fontSize: '13px', color: '#111', outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}
const inputFocusStyle: React.CSSProperties = {
  ...inputStyle, borderColor: '#3d8b8b',
  boxShadow: '0 0 0 3px rgba(61,139,139,0.12)',
}

export function LoginPage() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [step, setStep] = useState<'email' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState<LoadingState>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && session) navigate('/dashboard', { replace: true })
  }, [session, authLoading, navigate])

  async function handleGoogle() {
    setError(''); setLoading('google')
    try {
      await client.auth.signIn.social({ provider: 'google', callbackURL: '/dashboard' })
    } catch {
      setError('Google sign-in failed. Make sure this provider is configured.')
      setLoading(null)
    }
  }

  async function handleEmailNext(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStep('password')
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return
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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f9f9fb' }}>
      <Background />

      <div className="relative z-10 w-full max-w-[320px] text-center animate-fade-up">

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div style={{ filter: 'invert(1)' }}>
            <Logo size={32} />
          </div>
        </div>
        <p className="mb-8" style={{ fontSize: '20px', fontWeight: 600, color: '#111', letterSpacing: '-0.02em' }}>
          Welcome back
        </p>

        {step === 'email' ? (
          <form onSubmit={handleEmailNext} className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              required
              autoFocus
              autoComplete="email"
              style={inputStyle}
              onFocus={e => Object.assign(e.currentTarget.style, inputFocusStyle)}
              onBlur={e => Object.assign(e.currentTarget.style, inputStyle)}
            />

            <button
              type="submit"
              disabled={!email || isDisabled}
              className="w-full h-[44px] flex items-center justify-center text-white text-[13px] font-medium cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#3d8b8b', borderRadius: '7px' }}
            >
              Continue
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px" style={{ background: '#e5e7eb' }} />
              <span className="text-[11px] tracking-widest uppercase" style={{ color: '#9ca3af' }}>or</span>
              <div className="flex-1 h-px" style={{ background: '#e5e7eb' }} />
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={isDisabled}
              className="w-full h-[44px] flex items-center justify-center gap-2.5 text-[13px] font-medium cursor-pointer transition-all hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: '7px', color: '#374151' }}
            >
              {loading === 'google' ? <Spinner /> : <GoogleIcon />}
              Continue with Google
            </button>

            {error && <p className="text-[12px] text-left" style={{ color: '#ef4444' }}>{error}</p>}

            <p className="text-[12px] pt-2" style={{ color: '#9ca3af' }}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError('') }}
                className="underline underline-offset-2 cursor-pointer hover:text-gray-600 transition-colors"
                style={{ color: '#6b7280' }}
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <p className="text-[13px] text-left mb-1" style={{ color: '#6b7280' }}>
              Password for <span style={{ color: '#111', fontWeight: 600 }}>{email}</span>
            </p>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                required
                autoFocus
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                style={{ ...inputStyle, paddingRight: '40px' }}
                onFocus={e => Object.assign(e.currentTarget.style, { ...inputFocusStyle, paddingRight: '40px' })}
                onBlur={e => Object.assign(e.currentTarget.style, { ...inputStyle, paddingRight: '40px' })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                style={{ color: '#9ca3af' }}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>

            {error && <p className="text-[12px] text-left" style={{ color: '#ef4444' }}>{error}</p>}

            <button
              type="submit"
              disabled={isDisabled || !password}
              className="w-full h-[44px] flex items-center justify-center gap-2 text-white text-[13px] font-medium cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#3d8b8b', borderRadius: '7px' }}
            >
              {loading === 'email'
                ? <><Spinner /><span>{mode === 'signin' ? 'Signing in…' : 'Creating account…'}</span></>
                : 'Sign in'
              }
            </button>

            <button
              type="button"
              onClick={() => { setStep('email'); setError('') }}
              className="text-[13px] underline underline-offset-2 cursor-pointer hover:text-gray-600 transition-colors"
              style={{ color: '#6b7280' }}
            >
              Forgot your password?
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
