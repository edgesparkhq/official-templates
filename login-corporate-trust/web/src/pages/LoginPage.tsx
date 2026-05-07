import { useState, useEffect, useRef } from 'react'
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

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path fill="currentColor" fillOpacity="0.75" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

const GREEN = '#4caf74'

const inputStyle: React.CSSProperties = {
  width: '100%', height: '38px', padding: '0 10px',
  background: '#fff', border: '1px solid #ddd', borderRadius: '5px',
  fontSize: '13.5px', color: '#1a1a1a', outline: 'none',
  transition: 'border-color 0.15s',
}
const inputFocusStyle: React.CSSProperties = { ...inputStyle, borderColor: GREEN }

type LoadingState = 'google' | 'email' | null

export function LoginPage() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState<LoadingState>(null)
  const [error, setError] = useState('')
  const [slide, setSlide] = useState(0)
  const dragStartX = useRef<number | null>(null)
  const wheelAccum = useRef(0)
  const totalSlides = 3

  // Auto-advance every 4s, reset on manual interaction
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  function resetAuto() {
    if (autoTimer.current) clearInterval(autoTimer.current)
    autoTimer.current = setInterval(() => {
      setSlide(s => (s + 1) % totalSlides)
    }, 4000)
  }
  useEffect(() => {
    resetAuto()
    return () => { if (autoTimer.current) clearInterval(autoTimer.current) }
  }, [])

  function goTo(i: number) { setSlide(i); resetAuto() }

  function handleDragStart(x: number) { dragStartX.current = x }
  function handleDragEnd(x: number) {
    if (dragStartX.current === null) return
    const diff = dragStartX.current - x
    if (Math.abs(diff) > 40) {
      goTo(diff > 0 ? Math.min(slide + 1, totalSlides - 1) : Math.max(slide - 1, 0))
    }
    dragStartX.current = null
  }

  function handleWheel(e: React.WheelEvent) {
    // Use horizontal delta (trackpad swipe)
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0
    if (delta === 0) return
    wheelAccum.current += delta
    if (Math.abs(wheelAccum.current) > 60) {
      goTo(wheelAccum.current > 0 ? Math.min(slide + 1, totalSlides - 1) : Math.max(slide - 1, 0))
      wheelAccum.current = 0
    }
  }

  const slides = [
    { img: '/slide1.jpg?v=2' },
    { img: '/slide2.jpg?v=2' },
    { img: '/slide3.jpg?v=2' },
  ]

  useEffect(() => {
    if (!authLoading && session) navigate('/dashboard', { replace: true })
  }, [session, authLoading, navigate])

  async function handleGoogle() {
    setError(''); setLoading('google')
    try {
      await client.auth.signIn.social({ provider: 'google', callbackURL: '/dashboard' })
    } catch {
      setError('Google sign-in failed.')
      setLoading(null)
    }
  }

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
    <div style={{ display: 'flex', height: '100vh', background: '#fff', overflow: 'hidden' }}>

        {/* ── Left: form panel (68%) ── */}
        <div style={{
          width: '72%', display: 'flex', flexDirection: 'column',
          padding: '24px 48px',
        }}>

          {/* Logo — top-left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ color: '#20CA8B' }}><Logo size={24} /></div>
            <span style={{ fontSize: '17px', fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.01em' }}>
              EdgeSpark
            </span>
          </div>

          {/* Form — vertically centered, horizontally centered within panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: 340 }}>

            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', marginBottom: '22px', letterSpacing: '-0.02em' }}>
              {mode === 'signin' ? 'Log In' : 'Create Account'}
            </h1>

            <form onSubmit={handleSubmit}>

              {/* Email */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                  Your work email
                </label>
                <input
                  type="email"
                  placeholder="you@company.com"
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
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  required
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  style={inputStyle}
                  onFocus={e => Object.assign(e.currentTarget.style, inputFocusStyle)}
                  onBlur={e => Object.assign(e.currentTarget.style, inputStyle)}
                />
              </div>

              {/* Forgot */}
              {mode === 'signin' && (
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '12.5px', color: '#888' }}>Can't login? </span>
                  <button type="button" style={{ fontSize: '12.5px', color: GREEN, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                    Reset password
                  </button>
                </div>
              )}

              {error && <p style={{ fontSize: '12px', color: '#e53e3e', marginBottom: '10px' }}>{error}</p>}

              {/* Log In button */}
              <button
                type="submit"
                disabled={isDisabled || !email || !password}
                style={{
                  width: '100%', height: '40px',
                  background: isDisabled || !email || !password ? '#9dd6b4' : GREEN,
                  color: '#fff', fontSize: '13.5px', fontWeight: 500,
                  borderRadius: '6px', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  marginBottom: '14px',
                }}
              >
                {loading === 'email'
                  ? <><Spinner /><span>{mode === 'signin' ? 'Logging in…' : 'Creating…'}</span></>
                  : mode === 'signin' ? 'Log In' : 'Create Account'}
              </button>

            </form>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={isDisabled}
              style={{
                width: '100%', height: '40px',
                background: '#fff', border: '1px solid #ddd', borderRadius: '6px',
                fontSize: '13.5px', color: '#333',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                cursor: 'pointer', opacity: isDisabled ? 0.5 : 1,
              }}
            >
              {loading === 'google' ? <Spinner /> : <GoogleIcon />}
              Continue with Google
            </button>

          </div>
          </div>

          {/* Bottom */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12.5px', color: '#888' }}>
              {mode === 'signin' ? (
                <>No Account?{' '}
                  <button type="button" onClick={() => { setMode('signup'); setError('') }}
                    style={{ color: GREEN, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '12.5px' }}>
                    Sign up
                  </button>
                </>
              ) : (
                <>Have an account?{' '}
                  <button type="button" onClick={() => { setMode('signin'); setError('') }}
                    style={{ color: GREEN, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '12.5px' }}>
                    Log in
                  </button>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: '18px' }}>
              {['Privacy', 'Terms', 'Learn'].map(t => (
                <span key={t} style={{ fontSize: '12.5px', color: '#aaa', cursor: 'pointer' }}>{t}</span>
              ))}
            </div>
          </div>

        </div>

        {/* ── Right: photo card (32%) ── */}
        <div className="hidden lg:block" style={{ width: '28%', padding: '24px' }}>
          <div
            onMouseDown={e => handleDragStart(e.clientX)}
            onMouseUp={e => handleDragEnd(e.clientX)}
            onTouchStart={e => handleDragStart(e.touches[0].clientX)}
            onTouchEnd={e => handleDragEnd(e.changedTouches[0].clientX)}
            onWheel={handleWheel}
            style={{
              height: '100%', borderRadius: '16px', overflow: 'hidden',
              position: 'relative', cursor: 'grab',
              background: '#111',
            }}>

            {/* Slide images — fade between them */}
            {slides.map((s, i) => (
              <img key={i} src={s.img} alt="" style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center',
                opacity: i === slide ? 1 : 0,
                transition: 'opacity 0.6s ease',
                pointerEvents: 'none',
                userSelect: 'none',
              }}/>
            ))}

            {/* Dark gradient overlay — full card, stronger at bottom */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.65) 75%, rgba(0,0,0,0.92) 100%)',
              pointerEvents: 'none',
            }}/>

            {/* Pagination dots — clickable */}
            <div style={{
              position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: '6px', alignItems: 'center',
              zIndex: 10,
            }}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  style={{
                    width: i === slide ? '18px' : '6px', height: '6px',
                    borderRadius: '3px', border: 'none', padding: 0,
                    background: i === slide ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer', transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>

          </div>
        </div>

      </div>
  )
}
