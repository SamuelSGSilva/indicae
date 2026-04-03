import Link from 'next/link'
import { useRouter } from 'next/router'

interface BottomNavProps {
  userId?: number | null
  onLogout?: () => void
}

export default function BottomNav({ userId, onLogout }: BottomNavProps) {
  const router = useRouter()

  const isActive = (href: string) =>
    href.startsWith('/perfil')
      ? router.pathname.startsWith('/perfil')
      : router.pathname === href

  return (
    <nav className="bottom-nav">
      <Link href="/" className={`bottom-nav-item${isActive('/') ? ' bottom-nav-item--active' : ''}`}>
        <span className="bottom-nav-icon">🏠</span>
        <span className="bottom-nav-label">Início</span>
      </Link>

      {userId ? (
        <>
          <Link href="/feed" className={`bottom-nav-item${isActive('/feed') ? ' bottom-nav-item--active' : ''}`}>
            <span className="bottom-nav-icon">🌐</span>
            <span className="bottom-nav-label">Feed</span>
          </Link>

          <Link href={`/perfil/${userId}`} className={`bottom-nav-item${isActive('/perfil') ? ' bottom-nav-item--active' : ''}`}>
            <span className="bottom-nav-icon">👤</span>
            <span className="bottom-nav-label">Perfil</span>
          </Link>

          <Link href="/grafo" className={`bottom-nav-item${isActive('/grafo') ? ' bottom-nav-item--active' : ''}`}>
            <span className="bottom-nav-icon">◈</span>
            <span className="bottom-nav-label">Grafo</span>
          </Link>

          <button className="bottom-nav-item" onClick={onLogout}>
            <span className="bottom-nav-icon">🚪</span>
            <span className="bottom-nav-label">Sair</span>
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className={`bottom-nav-item${isActive('/login') ? ' bottom-nav-item--active' : ''}`}>
            <span className="bottom-nav-icon">🔑</span>
            <span className="bottom-nav-label">Entrar</span>
          </Link>

          <Link href="/cadastro" className={`bottom-nav-item${isActive('/cadastro') ? ' bottom-nav-item--active' : ''}`}>
            <span className="bottom-nav-icon">✨</span>
            <span className="bottom-nav-label">Cadastrar</span>
          </Link>
        </>
      )}
    </nav>
  )
}
