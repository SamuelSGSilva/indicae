import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Navbar from '../components/Navbar'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export default function Cadastro() {
  const router = useRouter()
  const [userId, setUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'b2c', github_username: '', bio: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const storedId = localStorage.getItem('indicae_user_id')
    const storedName = localStorage.getItem('indicae_user_name')
    if (storedId) { setUserId(Number(storedId)); setUserName(storedName) }
    const { error: oauthError } = router.query
    if (oauthError) setError('Erro no login com GitHub. Tente novamente.')
  }, [router.query])

  const handleLogout = () => { localStorage.clear(); setUserId(null); setUserName(null) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Erro ao cadastrar')
      localStorage.setItem('indicae_user_id', String(data.id))
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
      <Head><title>Cadastro — Indicae</title></Head>
      <Navbar userId={userId} userName={userName} onLogout={handleLogout} />
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '80px 24px' }}>
        <div style={{ width: '100%', maxWidth: 500 }}>
          <div className="glass-card" style={{ padding: 40 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <Link href="/" style={{ textDecoration: 'none', fontSize: 28, fontWeight: 800, background: 'var(--gradient-hero)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ◈ INDICAE
              </Link>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '14px' }}>Crie seu perfil na Malha Neural</p>
            </div>

            {/* GitHub CTA */}
            <button
              id="btn-github-register"
              onClick={() => window.location.href = `${API}/api/auth/github/login?bio=${encodeURIComponent(form.bio)}`}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', marginBottom: 24 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              Cadastro Rápido com GitHub (Recomendado)
            </button>

            <div style={{ position: 'relative', margin: '0 0 24px', textAlign: 'center' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--border)' }} />
              <span style={{ position: 'relative', background: 'var(--bg-card)', padding: '0 12px', color: 'var(--text-muted)', fontSize: '12px' }}>ou preencha manualmente</span>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, color: '#f87171', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nome Completo *</label>
                <input id="reg-name" className="input" placeholder="Seu Nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>E-mail *</label>
                <input id="reg-email" className="input" type="email" placeholder="seu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Senha *</label>
                <input id="reg-password" className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Perfil</label>
                <select id="reg-role" className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ cursor: 'pointer' }}>
                  <option value="b2c">Dev / Talento (B2C)</option>
                  <option value="mentor">Mentor / Colega</option>
                  <option value="b2b">Recrutador (B2B)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>GitHub Username (opcional)</label>
                <input id="reg-github" className="input" placeholder="seu-usuario-github" value={form.github_username} onChange={e => setForm({ ...form, github_username: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Bio / Apresentação</label>
                <textarea id="reg-bio" className="input" placeholder="Conte um pouco sobre você e seu estilo de trabalho..." value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} style={{ minHeight: 80, resize: 'vertical' }} />
              </div>
              <button id="btn-register-submit" type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: 8 }}>
                {loading ? 'Cadastrando...' : '🚀 Entrar na Malha Neural'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: '13px', color: 'var(--text-muted)' }}>
              Já tem conta?{' '}
              <Link href="/login" style={{ color: 'var(--neon-purple)', textDecoration: 'none', fontWeight: 600 }}>Entrar</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
