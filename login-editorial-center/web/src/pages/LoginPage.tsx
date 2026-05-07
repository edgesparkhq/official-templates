import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { client } from '@/lib/edgespark'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/hooks/useAuth'

type OAuthProvider = 'github' | 'google'
type LoadingState = OAuthProvider | 'email' | null

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '34px',
  padding: '0 12px',
  border: '1px solid #e2ded8',
  borderRadius: '4px',
  background: '#fff',
  color: '#211f1c',
  fontSize: '12px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 140ms ease, box-shadow 140ms ease',
}

const inputFocusStyle: React.CSSProperties = {
  ...inputStyle,
  borderColor: '#b9b2a9',
  boxShadow: '0 0 0 3px rgba(28, 27, 24, 0.05)',
}

const oauthButtonStyle: React.CSSProperties = {
  width: '100%',
  height: '34px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  border: '1px solid #e2ded8',
  borderRadius: '4px',
  background: '#fff',
  color: '#312f2b',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer',
}

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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!email || !password) return

    setError('')
    setLoading('email')

    try {
      if (mode === 'signin') {
        const result = await client.auth.signIn.email({ email, password })
        if (result.error) setError(result.error.message || 'Incorrect email or password.')
      } else {
        const result = await client.auth.signUp.email({ email, password, name: email.split('@')[0] })
        if (result.error) setError(result.error.message || 'Could not create account.')
      }
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(null)
    }
  }

  const isDisabled = loading !== null

  return (
    <div className="login-editorial-page">
      <main className="login-editorial-shell">
        <section className="login-editorial-form-panel">
          <div className="login-editorial-brand">
            <Logo size={17} />
            <span>EdgeSpark</span>
          </div>

          <div className="login-editorial-form-wrap">
            <div className="login-editorial-form">
              <h1>{mode === 'signin' ? 'Hey, welcome back' : 'Create your account'}</h1>
              <p>{mode === 'signin' ? 'Good to see you again!' : 'Start with email or a social account.'}</p>

              <form onSubmit={handleSubmit}>
                <label>
                  <span>Email address</span>
                  <input
                    type="email"
                    placeholder="your.email@address.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setError('')
                    }}
                    required
                    autoComplete="email"
                    style={inputStyle}
                    onFocus={(event) => Object.assign(event.currentTarget.style, inputFocusStyle)}
                    onBlur={(event) => Object.assign(event.currentTarget.style, inputStyle)}
                  />
                </label>

                <label>
                  <span className="login-editorial-password-row">
                    <span>Password</span>
                    {mode === 'signin' && (
                      <button type="button">Forgot password?</button>
                    )}
                  </span>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setError('')
                    }}
                    required
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    style={inputStyle}
                    onFocus={(event) => Object.assign(event.currentTarget.style, inputFocusStyle)}
                    onBlur={(event) => Object.assign(event.currentTarget.style, inputStyle)}
                  />
                </label>

                {error && <div className="login-editorial-error">{error}</div>}

                <div className="login-editorial-actions">
                  <button
                    type="submit"
                    disabled={isDisabled || !email || !password}
                    className="login-editorial-submit"
                  >
                    {loading === 'email' ? <Spinner /> : mode === 'signin' ? 'Sign in' : 'Sign up'}
                  </button>
                  <button
                    type="button"
                    className="login-editorial-switch"
                    onClick={() => {
                      setMode((current) => (current === 'signin' ? 'signup' : 'signin'))
                      setError('')
                    }}
                  >
                    {mode === 'signin' ? 'Or sign up' : 'Or sign in'}
                  </button>
                </div>
              </form>

              <div className="login-editorial-divider">
                <span />
                <em>or</em>
                <span />
              </div>

              <div className="login-editorial-oauth">
                <button
                  type="button"
                  disabled={isDisabled}
                  style={{ ...oauthButtonStyle, opacity: isDisabled ? 0.55 : 1 }}
                  onClick={() => handleOAuth('github')}
                >
                  {loading === 'github' ? <Spinner /> : <GitHubIcon />}
                  Continue with GitHub
                </button>
                <button
                  type="button"
                  disabled={isDisabled}
                  style={{ ...oauthButtonStyle, opacity: isDisabled ? 0.55 : 1 }}
                  onClick={() => handleOAuth('google')}
                >
                  {loading === 'google' ? <Spinner /> : <GoogleIcon />}
                  Continue with Google
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="login-editorial-art-panel">
          <img src="/illustration.png" alt="" aria-hidden="true" />
        </section>
      </main>
    </div>
  )
}
