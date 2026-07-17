import { createContext, useContext, useState, useEffect } from 'react'
import { API } from '../data/constants'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('sc_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(u => { setUser(u); setLoading(false) })
      .catch(() => { setToken(null); setLoading(false) })
  }, [token])

  const login = async (email, password) => {
    const r = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await r.json()
    if (!r.ok) throw new Error(data.error)
    localStorage.setItem('sc_token', data.token)
    setToken(data.token); setUser(data.user)
    return data
  }

  const register = async (name, email, password) => {
    const r = await fetch(`${API}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await r.json()
    if (!r.ok) throw new Error(data.error)
    localStorage.setItem('sc_token', data.token)
    setToken(data.token); setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('sc_token')
    setToken(null); setUser(null)
  }

  const authFetch = (url, opts = {}) =>
    fetch(url, { ...opts, headers: { ...opts.headers, Authorization: `Bearer ${token}` } })

  return (
    <AuthCtx.Provider value={{ user, token, loading, login, register, logout, authFetch }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
