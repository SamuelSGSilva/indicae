import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export default function Login() {
  const router = useRouter()
  const [userId, setUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const storedId = localStorage.getItem('indicae_user_id')
    const storedName = localStorage.getItem('indicae_user_name')
    if (storedId) { setUserId(Number(storedId)); setUserName(storedName) }
  }, [])

  const handleLogout = () => {
    localStorage.clear(); setUserId(null); setUserName(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Credenciais inválidas')
      localStorage.setItem('indicae_user_id', String(data.user_id))
      localStorage.setItem('indicae_user_name', data.name)
      router.push('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head><title>Login — Indicae</title></Head>
      <Navbar userId={userId} userName={userName} onLogout={handleLogout} />
      <BottomNav />
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: 420, padding: '0 24px' }}>
          <div className="glass-card" style={{ padding: 40 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <Link href="/" style={{ textDecoration: 'none', fontSize: 28, fontWeight: 800, background: 'var(--gradient-hero)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ◈ INDICAE
              </Link>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '14px' }}>Bem-vindo de volta à Malha</p>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, color: '#f87171', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>E-mail</label>
                <input id="login-email" className="input" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Senha</label>
                <input id="login-password" className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button id="btn-login-submit" type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '14px' }}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div style={{ position: 'relative', margin: '24px 0', textAlign: 'center' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--border)' }} />
              <span style={{ position: 'relative', background: 'var(--bg-card)', padding: '0 12px', color: 'var(--text-muted)', fontSize: '12px' }}>ou</span>
            </div>

            <button
              id="btn-github-oauth"
              onClick={() => window.location.href = `${API}/api/auth/github/login`}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              Entrar com GitHub
            </button>

            <p style={{ textAlign: 'center', marginTop: 24, fontSize: '13px', color: 'var(--text-muted)' }}>
              Não tem conta?{' '}
              <Link href="/cadastro" style={{ color: 'var(--neon-purple)', textDecoration: 'none', fontWeight: 600 }}>Cadastrar</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
