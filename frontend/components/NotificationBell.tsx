import { useState, useEffect, useRef, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
const POLL_INTERVAL = 30_000 // 30 segundos

interface Notif {
  id: number
  type: string
  message: string
  read: number
  created_at: string | null
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return `${Math.floor(diff / 86400)}d atrás`
}

interface Props {
  userId: number | null
}

export default function NotificationBell({ userId }: Props) {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const prevUnread = useRef(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifs = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(`${API}/api/notifications/${userId}`)
      if (!res.ok) return
      const data = await res.json()
      const newUnread: number = data.unread_count ?? 0
      setNotifs(data.notifications ?? [])
      setUnread(newUnread)

      // Toast quando chegar notificação nova
      if (newUnread > prevUnread.current && prevUnread.current !== -1) {
        const newest = (data.notifications ?? [])[0]
        if (newest && newest.read === 0) {
          setToast(newest.message)
          setTimeout(() => setToast(null), 4000)
        }
      }
      prevUnread.current = newUnread
    } catch { /* silencioso */ }
  }, [userId])

  // Primeira busca + polling
  useEffect(() => {
    prevUnread.current = -1 // evita toast no load inicial
    fetchNotifs()
    const interval = setInterval(fetchNotifs, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchNotifs])

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = async () => {
    if (!userId) return
    await fetch(`${API}/api/notifications/read-all/${userId}`, { method: 'PUT' })
    setNotifs(n => n.map(x => ({ ...x, read: 1 })))
    setUnread(0)
    prevUnread.current = 0
  }

  const markRead = async (id: number) => {
    await fetch(`${API}/api/notifications/${id}/read`, { method: 'PUT' })
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: 1 } : x))
    setUnread(u => Math.max(0, u - 1))
    prevUnread.current = Math.max(0, prevUnread.current - 1)
  }

  const handleOpen = () => {
    setOpen(o => !o)
  }

  if (!userId) return null

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 80, right: 20, zIndex: 9999,
          background: 'rgba(124,58,237,0.95)',
          color: '#fff', padding: '14px 20px',
          borderRadius: 12, maxWidth: 320,
          boxShadow: '0 8px 32px rgba(124,58,237,0.4)',
          fontSize: 14, fontWeight: 500,
          animation: 'fadeInUp 0.3s ease',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          🔔 {toast}
        </div>
      )}

      {/* Bell button + dropdown */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={handleOpen}
          style={{
            position: 'relative',
            background: open ? 'var(--bg-card)' : 'none',
            border: '1px solid ' + (open ? 'var(--border)' : 'transparent'),
            borderRadius: 8, cursor: 'pointer',
            width: 38, height: 38,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, transition: 'all 0.15s',
          }}
          title="Notificações"
        >
          🔔
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              background: '#ef4444',
              color: '#fff', borderRadius: '50%',
              width: 16, height: 16,
              fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid var(--bg-primary)',
            }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {open && (
          <div style={{
            position: 'absolute', top: 46, right: 0,
            width: 340, maxHeight: 420,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 12, zIndex: 500,
            boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Notificações</span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent-primary)', fontWeight: 600 }}
                >
                  Marcar tudo como lido
                </button>
              )}
            </div>

            {/* Lista */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notifs.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔕</div>
                  Nenhuma notificação ainda
                </div>
              ) : (
                notifs.map(n => (
                  <div
                    key={n.id}
                    onClick={() => n.read === 0 && markRead(n.id)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: n.read === 0 ? 'rgba(124,58,237,0.07)' : 'transparent',
                      cursor: n.read === 0 ? 'pointer' : 'default',
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      transition: 'background 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>
                      {n.type === 'skill_support' ? '👍' : '🔔'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: n.read === 0 ? 'var(--text-primary)' : 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        {n.message}
                      </p>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                    {n.read === 0 && (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-primary)', flexShrink: 0, marginTop: 6 }} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
