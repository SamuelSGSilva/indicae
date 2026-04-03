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

  const itemStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    textDecoration: 'none',
    color: active ? '#7c3aed' : '#6b7280',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    fontFamily: 'inherit',
  })

  return (
    <>
      <style>{`
        .indicae-bottom-nav {
          display: none;
        }
        @media (max-width: 768px) {
          .indicae-bottom-nav {
            display: flex !important;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 64px;
            background: rgba(5, 8, 22, 0.97);
            border-top: 1px solid rgba(255,255,255,0.08);
            backdrop-filter: blur(20px);
            z-index: 9999;
            align-items: stretch;
          }
        }
      `}</style>

      <nav className="indicae-bottom-nav">
        <Link href="/" style={itemStyle(isActive('/'))}>
          <span style={{ fontSize: 20 }}>🏠</span>
          <span style={{ fontSize: 10, fontWeight: 500 }}>Início</span>
        </Link>

        {userId ? (
          <>
            <Link href="/feed" style={itemStyle(isActive('/feed'))}>
              <span style={{ fontSize: 20 }}>🌐</span>
              <span style={{ fontSize: 10, fontWeight: 500 }}>Feed</span>
            </Link>

            <Link href={`/perfil/${userId}`} style={itemStyle(isActive('/perfil'))}>
              <span style={{ fontSize: 20 }}>👤</span>
              <span style={{ fontSize: 10, fontWeight: 500 }}>Perfil</span>
            </Link>

            <Link href="/grafo" style={itemStyle(isActive('/grafo'))}>
              <span style={{ fontSize: 20 }}>◈</span>
              <span style={{ fontSize: 10, fontWeight: 500 }}>Grafo</span>
            </Link>

            <button style={itemStyle(false)} onClick={onLogout}>
              <span style={{ fontSize: 20 }}>🚪</span>
              <span style={{ fontSize: 10, fontWeight: 500 }}>Sair</span>
            </button>
          </>
        ) : (
          <>
            <Link href="/login" style={itemStyle(isActive('/login'))}>
              <span style={{ fontSize: 20 }}>🔑</span>
              <span style={{ fontSize: 10, fontWeight: 500 }}>Entrar</span>
            </Link>

            <Link href="/cadastro" style={itemStyle(isActive('/cadastro'))}>
              <span style={{ fontSize: 20 }}>✨</span>
              <span style={{ fontSize: 10, fontWeight: 500 }}>Cadastrar</span>
            </Link>
          </>
        )}
      </nav>
    </>
  )
}
