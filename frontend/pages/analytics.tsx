import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  Cell,
} from 'recharts'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
const COLORS = ['#7c3aed', '#4f46e5', '#06b6d4', '#10b981', '#a855f7', '#ec4899', '#f59e0b', '#ef4444']

interface TrendData { top_skills: { name: string; value: number }[]; top_alphas: { name: string; validations: number; trust: number }[] }

export default function Analytics() {
  const router = useRouter()
  const [userId, setUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [data, setData] = useState<TrendData>({ top_skills: [], top_alphas: [] })
  const [loading, setLoading] = useState(true)
  const [searchSkill, setSearchSkill] = useState('')
  const [talents, setTalents] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const storedId = localStorage.getItem('indicae_user_id')
    const storedName = localStorage.getItem('indicae_user_name')
    if (!storedId) { router.push('/login'); return }
    setUserId(Number(storedId)); setUserName(storedName)
    fetch(`${API}/api/analytics/trends`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleLogout = () => { localStorage.clear(); setUserId(null); setUserName(null); router.push('/') }

  const searchTalents = async () => {
    if (!searchSkill.trim()) return
    setSearching(true)
    const res = await fetch(`${API}/api/b2b/search?skill=${encodeURIComponent(searchSkill)}`)
    const d = await res.json()
    setTalents(d.talents || [])
    setSearching(false)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: '13px' }}>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{payload[0].name}: {payload[0].value}</p>
      </div>
    )
  }

  return (
    <>
      <Head><title>Analytics B2B — Indicae</title></Head>
      <Navbar userId={userId} userName={userName} onLogout={handleLogout} />
      <div className="page-wrapper">
        <div className="container" style={{ padding: '48px 24px' }}>
          <div style={{ marginBottom: 40 }}>
            <div className="section-tag">Painel Executivo</div>
            <h1 className="section-title">
              Analytics <span className="gradient-text">B2B</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: '15px' }}>
              Inteligência de mercado baseada 100% no Grafo em tempo real.
            </p>
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 60 }}>Calculando o Grafo...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
              {/* Top Skills Bar Chart */}
              <div className="glass-card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 4, color: 'var(--neon-cyan)' }}>
                  🔥 Top Skills da Rede
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 20 }}>Habilidades mais endossadas</p>
                {data.top_skills.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data.top_skills} margin={{ left: -20 }}>
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {data.top_skills.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: 40 }}>Nenhum dado ainda. Adicione usuários e endosse skills!</p>
                )}
              </div>

              {/* Top Alphas */}
              <div className="glass-card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 4, color: 'var(--neon-purple)' }}>
                  ⭐ Top Talentos Validados
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 20 }}>Ordenados por Trust Score</p>
                {data.top_alphas.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {data.top_alphas.map((alpha, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: `linear-gradient(135deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 2) % COLORS.length]})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '14px', flexShrink: 0,
                          color: 'white',
                        }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{alpha.name}</div>
                          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                            <span style={{ fontSize: '11px', color: 'var(--neon-cyan)' }}>{alpha.validations} validações</span>
                            <span style={{ fontSize: '11px', color: 'var(--neon-green)' }}>{alpha.trust} pts trust</span>
                          </div>
                        </div>
                        <div style={{
                          padding: '4px 10px', borderRadius: 20,
                          background: 'rgba(124,58,237,0.2)', color: 'var(--neon-purple)',
                          fontSize: '12px', fontWeight: 700,
                        }}>
                          #{i + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: 40 }}>Nenhum alpha ainda. Comece a endossar!</p>
                )}
              </div>

              {/* B2B Talent Search */}
              <div className="glass-card" style={{ padding: 28, gridColumn: '1 / -1' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 4, color: 'var(--neon-green)' }}>
                  🔍 Busca de Talentos B2B
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 20 }}>
                  Filtre candidatos por habilidade — ordenados automaticamente por Trust Score do Grafo.
                </p>
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <input
                    id="b2b-search-skill"
                    className="input"
                    placeholder="Ex: Python, React, TypeScript..."
                    value={searchSkill}
                    onChange={e => setSearchSkill(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchTalents()}
                  />
                  <button id="btn-search-talents" className="btn btn-primary" onClick={searchTalents} disabled={searching} style={{ flexShrink: 0 }}>
                    {searching ? 'Buscando...' : '🔍 Buscar'}
                  </button>
                </div>
                {talents.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                    {talents.map((t, i) => (
                      <div key={i} className="glass-card" style={{ padding: 20 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>{t.nome || t.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 8 }}>{t.bio || '—'}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: 'var(--neon-cyan)' }}>{t.contato || t.email}</span>
                          <span className="badge badge-purple">{t.confianca || 0} trust</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
