import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export default function Home() {
  const router = useRouter()
  const [userId, setUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    // OAuth callback: ?user_id=X&user_name=Y
    const { user_id, user_name } = router.query
    if (user_id && user_name) {
      const id = Number(user_id)
      const name = String(user_name)
      localStorage.setItem('indicae_user_id', String(id))
      localStorage.setItem('indicae_user_name', name)
      setUserId(id)
      setUserName(name)
      router.replace('/', undefined, { shallow: true })
    } else {
      const storedId = localStorage.getItem('indicae_user_id')
      const storedName = localStorage.getItem('indicae_user_name')
      if (storedId) {
        setUserId(Number(storedId))
        setUserName(storedName)
      }
    }
  }, [router.query])

  const handleLogout = () => {
    localStorage.clear()
    setUserId(null)
    setUserName(null)
  }

  const handleGithubLogin = () => {
    window.location.href = `${API}/api/auth/github/login`
  }

  return (
    <>
      <Head>
        <title>Indicae — A Malha Neural de Talentos</title>
      </Head>

      <Navbar userId={userId} userName={userName} onLogout={handleLogout} />
      <BottomNav userId={userId} onLogout={handleLogout} />

      <div className="page-wrapper">
        {/* HERO */}
        <section style={{
          minHeight: '92vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background glow orbs */}
          <div style={{
            position: 'absolute', top: '10%', left: '5%',
            width: 500, height: 500,
            background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '10%', right: '5%',
            width: 400, height: 400,
            background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none',
          }} />

          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ maxWidth: 720 }}>
              <div className="section-tag animate-fade-up">
                ✦ HR-TECH · IA · GRAFOS 3D
              </div>

              <h1 className="section-title animate-fade-up" style={{ animationDelay: '0.1s', marginBottom: 24 }}>
                A <span className="gradient-text">Malha Neural</span><br />
                de Talentos
              </h1>

              <p style={{
                fontSize: '18px',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginBottom: 40,
                maxWidth: 560,
                animation: 'fadeInUp 0.6s 0.2s ease both',
              }}>
                Chega de currículos falsos. Aqui, suas habilidades são provadas pelo seu 
                <strong style={{ color: 'var(--text-primary)' }}> histórico no GitHub </strong> 
                e validadas pela sua rede. Um Grafo 3D conecta talentos a oportunidades reais em tempo real.
              </p>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', animation: 'fadeInUp 0.6s 0.3s ease both' }}>
                {!userId ? (
                  <>
                    <button
                      id="btn-github-login"
                      onClick={handleGithubLogin}
                      className="btn btn-primary"
                      style={{ fontSize: '15px', padding: '14px 28px' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                      Entrar com GitHub
                    </button>
                    <Link href="/cadastro" className="btn btn-secondary" style={{ fontSize: '15px', padding: '14px 28px' }}>
                      Criar conta manual
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/feed" className="btn btn-primary" style={{ fontSize: '15px', padding: '14px 28px' }}>
                      🚀 Ver Feed da Rede
                    </Link>
                    <Link href={`/perfil/${userId}`} className="btn btn-secondary" style={{ fontSize: '15px', padding: '14px 28px' }}>
                      👤 Meu Perfil
                    </Link>
                  </>
                )}
              </div>

              {/* Stats */}
              <div style={{
                display: 'flex',
                gap: 32,
                marginTop: 60,
                paddingTop: 40,
                borderTop: '1px solid var(--border)',
                animation: 'fadeInUp 0.6s 0.4s ease both',
              }}>
                {[
                  { value: 'Neo4j', label: 'Grafo de Conexões' },
                  { value: 'Gemini', label: 'IA Cultural Fit' },
                  { value: 'OAuth2', label: 'Identidade GitHub' },
                  { value: '3D', label: 'Visualização da Rede' },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{
                      fontSize: '20px', fontWeight: 800,
                      background: 'var(--gradient-hero)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>{s.value}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: '100px 0' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div className="section-tag" style={{ margin: '0 auto 16px' }}>Como Funciona</div>
              <h2 className="section-title">
                Três personas.<br />
                <span className="gradient-text">Um ecossistema.</span>
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              {[
                {
                  icon: '🐙',
                  role: 'Dev / Talento',
                  color: 'var(--neon-purple)',
                  desc: 'Entra com GitHub OAuth. Suas linguagens e projetos são extraídos automaticamente como "Prova de Trabalho". Sem mentiras possíveis.',
                  badge: 'B2C',
                  badgeClass: 'badge-purple',
                },
                {
                  icon: '🤝',
                  role: 'Mentor / Colega',
                  color: 'var(--neon-cyan)',
                  desc: 'Apoie habilidades de colegas com seu peso social (+1pt colega, +5pts mentor). Cada like vira uma aresta no Grafo.',
                  badge: 'VALIDADOR',
                  badgeClass: 'badge-cyan',
                },
                {
                  icon: '🏢',
                  role: 'Recrutador',
                  color: 'var(--neon-green)',
                  desc: 'Acessa o painel B2B com Analytics em tempo real. O Gemini analisa o Fit Cultural automaticamente cruzando bio + habilidades + grafo.',
                  badge: 'B2B',
                  badgeClass: 'badge-green',
                },
              ].map((card) => (
                <div key={card.role} className="glass-card" style={{ padding: 32 }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>{card.icon}</div>
                  <div className={`badge ${card.badgeClass}`} style={{ marginBottom: 12 }}>{card.badge}</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: card.color }}>
                    {card.role}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '14px' }}>
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: '40px 0',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px',
        }}>
          <div className="container">
            <p>
              ◈ <strong style={{ color: 'var(--text-secondary)' }}>INDICAE</strong> — Feito em Pair-Programming com Antigravity AI.{' '}
              <span style={{ color: 'var(--neon-purple)' }}>FastAPI + Neo4j + Next.js + Gemini</span>
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
