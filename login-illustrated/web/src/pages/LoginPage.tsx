import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { client } from '@/lib/edgespark'
import { useAuth } from '@/hooks/useAuth'
import { Logo } from '@/components/Logo'

// ─── Icons ───────────────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

// ─── Page ────────────────────────────────────────────────────────────────────

const TEAL = '#007C89'

const inputStyle: React.CSSProperties = {
  width: '100%', height: '38px', padding: '0 10px',
  background: '#fff', border: '1px solid #ccc', borderRadius: '2px',
  fontSize: '14px', color: '#1a1a1a', outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
}
const inputFocusStyle: React.CSSProperties = { ...inputStyle, borderColor: '#888' }

type LoadingState = 'email' | null

export function LoginPage() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState<LoadingState>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && session) navigate('/dashboard', { replace: true })
  }, [session, authLoading, navigate])

  async function handleSubmit(e: React.FormEvent) {
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
      setError('Something went wrong.')
    } finally {
      setLoading(null)
    }
  }

  if (authLoading) return null
  const isDisabled = loading !== null

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: '#FFF69A' }}>

      {/* ── White content panel ── */}
      <div style={{
        position: 'absolute',
        left: '50px', top: 0, bottom: 0,
        width: '500px',
        background: '#fff',
        display: 'flex', flexDirection: 'column',
        padding: '24px 48px 24px',
        overflowY: 'auto',
      }}>

        {/* Logo — icon only, no text */}
        <div style={{ color: '#1a1a1a', marginBottom: '52px' }}>
          <Logo size={30} />
        </div>

        {/* Main form area */}
        <div style={{ flex: 1 }}>

          {/* Title */}
          <h1 style={{
            fontSize: '52px', fontWeight: 900, color: '#1a1a1a',
            lineHeight: 1, marginBottom: '8px',
            fontFamily: '"Arial Black", "Helvetica Neue", Arial, sans-serif',
            letterSpacing: '-0.01em',
          }}>
            {mode === 'signin' ? 'Log In' : 'Sign Up'}
          </h1>

          {/* Subtitle */}
          <p style={{ fontSize: '13px', color: '#555', marginBottom: '24px' }}>
            {mode === 'signin' ? (
              <>Need an account?{' '}
                <button type="button" onClick={() => { setMode('signup'); setError('') }}
                  style={{ color: TEAL, textDecoration: 'underline', textUnderlineOffset: '2px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '13px' }}>
                  Create an account
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button type="button" onClick={() => { setMode('signin'); setError('') }}
                  style={{ color: TEAL, textDecoration: 'underline', textUnderlineOffset: '2px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '13px' }}>
                  Log in
                </button>
              </>
            )}
          </p>

          <form onSubmit={handleSubmit}>

            {/* Username */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1a1a1a', marginBottom: '5px' }}>
                Username
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                required
                autoComplete="email"
                style={inputStyle}
                onFocus={e => Object.assign(e.currentTarget.style, inputFocusStyle)}
                onBlur={e => Object.assign(e.currentTarget.style, inputStyle)}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>Password</label>
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: TEAL, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                  <EyeIcon open={showPassword} />
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                style={inputStyle}
                onFocus={e => Object.assign(e.currentTarget.style, inputFocusStyle)}
                onBlur={e => Object.assign(e.currentTarget.style, inputStyle)}
              />
            </div>

            {error && <p style={{ fontSize: '12px', color: '#e53e3e', marginBottom: '10px' }}>{error}</p>}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isDisabled || !email || !password}
              style={{
                width: '100%', height: '46px',
                background: TEAL,
                color: '#fff', fontSize: '14px', fontWeight: 700,
                borderRadius: '3px', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                marginBottom: '16px',
                opacity: isDisabled || !email || !password ? 0.55 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {loading === 'email'
                ? <><Spinner /><span>{mode === 'signin' ? 'Logging in…' : 'Creating…'}</span></>
                : mode === 'signin' ? 'Log In' : 'Create Account'}
            </button>

          </form>

          {/* Keep me logged in */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <input type="checkbox" id="keep-logged-in"
              style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: TEAL, flexShrink: 0 }} />
            <label htmlFor="keep-logged-in" style={{ fontSize: '13px', color: '#1a1a1a', cursor: 'pointer' }}>
              Keep me logged in
            </label>
          </div>

          {/* Forgot links */}
          <div>
            <button type="button" style={{ color: TEAL, textDecoration: 'underline', textUnderlineOffset: '2px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '13px' }}>
              Forgot username?
            </button>
            <span style={{ color: '#bbb', margin: '0 6px', fontSize: '13px' }}>·</span>
            <button type="button" style={{ color: TEAL, textDecoration: 'underline', textUnderlineOffset: '2px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '13px' }}>
              Forgot password?
            </button>
          </div>

        </div>

        {/* Footer */}
        <div style={{ marginTop: '24px', fontSize: '10.5px', color: '#999', lineHeight: 1.6 }}>
          <p>©2024 EdgeSpark, Inc. All rights reserved.</p>
          <p>
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Cookie Preferences</span>
            {', '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy</span>
            {', and '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms</span>
          </p>
        </div>

      </div>
    </div>
  )
}
