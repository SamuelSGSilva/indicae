import Link from 'next/link'
import { useRouter } from 'next/router'

interface BottomNavProps {
  userId?: number | null
  onLogout?: () => void
}

export default function BottomNav({ userId, onLogout }: BottomNavProps) {
  const router = useRouter()

  const links = [
    { href: '/', label: 'Início', icon: '🏠' },
    { href: '/feed', label: 'Feed', icon: '🌐', authOnly: true },
    { href: userId ? `/perfil/${userId}` : '/login', label: 'Perfil', icon: '👤', authOnly: true },
    { href: '/grafo', label: 'Grafo', icon: '◈', authOnly: true },
    { href: '/analytics', label: 'Stats', icon: '📊', authOnly: true },
  ]

  const visibleLinks = links.filter(l => !l.authOnly || userId)

  return (
    <nav className="bottom-nav">
      {visibleLinks.map(l => {
        const active = l.href.startsWith('/perfil')
          ? router.pathname.startsWith('/perfil')
          : router.pathname === l.href
        return (
          <Link key={l.href} href={l.href} className={`bottom-nav-item${active ? ' bottom-nav-item--active' : ''}`}>
            <span className="bottom-nav-icon">{l.icon}</span>
            <span className="bottom-nav-label">{l.label}</span>
          </Link>
        )
      })}

      {userId && (
        <button className="bottom-nav-item" onClick={onLogout}>
          <span className="bottom-nav-icon">🚪</span>
          <span className="bottom-nav-label">Sair</span>
        </button>
      )}

      {!userId && (
        <Link href="/cadastro" className="bottom-nav-item">
          <span className="bottom-nav-icon">✨</span>
          <span className="bottom-nav-label">Entrar</span>
        </Link>
      )}
    </nav>
  )
}
