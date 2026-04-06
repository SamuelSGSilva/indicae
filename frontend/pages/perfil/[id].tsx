import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import AvatarUpload from '../../components/AvatarUpload'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

interface Badge { icon: string; name: string; desc: string }
interface TrustDimensions { github: number; social: number; activity: number }
interface Profile {
  id: number; name: string; email: string; role: string
  github_username: string; bio: string; trust_score: number
  trust_dimensions: TrustDimensions
  skills: string[]; intentions: string[]; badges: Badge[]
  avatar_url: string
}

export default function Perfil() {
  const router = useRouter()
  const { id } = router.query
  const [userId, setUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editBio, setEditBio] = useState(false)
  const [bioText, setBioText] = useState('')
  const [intention, setIntention] = useState('')
  const [intentSent, setIntentSent] = useState(false)
  const [matches, setMatches] = useState<any[]>([])
  const [avatarUrl, setAvatarUrl] = useState<string>('')

  useEffect(() => {
    const storedId = localStorage.getItem('indicae_user_id')
    const storedName = localStorage.getItem('indicae_user_name')
    if (storedId) { setUserId(Number(storedId)); setUserName(storedName) }
  }, [])

  useEffect(() => {
    if (!id) return
    fetch(`${API}/api/users/${id}/profile`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (data && data.name) {
          setProfile({
            ...data,
            skills: data.skills || [],
            badges: data.badges || [],
            intentions: data.intentions || [],
            avatar_url: data.avatar_url || '',
            trust_dimensions: data.trust_dimensions || { github: 0, social: 0, activity: 0 },
          })
          setBioText(data.bio || '')
          setAvatarUrl(data.avatar_url || '')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const handleLogout = () => { localStorage.clear(); setUserId(null); setUserName(null); router.push('/') }

  const saveBio = async () => {
    if (!id) return
    await fetch(`${API}/api/users/${id}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: bioText }),
    })
    setProfile(p => p ? { ...p, bio: bioText } : p)
    setEditBio(false)
  }

  const sendIntention = async () => {
    if (!id || !intention.trim()) return
    await fetch(`${API}/api/intentions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: Number(id), intent_text: intention }),
    })
    setIntentSent(true)
    setIntention('')
    const res = await fetch(`${API}/api/match/${id}`)
    const data = await res.json()
    setMatches(data.matches || [])
  }

  const isOwnProfile = userId === Number(id)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
      Carregando perfil...
    </div>
  )

  if (!profile) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
      Perfil não encontrado.
    </div>
  )

  const roleLabels: Record<string, string> = { b2c: 'Dev / Talento', mentor: 'Mentor', b2b: 'Recrutador B2B' }
  const roleColors: Record<string, string> = { b2c: 'var(--neon-purple)', mentor: 'var(--neon-cyan)', b2b: 'var(--neon-green)' }

  return (
    <>
      <Head><title>{profile.name} — Indicae</title></Head>
      <Navbar userId={userId} userName={userName} onLogout={handleLogout} />
      <BottomNav userId={userId} onLogout={handleLogout} />
      <div className="page-wrapper">
        <div className="container" style={{ padding: '48px 24px' }}>

          {/* Header Card */}
          <div className="glass-card" style={{ padding: 40, marginBottom: 24, display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Avatar — editável no próprio perfil, somente leitura nos outros */}
            {isOwnProfile ? (
              <AvatarUpload
                userId={userId!}
                currentAvatar={avatarUrl}
                userName={profile.name}
                githubUsername={profile.github_username || undefined}
                onUpdated={(url) => setAvatarUrl(url)}
              />
            ) : (
              <div style={{
                width: 96, height: 96, borderRadius: '50%',
                overflow: 'hidden', flexShrink: 0,
                border: '3px solid rgba(124,58,237,0.5)',
                animation: 'pulse-glow 3s ease-in-out infinite',
              }}>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profile.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'var(--gradient-hero)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 36, fontWeight: 700, color: '#fff',
                  }}>
                    {(profile.name ?? '?').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800 }}>{profile.name}</h1>
                <span className="badge badge-purple" style={{ color: roleColors[profile.role] }}>
                  {roleLabels[profile.role] || profile.role}
                </span>
              </div>
              {profile.github_username && (
                <a
                  href={`https://github.com/${profile.github_username}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', marginBottom: 12 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  @{profile.github_username}
                </a>
              )}
              {editBio ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <textarea
                    className="input"
                    value={bioText}
                    onChange={e => setBioText(e.target.value)}
                    style={{ minHeight: 80, resize: 'vertical', flex: 1, minWidth: 200 }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="btn btn-primary" onClick={saveBio} style={{ padding: '8px 16px', fontSize: '13px' }}>Salvar</button>
                    <button className="btn btn-ghost" onClick={() => setEditBio(false)} style={{ padding: '8px 16px', fontSize: '13px' }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7 }}>
                    {profile.bio || 'Sem bio cadastrada.'}
                  </p>
                  {isOwnProfile && (
                    <button className="btn btn-ghost" onClick={() => setEditBio(true)} style={{ padding: '4px 10px', fontSize: '12px', flexShrink: 0 }}>
                      ✏️ Editar
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Trust Score — 3 dimensões */}
            <div style={{ flexShrink: 0, minWidth: 160 }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Trust Score — {profile.trust_score || 0} pts
              </div>
              {[
                { label: 'GitHub', value: profile.trust_dimensions?.github ?? 0, color: 'var(--neon-cyan)', icon: '🐱' },
                { label: 'Social', value: profile.trust_dimensions?.social ?? 0, color: 'var(--neon-purple)', icon: '🤝' },
                { label: 'Atividade', value: profile.trust_dimensions?.activity ?? 0, color: 'var(--neon-green)', icon: '⚡' },
              ].map(({ label, value, color, icon }) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{icon} {label}</span>
                    <span style={{ color, fontWeight: 700 }}>{value}/50</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min((value / 50) * 100, 100)}%`,
                      background: color,
                      borderRadius: 4,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {/* Skills */}
            <div className="glass-card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neon-cyan)', margin: 0 }}>
                  🐙 Skills (via GitHub)
                </h2>
                {isOwnProfile && (
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                    onClick={async () => {
                      const res = await fetch(`${API}/api/users/${id}/sync-skills`, { method: 'POST' })
                      if (res.ok) {
                        const data = await res.json()
                        setProfile(p => p ? { ...p, skills: data.skills } : p)
                      }
                    }}
                  >
                    🔄 Sincronizar
                  </button>
                )}
              </div>
              {profile.skills.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {profile.skills.map(s => (
                    <span key={s} className="skill-tag">{s}</span>
                  ))}
                </div>
              ) : (
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: 12 }}>Nenhuma skill mapeada ainda.</p>
                  {isOwnProfile && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Clique em "Sincronizar" para buscar suas linguagens no GitHub.</p>
                  )}
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="glass-card" style={{ padding: 28 }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 16, color: 'var(--neon-purple)' }}>
                🏆 Conquistas
              </h2>
              {profile.badges.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {profile.badges.map(b => (
                    <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24 }}>{b.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{b.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Complete seu perfil para ganhar badges!</p>
              )}
            </div>

            {/* Intentions */}
            {isOwnProfile && (
              <div className="glass-card" style={{ padding: 28, gridColumn: '1 / -1' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 8, color: 'var(--neon-green)' }}>
                  🧠 Intenção (IA Match)
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Conte o que você está buscando agora. A IA vai encontrar pessoas com intenções similares na rede.
                </p>
                {intentSent && (
                  <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16, color: 'var(--neon-green)', fontSize: '13px' }}>
                    ✅ Intenção registrada! {matches.length} match(es) encontrado(s).
                  </div>
                )}
                {matches.length > 0 && (
                  <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {matches.map((m, i) => (
                      <div key={i} className="glass-card" style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: 20 }}>🔗</span>
                        <div>
                          <strong style={{ fontSize: '14px' }}>{m.Nome}</strong>
                          <span className="badge badge-green" style={{ marginLeft: 8 }}>{m.Fit}</span>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.Motivo}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12 }}>
                  <input
                    id="intention-input"
                    className="input"
                    placeholder="Ex: Quero aprender Rust com mentores experientes..."
                    value={intention}
                    onChange={e => setIntention(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendIntention()}
                  />
                  <button id="btn-send-intention" className="btn btn-primary" onClick={sendIntention} style={{ flexShrink: 0 }}>
                    Buscar Match
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
