import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { client } from '@/lib/edgespark'
import { useAuth } from '@/hooks/useAuth'
import { Logo } from '@/components/Logo'

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path fill="currentColor" fillOpacity="0.75" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

type OAuthProvider = 'github' | 'google'
type LoadingState = OAuthProvider | 'email' | null

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '34px',
  padding: '0 10px',
  background: '#fff',
  border: '1px solid #dedbd6',
  borderRadius: '4px',
  color: '#222',
  fontSize: '12px',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

const inputFocusStyle: React.CSSProperties = {
  ...inputStyle,
  borderColor: '#b8b2aa',
  boxShadow: '0 0 0 3px rgba(40, 38, 35, 0.06)',
}

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

  async function handleOAuth(provider: OAuthProvider) {
    setError('')
    setLoading(provider)
    try {
      await client.auth.signIn.social({ provider, callbackURL: '/dashboard' })
    } catch {
      setError(`${provider === 'github' ? 'GitHub' : 'Google'} sign-in is not configured yet.`)
      setLoading(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setError('')
    setLoading('email')
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
    <div style={{
      minHeight: '100vh',
      background: '#1f1f1f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '36px 18px',
    }}>
      <main style={{
        width: 'min(1120px, 100%)',
        minHeight: 'min(660px, calc(100vh - 72px))',
        background: '#f8f7f5',
        borderRadius: '20px',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(360px, 1fr)',
        boxShadow: '0 22px 80px rgba(0, 0, 0, 0.34)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
      }}>
        <section style={{
          background: '#fbfaf8',
          display: 'flex',
          flexDirection: 'column',
          padding: '34px 56px 44px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#222' }}>
            <Logo size={19} />
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '-0.02em' }}>EdgeSpark</span>
          </div>

          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '36px 0 16px',
          }}>
            <div style={{ width: '100%', maxWidth: '320px' }}>
              <h1 style={{
                color: '#222',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '27px',
                lineHeight: 1.1,
                marginBottom: '7px',
                letterSpacing: '-0.03em',
              }}>
                {mode === 'signin' ? 'Hey, welcome back' : 'Create your account'}
              </h1>
              <p style={{ color: '#9a9289', fontSize: '12px', marginBottom: '28px' }}>
                {mode === 'signin' ? 'Good to see you again!' : 'Start with email or a social account.'}
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '13px' }}>
                  <label style={{ display: 'block', color: '#776f66', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="your.email@address.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    required
                    autoComplete="email"
                    style={inputStyle}
                    onFocus={e => Object.assign(e.currentTarget.style, inputFocusStyle)}
                    onBlur={e => Object.assign(e.currentTarget.style, inputStyle)}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ color: '#776f66', fontSize: '11px', fontWeight: 600 }}>Password</label>
                    {mode === 'signin' && (
                      <button type="button" style={{
                        border: 0,
                        background: 'transparent',
                        padding: 0,
                        color: '#786f67',
                        cursor: 'pointer',
                        fontSize: '11px',
                        textDecoration: 'underline',
                        textUnderlineOffset: '2px',
                      }}>
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    required
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    style={inputStyle}
                    onFocus={e => Object.assign(e.currentTarget.style, inputFocusStyle)}
                    onBlur={e => Object.assign(e.currentTarget.style, inputStyle)}
                  />
                </div>

                {error && <p style={{ color: '#b42318', fontSize: '11px', marginBottom: '12px' }}>{error}</p>}

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
                  <button
                    type="submit"
                    disabled={isDisabled || !email || !password}
                    style={{
                      width: '74px',
                      height: '36px',
                      background: '#191919',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      opacity: isDisabled || !email || !password ? 0.48 : 1,
                    }}
                  >
                    {loading === 'email' ? <Spinner /> : mode === 'signin' ? 'Sign in' : 'Sign up'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError('') }}
                    style={{
                      border: 0,
                      background: 'transparent',
                      color: '#7a7168',
                      fontSize: '11px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      textUnderlineOffset: '2px',
                    }}
                  >
                    {mode === 'signin' ? 'Or sign up' : 'Or sign in'}
                  </button>
                </div>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#b9b3ad', fontSize: '11px', marginBottom: '14px' }}>
                <div style={{ flex: 1, height: '1px', background: '#e3dfda' }} />
                <span>or</span>
                <div style={{ flex: 1, height: '1px', background: '#e3dfda' }} />
              </div>

              <div style={{ display: 'grid', gap: '9px' }}>
                <button
                  type="button"
                  onClick={() => handleOAuth('github')}
                  disabled={isDisabled}
                  style={{
                    height: '35px',
                    background: '#fff',
                    color: '#302d2a',
                    border: '1px solid #dfdbd5',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    opacity: isDisabled ? 0.55 : 1,
                  }}
                >
                  {loading === 'github' ? <Spinner /> : <GitHubIcon />}
                  Continue with GitHub
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  disabled={isDisabled}
                  style={{
                    height: '35px',
                    background: '#fff',
                    color: '#302d2a',
                    border: '1px solid #dfdbd5',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    opacity: isDisabled ? 0.55 : 1,
                  }}
                >
                  {loading === 'google' ? <Spinner /> : <GoogleIcon />}
                  Continue with Google
                </button>
              </div>
            </div>
          </div>
        </section>

        <section style={{
          background: '#e5dfda',
          minHeight: '440px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '48px',
        }}>
          <img
            src="/illustration.png"
            alt=""
            aria-hidden="true"
            style={{
              width: 'min(360px, 78%)',
              height: 'auto',
              objectFit: 'contain',
              mixBlendMode: 'multiply',
            }}
          />
          <div style={{
            position: 'absolute',
            right: '14px',
            bottom: '14px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            borderRadius: '999px',
            background: 'rgba(31, 31, 31, 0.82)',
            color: '#fff',
            padding: '0 9px',
            fontSize: '9px',
            fontWeight: 700,
          }}>
            <Logo size={13} />
            Powered by EdgeSpark
          </div>
        </section>
      </main>
    </div>
  )
}
