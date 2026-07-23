import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Mail, CheckCircle } from 'lucide-react'

export default function Home() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('landing')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      localStorage.setItem('token', data.token)
      setMode('verify')
      setForm({ name: '', email: '', password: '' })
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ code: verificationCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setMode('landing')
      setVerificationCode('')
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.email, form.password)
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  if (mode === 'verify') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 420, width: '100%', background: 'var(--ink2)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <CheckCircle size={40} style={{ color: 'var(--gold)', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--white)', margin: '0 0 8px' }}>Verify your email</h2>
            <p style={{ fontSize: 13, color: 'var(--slate)', margin: 0 }}>Enter the 6-digit code shown during signup</p>
          </div>

          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.slice(0, 6))}
              maxLength="6"
              style={{
                fontSize: 18,
                padding: 12,
                textAlign: 'center',
                letterSpacing: 4,
                background: 'rgba(255,255,255,.04)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-sm)',
                color: 'var(--white)',
                fontWeight: 600,
              }}
            />

            {error && <div style={{ fontSize: 12, color: '#D85A5A', padding: '8px 12px', background: 'rgba(216,90,90,.1)', borderRadius: 'var(--r-sm)' }}>{error}</div>}

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              style={{
                padding: 12,
                background: verificationCode.length === 6 ? 'var(--gold)' : 'rgba(201,168,76,.3)',
                color: verificationCode.length === 6 ? '#0A0E17' : 'var(--slate)',
                border: 'none',
                borderRadius: 'var(--r-sm)',
                fontSize: 13,
                fontWeight: 600,
                cursor: verificationCode.length === 6 ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? 'Verifying...' : 'Verify email'}
            </button>

            <button
              type="button"
              onClick={() => setMode('landing')}
              style={{
                padding: 12,
                background: 'transparent',
                color: 'var(--slate)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-sm)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Go back
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', overflow: 'hidden' }}>
      <nav style={{ padding: '20px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--parchment)', margin: 0 }}>✦ Storycanvas</h1>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '60px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 48, fontWeight: 700, color: 'var(--parchment)', marginBottom: 16 }}>Start your story</h2>
          <p style={{ fontSize: 16, color: 'var(--slate)', maxWidth: 500, margin: '0 auto' }}>Create your free account — no credit card needed</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          <div style={{ background: 'var(--ink2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--white)', marginBottom: 20 }}>Sign up</h3>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ padding: 12, background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--white)', fontSize: 13 }}
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ padding: 12, background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--white)', fontSize: 13 }}
              />
              <input
                type="password"
                placeholder="Password (6+ chars)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ padding: 12, background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--white)', fontSize: 13 }}
              />
              {error && <div style={{ fontSize: 12, color: '#D85A5A' }}>{error}</div>}
              <button
                type="submit"
                disabled={loading}
                style={{ padding: 12, background: 'var(--gold)', color: '#0A0E17', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 600, cursor: 'pointer' }}
              >
                {loading ? 'Creating...' : 'Create account'}
              </button>
            </form>
          </div>

          <div style={{ background: 'var(--ink2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--white)', marginBottom: 20 }}>Sign in</h3>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ padding: 12, background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--white)', fontSize: 13 }}
              />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ padding: 12, background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--white)', fontSize: 13 }}
              />
              {error && <div style={{ fontSize: 12, color: '#D85A5A' }}>{error}</div>}
              <button
                type="submit"
                disabled={loading}
                style={{ padding: 12, background: 'var(--gold)', color: '#0A0E17', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 600, cursor: 'pointer' }}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
