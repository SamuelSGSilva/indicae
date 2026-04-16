import { useEffect, useState, useCallback, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
const POLL_INTERVAL = 30_000

interface ActivityActor {
  id: number
  name: string
  avatar_url?: string | null
}

interface ActivityItem {
  id: number
  event_type: string
  skill_name?: string | null
  created_at: string | null
  actor: ActivityActor
  target_user?: ActivityActor | null
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return `${Math.floor(diff / 86400)}d atrás`
}

function Avatar({ user, size = 36 }: { user: ActivityActor; size?: number }) {
  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: '2px solid rgba(124,58,237,0.3)',
        }}
      />
    )
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.45,
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {user.name.charAt(0).toUpperCase()}
    </div>
  )
}

function ActivityText({ item }: { item: ActivityItem }) {
  if (item.event_type === 'skill_validation' && item.target_user) {
    return (
      <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        <Link
          href={`/perfil/${item.actor.id}`}
          style={{ color: 'var(--text-primary)', fontWeight: 700, textDecoration: 'none' }}
        >
          {item.actor.name}
        </Link>{' '}
        validou a skill{' '}
        <strong style={{ color: 'var(--neon-purple)' }}>{item.skill_name}</strong>{' '}
        de{' '}
        <Link
          href={`/perfil/${item.target_user.id}`}
          style={{ color: 'var(--text-primary)', fontWeight: 700, textDecoration: 'none' }}
        >
          {item.target_user.name}
        </Link>
      </span>
    )
  }

  if (item.event_type === 'user_joined') {
    return (
      <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        <Link
          href={`/perfil/${item.actor.id}`}
          style={{ color: 'var(--text-primary)', fontWeight: 700, textDecoration: 'none' }}
        >
          {item.actor.name}
        </Link>{' '}
        entrou na plataforma
      </span>
    )
  }

  if (item.event_type === 'intention_created') {
    return (
      <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        <Link
          href={`/perfil/${item.actor.id}`}
          style={{ color: 'var(--text-primary)', fontWeight: 700, textDecoration: 'none' }}
        >
          {item.actor.name}
        </Link>{' '}
        atualizou sua intenção na rede
      </span>
    )
  }

  return (
    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
      <Link
        href={`/perfil/${item.actor.id}`}
        style={{ color: 'var(--text-primary)', fontWeight: 700, textDecoration: 'none' }}
      >
        {item.actor.name}
      </Link>{' '}
      realizou uma ação
    </span>
  )
}

function eventIcon(event_type: string): string {
  switch (event_type) {
    case 'skill_validation':
      return '👍'
    case 'user_joined':
      return '🎉'
    case 'intention_created':
      return '🎯'
    default:
      return '⚡'
  }
}

function SkeletonItem() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        padding: '18px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 12, width: '70%', borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ height: 10, width: '30%', borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
      </div>
    </div>
  )
}

export default function Atividade() {
  const router = useRouter()
  const [userId, setUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/activities/feed?limit=30`)
      if (!res.ok) return
      const data: ActivityItem[] = await res.json()
      setActivities(data)
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const currentId = localStorage.getItem('indicae_user_id')
    const currentName = localStorage.getItem('indicae_user_name')

    if (!currentId) {
      router.push('/login')
      return
    }

    setUserId(Number(currentId))
    setUserName(currentName)

    fetchActivities()
    intervalRef.current = setInterval(fetchActivities, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [router, fetchActivities])

  const handleLogout = () => {
    localStorage.clear()
    setUserId(null)
    setUserName(null)
    router.push('/')
  }

  return (
    <>
      <Head>
        <title>Atividade da Rede — Indicae</title>
      </Head>
      <Navbar userId={userId} userName={userName} onLogout={handleLogout} />
      <BottomNav userId={userId} onLogout={handleLogout} />

      <div className="page-wrapper">
        <div className="container" style={{ padding: '48px 24px' }}>
          <div style={{ marginBottom: 40 }}>
            <div className="section-tag">Pulso da Rede</div>
            <h1 className="section-title">
              Atividade <span className="gradient-text">Recente</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: 15 }}>
              Acompanhe o que está acontecendo na malha em tempo real.
            </p>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              overflow: 'hidden',
              maxWidth: 680,
            }}
          >
            {loading ? (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonItem key={i} />
                ))}
              </>
            ) : activities.length === 0 ? (
              <div
                style={{
                  padding: '60px 24px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
                <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  Nenhuma atividade ainda
                </p>
                <p style={{ fontSize: 13 }}>
                  Seja o primeiro a validar uma skill ou atualizar sua intenção na rede.
                </p>
              </div>
            ) : (
              activities.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    padding: '16px 20px',
                    borderBottom:
                      index < activities.length - 1
                        ? '1px solid rgba(255,255,255,0.05)'
                        : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e =>
                    ((e.currentTarget as HTMLDivElement).style.background =
                      'rgba(124,58,237,0.04)')
                  }
                  onMouseLeave={e =>
                    ((e.currentTarget as HTMLDivElement).style.background = 'transparent')
                  }
                >
                  {/* Avatar */}
                  <Avatar user={item.actor} size={36} />

                  {/* Conteúdo */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>{eventIcon(item.event_type)}</span>
                      <ActivityText item={item} />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        display: 'block',
                      }}
                    >
                      {timeAgo(item.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
