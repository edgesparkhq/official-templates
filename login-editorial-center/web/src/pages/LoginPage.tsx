import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { client } from '@/lib/edgespark'
import { useAuth } from '@/hooks/useAuth'

// ─── Icons ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path fill="currentColor" fillOpacity="0.75" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

const SERIF = 'Georgia, "Times New Roman", serif'

const inputStyle: React.CSSProperties = {
  width: '100%', height: '40px', padding: '0 10px',
  background: '#fff', border: '1px solid #ccc', borderRadius: '0',
  fontSize: '14px', color: '#1a1a1a', outline: 'none',
  transition: 'border-color 0.15s', boxSizing: 'border-box',
}
const inputFocusStyle: React.CSSProperties = { ...inputStyle, borderColor: '#1a1a1a' }

type LoadingState = 'email' | null

export function LoginPage() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f2f2f0' }}>

      {/* ── Header ── */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e4e4e4',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '52px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
          <span style={{ fontFamily: SERIF, fontSize: '9px', fontWeight: 400, color: '#1a1a1a', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            The
          </span>
          <div>
            <span style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 700, color: '#1a1a1a', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              EdgeSpark
            </span>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 24px 28px' }}>

        {/* Title */}
        <h1 style={{
          fontFamily: SERIF,
          fontSize: '26px', fontWeight: 400, color: '#1a1a1a',
          letterSpacing: '0.16em', textTransform: 'uppercase',
          marginBottom: '10px', textAlign: 'center',
        }}>
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h1>

        {/* Subtitle */}
        <p style={{
          fontFamily: SERIF,
          fontSize: '15px', color: '#333', textAlign: 'center',
          maxWidth: '400px', lineHeight: 1.65, marginBottom: '44px',
          fontWeight: 400,
        }}>
          {mode === 'signin'
            ? <>Welcome back. Sign in to continue to your{' '}<span style={{ textDecoration: 'underline' }}>EdgeSpark account</span>.</>
            : <>Create your account to get started with EdgeSpark.</>}
        </p>

        {/* White card */}
        <div style={{
          background: '#fff',
          border: '1px solid #ddd',
          width: '100%', maxWidth: '380px',
          padding: '28px 28px 24px',
        }}>

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontFamily: SERIF, fontSize: '13px', fontWeight: 400, color: '#1a1a1a', marginBottom: '5px' }}>
                Email
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
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontFamily: SERIF, fontSize: '13px', fontWeight: 400, color: '#1a1a1a' }}>
                  Password
                </label>
                {mode === 'signin' && (
                  <button type="button" style={{ fontFamily: SERIF, fontSize: '12px', color: '#555', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                style={inputStyle}
                onFocus={e => Object.assign(e.currentTarget.style, inputFocusStyle)}
                onBlur={e => Object.assign(e.currentTarget.style, inputStyle)}
              />
            </div>

            {error && <p style={{ fontSize: '12px', color: '#e53e3e', marginBottom: '14px' }}>{error}</p>}

            {/* Submit — black full-width */}
            <button
              type="submit"
              disabled={isDisabled || !email || !password}
              style={{
                width: '100%', height: '44px',
                background: '#1a1a1a', color: '#fff',
                fontFamily: SERIF, fontSize: '13.5px', fontWeight: 400,
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                marginBottom: '16px',
                opacity: isDisabled || !email || !password ? 0.4 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {loading === 'email'
                ? <><Spinner /><span>{mode === 'signin' ? 'Signing in…' : 'Creating…'}</span></>
                : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>

          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
            <span style={{ fontFamily: SERIF, fontSize: '12px', color: '#999' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
          </div>

          {/* Mode toggle — outlined */}
          <button
            type="button"
            onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError('') }}
            style={{
              width: '100%', height: '44px',
              background: '#fff', color: '#1a1a1a',
              fontFamily: SERIF, fontSize: '13.5px', fontWeight: 400,
              border: '1.5px solid #1a1a1a', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {mode === 'signin' ? 'Sign in to a different account' : 'Sign in to existing account'}
          </button>

        </div>

      </main>

      {/* ── Footer ── */}
      <footer style={{ background: '#141414', padding: '32px 24px 28px', flexShrink: 0 }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          {/* Nav links */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {['About', 'Careers', 'Contact', 'Privacy Policy', 'Terms of Use'].map((t, i, arr) => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12.5px', color: '#aaa', cursor: 'pointer' }}>{t}</span>
                {i < arr.length - 1 && <span style={{ color: '#444', fontSize: '11px' }}>|</span>}
              </span>
            ))}
          </div>
          {/* Cookie Settings button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <button type="button" style={{
              background: 'transparent', border: '1px solid #555',
              color: '#aaa', fontSize: '12px', padding: '8px 20px',
              cursor: 'pointer',
            }}>
              Cookie Settings
            </button>
          </div>
          {/* Copyright */}
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#555', lineHeight: 1.7 }}>
            © {new Date().getFullYear()} EdgeSpark, Inc. All rights reserved. Use of this site constitutes
            acceptance of our{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer', color: '#777' }}>Terms of Use</span>
            {' '}and{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer', color: '#777' }}>Privacy Policy</span>.
          </p>
        </div>
      </footer>

    </div>
  )
}
