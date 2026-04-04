import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Mín. 8 caracteres', ok: password.length >= 8 },
    { label: 'Letra maiúscula', ok: /[A-Z]/.test(password) },
    { label: 'Número', ok: /[0-9]/.test(password) },
  ]
  if (!password) return null
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
      {checks.map(c => (
        <span key={c.label} style={{ fontSize: '11px', color: c.ok ? 'var(--neon-green)' : 'var(--text-muted)' }}>
          {c.ok ? '✓' : '○'} {c.label}
        </span>
      ))}
    </div>
  )
}

export default function Cadastro() {
  const router = useRouter()
  const [userId, setUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'b2c', github_username: '', bio: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState('')

  useEffect(() => {
    const storedId = localStorage.getItem('indicae_user_id')
    const storedName = localStorage.getItem('indicae_user_name')
    if (storedId) { setUserId(Number(storedId)); setUserName(storedName) }
    const { error: oauthError } = router.query
    if (oauthError) setGlobalError('Erro no login social. Verifique as configurações e tente novamente.')
  }, [router.query])

  const handleLogout = () => { localStorage.clear(); setUserId(null); setUserName(null) }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: '' }))
    setGlobalError('')
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim() || form.name.trim().length < 2)
      e.name = 'Nome precisa ter pelo menos 2 caracteres.'
    if (!form.email.trim())
      e.email = 'E-mail é obrigatório.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Formato de e-mail inválido.'
    if (!form.password)
      e.password = 'Senha é obrigatória.'
    else if (form.password.length < 8)
      e.password = 'Senha precisa ter pelo menos 8 caracteres.'
    else if (!/[A-Z]/.test(form.password))
      e.password = 'Senha precisa ter pelo menos uma letra maiúscula.'
    else if (!/[0-9]/.test(form.password))
      e.password = 'Senha precisa ter pelo menos um número.'
    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'As senhas não coincidem.'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    setGlobalError('')
    try {
      const { confirmPassword, ...payload } = form
      const res = await fetch(`${API}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, email: payload.email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Erro ao cadastrar.')
      localStorage.setItem('indicae_user_id', String(data.id))
      localStorage.setItem('indicae_user_name', data.name)
      router.push('/')
    } catch (err: any) {
      setGlobalError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fieldError = (field: string) => errors[field] ? (
    <p style={{ color: '#f87171', fontSize: '12px', marginTop: 4 }}>{errors[field]}</p>
  ) : null

  const inputStyle = (field: string) => ({
    borderColor: errors[field] ? 'rgba(239,68,68,0.6)' : undefined,
  })

  return (
    <>
      <Head><title>Cadastro — Indicae</title></Head>
      <Navbar userId={userId} userName={userName} onLogout={handleLogout} />
      <BottomNav />
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '80px 24px' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          <div className="glass-card" style={{ padding: 40 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <Link href="/" style={{ textDecoration: 'none', fontSize: 28, fontWeight: 800, background: 'var(--gradient-hero)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ◈ INDICAE
              </Link>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '14px' }}>Crie seu perfil na Malha Neural</p>
            </div>

            {/* OAuth buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
              <button
                onClick={() => window.location.href = `${API}/api/auth/github/login`}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '13px', gap: 10 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                Cadastro com GitHub (Recomendado)
              </button>
              <button
                onClick={() => window.location.href = `${API}/api/auth/google/login`}
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center', padding: '13px', gap: 10, border: '1px solid var(--border)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Cadastro com Google
              </button>
            </div>

            <div style={{ position: 'relative', margin: '20px 0', textAlign: 'center' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--border)' }} />
              <span style={{ position: 'relative', background: 'var(--bg-card)', padding: '0 12px', color: 'var(--text-muted)', fontSize: '12px' }}>ou cadastre com e-mail</span>
            </div>

            {globalError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16, color: '#f87171', fontSize: '13px' }}>
                {globalError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Nome */}
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nome Completo *</label>
                <input className="input" placeholder="Seu nome" value={form.name} onChange={set('name')} style={inputStyle('name')} />
                {fieldError('name')}
              </div>

              {/* Email */}
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>E-mail *</label>
                <input className="input" type="email" placeholder="seu@email.com" value={form.email} onChange={set('email')} style={inputStyle('email')} autoComplete="email" />
                {fieldError('email')}
              </div>

              {/* Senha */}
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Senha *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set('password')}
                    style={{ ...inputStyle('password'), paddingRight: 44 }}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <PasswordStrength password={form.password} />
                {fieldError('password')}
              </div>

              {/* Confirmar senha */}
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Confirmar Senha *</label>
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  style={inputStyle('confirmPassword')}
                  autoComplete="new-password"
                />
                {fieldError('confirmPassword')}
              </div>

              {/* Perfil */}
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Perfil</label>
                <select className="input" value={form.role} onChange={set('role')} style={{ cursor: 'pointer' }}>
                  <option value="b2c">Dev / Talento</option>
                  <option value="mentor">Mentor / Colega</option>
                  <option value="b2b">Recrutador B2B</option>
                </select>
              </div>

              {/* GitHub (opcional) */}
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  GitHub Username <span style={{ color: 'var(--text-muted)' }}>(opcional — importa suas skills automaticamente)</span>
                </label>
                <input
                  className="input"
                  placeholder="seu-usuario-github"
                  value={form.github_username}
                  onChange={set('github_username')}
                />
                {!form.github_username && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 4 }}>
                    Sem GitHub? Sem problema — você pode adicionar depois ou usar o cadastro com Google.
                  </p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Bio / Apresentação</label>
                <textarea
                  className="input"
                  placeholder="Conte um pouco sobre você e seu estilo de trabalho..."
                  value={form.bio}
                  onChange={set('bio')}
                  style={{ minHeight: 72, resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: 4 }}>
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
