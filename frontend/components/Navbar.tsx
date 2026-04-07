import Link from 'next/link'
import { useRouter } from 'next/router'
import NotificationBell from './NotificationBell'

interface NavbarProps {
  userId?: number | null
  userName?: string | null
  onLogout?: () => void
}

export default function Navbar({ userId, userName, onLogout }: NavbarProps) {
  const router = useRouter()

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo">
        ◈ INDICAE
      </Link>

      <ul className="navbar-links">
        <li>
          <Link href="/" className={router.pathname === '/' ? 'active' : ''}>Início</Link>
        </li>
        {userId && (
          <>
            <li><Link href="/feed" className={router.pathname === '/feed' ? 'active' : ''}>Feed</Link></li>
            <li><Link href="/busca" className={router.pathname === '/busca' ? 'active' : ''}>Buscar</Link></li>
            <li><Link href={`/perfil/${userId}`} className={router.pathname.startsWith('/perfil') ? 'active' : ''}>Meu Perfil</Link></li>
            <li><Link href="/grafo" className={router.pathname === '/grafo' ? 'active' : ''}>Grafo 3D</Link></li>
            <li><Link href="/analytics" className={router.pathname === '/analytics' ? 'active' : ''}>Analytics</Link></li>
          </>
        )}
      </ul>

      <div className="navbar-actions">
        {userId ? (
          <>
            <NotificationBell userId={userId} />
            <Link
              href={`/perfil/${userId}`}
              style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}
            >
              Olá, <strong style={{ color: 'var(--text-primary)' }}>{userName}</strong>
            </Link>
            <button className="btn btn-ghost" onClick={onLogout} style={{ padding: '8px 16px' }}>
              Sair
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '13px' }}>Entrar</Link>
            <Link href="/cadastro" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>Cadastrar</Link>
          </>
        )}
      </div>
    </nav>
  )
}
