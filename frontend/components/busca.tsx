import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

const ROLE_LABEL: Record<string, string> = {
  b2c: 'Dev / Talento',
  mentor: 'Mentor',
  b2b: 'Recrutador B2B',
}
const ROLE_COLOR: Record<string, string> = {
  b2c: 'var(--neon-purple)',
  mentor: 'var(--neon-cyan)',
  b2b: 'var(--neon-green)',
}

interface UserResult {
  id: number
  name: string
  bio: string
  role: string
  github_username: string
  skills: string[]
  trust_score: number
}

export default function Busca() {
  const router = useRouter()
  const [userId, setUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const storedId = localStorage.getItem('indicae_user_id')
    const storedName = localStorage.getItem('indicae_user_name')
    if (!storedId) { router.push('/login'); return }
    setUserId(Number(storedId))
    setUserName(storedName)
    inputRef.current?.focus()

    // Pré-preenche query da URL se vier de outro lugar
    const { q } = router.query
    if (q && typeof q === 'string') {
      setQuery(q)
      doSearch(q)
    }
  }, [])

  const handleLogout = () => {
    localStorage.clear(); setUserId(null); setUserName(null); router.push('/')
  }

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`${API}/api/search?q=${encodeURIComponent(q.trim())}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResults(data.results || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 400)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      doSearch(query)
    }
  }

  return (
    <>
      <Head><title>Buscar Pessoas — Indicae</title></Head>
      <Navbar userId={userId} userName={userName} onLogout={handleLogout} />
      <BottomNav userId={userId} onLogout={handleLogout} />

      <div className="page-wrapper">
        <div className="container" style={{ padding: '48px 24px', maxWidth: 800 }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <div className="section-tag">Rede Neural</div>
            <h1 className="section-title">
              Buscar <span className="gradient-text">Pessoas</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 10, fontSize: 15 }}>
              Encontre devs, mentores e recrutadores pelo nome ou habilidade.
            </p>
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', marginBottom: 32 }}>
            <span style={{
              position: 'absolute', left: 16, top: '50%',
              transform: 'translateY(-50%)', fontSize: 18,
              color: 'var(--text-muted)', pointerEvents: 'none',
            }}>🔍</span>
            <input
              ref={inputRef}
              className="input"
              placeholder="Nome ou skill... (ex: React, Samuel, Python)"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              style={{ paddingLeft: 46, paddingRight: 16, fontSize: 16, height: 52 }}
            />
            {loading && (
              <span style={{
                position: 'absolute', right: 16, top: '50%',
                transform: 'translateY(-50%)', fontSize: 14,
                color: 'var(--text-muted)',
              }}>Buscando...</span>
            )}
          </div>

          {/* Estado inicial */}
          {!searched && !loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🌐</div>
              <p style={{ fontSize: 15 }}>Digite um nome ou skill para encontrar pessoas na Malha</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
                {['Python', 'React', 'TypeScript', 'Java', 'Go', 'DevOps'].map(tag => (
                  <button
                    key={tag}
                    className="skill-tag"
                    style={{ cursor: 'pointer', fontSize: 13 }}
                    onClick={() => { setQuery(tag); doSearch(tag) }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sem resultados */}
          {searched && !loading && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔕</div>
              <p style={{ fontSize: 15 }}>Nenhuma pessoa encontrada para <strong style={{ color: 'var(--text-primary)' }}>"{query}"</strong></p>
              <p style={{ fontSize: 13, marginTop: 8 }}>Tente outro nome ou skill.</p>
            </div>
          )}

          {/* Resultados */}
          {results.length > 0 && (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {results.map(user => (
                  <div key={user.id} className="glass-card" style={{ padding: 24, display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Avatar */}
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: 'var(--gradient-hero)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, fontWeight: 700, flexShrink: 0,
                    }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{user.name}</span>
                        <span style={{ fontSize: 11, color: ROLE_COLOR[user.role] || 'var(--text-muted)', background: 'rgba(124,58,237,0.12)', padding: '2px 8px', borderRadius: 20 }}>
                          {ROLE_LABEL[user.role] || user.role}
                        </span>
                        {user.trust_score > 0 && (
                          <span style={{ fontSize: 11, color: 'var(--neon-green)', background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: 20 }}>
                            ⭐ {user.trust_score} pts
                          </span>
                        )}
                      </div>

                      {user.bio && (
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
                          {user.bio.length > 120 ? user.bio.slice(0, 120) + '...' : user.bio}
                        </p>
                      )}

                      {user.skills.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                          {user.skills.slice(0, 6).map(s => (
                            <button
                              key={s}
                              className="skill-tag"
                              style={{
                                cursor: 'pointer', fontSize: 11,
                                background: s.toLowerCase().includes(query.toLowerCase()) ? 'rgba(124,58,237,0.3)' : undefined,
                              }}
                              onClick={() => { setQuery(s); doSearch(s) }}
                            >
                              {s}
                            </button>
                          ))}
                          {user.skills.length > 6 && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 6px' }}>
                              +{user.skills.length - 6}
                            </span>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Link href={`/perfil/${user.id}`} className="btn btn-primary" style={{ padding: '7px 14px', fontSize: 12 }}>
                          Ver Perfil
                        </Link>
                        {user.github_username && (
                          <a
                            href={`https://github.com/${user.github_username}`}
                            target="_blank" rel="noopener noreferrer"
                            className="btn btn-ghost"
                            style={{ padding: '7px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                            GitHub
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
