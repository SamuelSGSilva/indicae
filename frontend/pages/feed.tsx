import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

interface UserCard {
  id_referencia: number
  nome: string
  motivo: string
  fit: string
  skills: string[]
}

export default function Feed() {
  const router = useRouter()
  const [userId, setUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [users, setUsers] = useState<UserCard[]>([])
  const [loading, setLoading] = useState(true)
  const [validatingId, setValidatingId] = useState<number | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserCard | null>(null)
  const [skillInput, setSkillInput] = useState('')
  const [upvoteSuccess, setUpvoteSuccess] = useState(false)

  useEffect(() => {
    const storedId = localStorage.getItem('indicae_user_id')
    const storedName = localStorage.getItem('indicae_user_name')
    if (!storedId) { router.push('/login'); return }
    setUserId(Number(storedId))
    setUserName(storedName)

    fetch(`${API}/api/network/users`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => { setUsers(data.matches || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleLogout = () => { localStorage.clear(); setUserId(null); setUserName(null); router.push('/') }

  const handleUpvote = async () => {
    if (!selectedUser || !skillInput.trim() || !userId) return
    const res = await fetch(`${API}/api/network/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        validator_id: userId,
        target_user_id: selectedUser.id_referencia,
        target_id: selectedUser.id_referencia,
        skill_name: skillInput,
        weight: 1,
      }),
    })
    if (res.ok) {
      setUpvoteSuccess(true)
      setTimeout(() => { setSelectedUser(null); setUpvoteSuccess(false); setSkillInput('') }, 2000)
    }
  }

  return (
    <>
      <Head><title>Feed da Rede — Indicae</title></Head>
      <Navbar userId={userId} userName={userName} onLogout={handleLogout} />
      <BottomNav userId={userId} onLogout={handleLogout} />

      {/* Modal de Upvote */}
      {selectedUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)',
        }}>
          <div className="glass-card" style={{ padding: 36, maxWidth: 420, width: '90%', position: 'relative' }}>
            <button onClick={() => setSelectedUser(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>×</button>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: 8 }}>
              👍 Dar UP para
            </h2>
            <p style={{ color: 'var(--neon-purple)', fontWeight: 600, marginBottom: 4 }}>{selectedUser.nome}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: 20 }}>
              Apoie uma habilidade específica desta pessoa na Malha Neural.
            </p>
            {upvoteSuccess ? (
              <div style={{ color: 'var(--neon-green)', fontWeight: 600, textAlign: 'center', padding: 20 }}>
                ✅ Habilidade apoiada com sucesso!
              </div>
            ) : (
              <>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                  Qual skill você valida?
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {selectedUser.skills.slice(0, 6).map(s => (
                    <button key={s} onClick={() => setSkillInput(s)}
                      className="skill-tag"
                      style={{ cursor: 'pointer', background: skillInput === s ? 'rgba(124,58,237,0.4)' : undefined }}>
                      {s}
                    </button>
                  ))}
                </div>
                <input
                  id="upvote-skill"
                  className="input"
                  placeholder="ou escreva outra skill..."
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  style={{ marginBottom: 16 }}
                />
                <button id="btn-confirm-upvote" className="btn btn-primary" onClick={handleUpvote} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                  ✦ Confirmar Apoio
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="page-wrapper">
        <div className="container" style={{ padding: '48px 24px' }}>
          <div style={{ marginBottom: 40 }}>
            <div className="section-tag">Red Neural</div>
            <h1 className="section-title">
              Feed da <span className="gradient-text">Malha</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: '15px' }}>
              Dê UP nas habilidades das pessoas que você conhece e confia.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando a rede...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {users.filter(u => u.id_referencia !== userId).map((user) => (
                <div key={user.id_referencia} className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Avatar + Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'var(--gradient-hero)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, fontWeight: 700, flexShrink: 0,
                    }}>
                      {user.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <Link href={`/perfil/${user.id_referencia}`} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 700, fontSize: '16px' }}>
                        {user.nome}
                      </Link>
                      <div style={{ fontSize: '12px', color: 'var(--neon-cyan)' }}>{user.fit}</div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
                    {user.motivo}
                  </p>

                  {/* Skills */}
                  {user.skills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {user.skills.slice(0, 5).map(s => (
                        <span key={s} className="skill-tag" style={{ fontSize: '11px' }}>{s}</span>
                      ))}
                      {user.skills.length > 5 && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '4px 8px' }}>+{user.skills.length - 5}</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button
                      id={`btn-upvote-${user.id_referencia}`}
                      className="btn btn-primary"
                      onClick={() => { setSelectedUser(user); setSkillInput(''); setUpvoteSuccess(false) }}
                      style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: '13px' }}
                    >
                      👍 Dar UP
                    </button>
                    <Link
                      href={`/perfil/${user.id_referencia}`}
                      className="btn btn-ghost"
                      style={{ padding: '10px 14px', fontSize: '13px' }}
                    >
                      Ver Perfil
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
