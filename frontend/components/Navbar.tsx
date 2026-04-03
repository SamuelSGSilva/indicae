import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react'

interface NavbarProps {
  userId?: number | null
  userName?: string | null
  onLogout?: () => void
}

export default function Navbar({ userId, userName, onLogout }: NavbarProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fecha o menu ao trocar de rota
  useEffect(() => {
    setMenuOpen(false)
  }, [router.pathname])

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const links = [
    { href: '/', label: 'Início', icon: '🏠' },
    ...(userId ? [
      { href: '/feed', label: 'Feed', icon: '🌐' },
      { href: `/perfil/${userId}`, label: 'Meu Perfil', icon: '👤' },
      { href: '/grafo', label: 'Grafo 3D', icon: '◈' },
      { href: '/analytics', label: 'Analytics', icon: '📊' },
    ] : []),
  ]

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar-logo">
          ◈ INDICAE
        </Link>

        {/* Links desktop */}
        <ul className="navbar-links">
          {links.map(l => (
            <li key={l.href}>
              <Link href={l.href} className={router.pathname === l.href || (l.href.startsWith('/perfil') && router.pathname.startsWith('/perfil')) ? 'active' : ''}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Ações desktop */}
        <div className="navbar-actions">
          {userId ? (
            <>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Olá, <strong style={{ color: 'var(--text-primary)' }}>{userName}</strong>
              </span>
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

        {/* Botão hambúrguer — só no mobile */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Abrir menu"
          aria-expanded={menuOpen}
        >
          <span className={`hamburger-line ${menuOpen ? 'open-1' : ''}`} />
          <span className={`hamburger-line ${menuOpen ? 'open-2' : ''}`} />
          <span className={`hamburger-line ${menuOpen ? 'open-3' : ''}`} />
        </button>
      </nav>

      {/* Menu mobile drawer */}
      <div ref={menuRef} className={`mobile-menu ${menuOpen ? 'mobile-menu--open' : ''}`}>
        <div className="mobile-menu-inner">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`mobile-menu-link ${router.pathname === l.href || (l.href.startsWith('/perfil') && router.pathname.startsWith('/perfil')) ? 'mobile-menu-link--active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="mobile-menu-icon">{l.icon}</span>
              {l.label}
            </Link>
          ))}

          <div className="mobile-menu-divider" />

          {userId ? (
            <>
              <div className="mobile-menu-user">
                Olá, <strong>{userName}</strong>
              </div>
              <button
                className="btn btn-ghost mobile-menu-btn"
                onClick={() => { setMenuOpen(false); onLogout?.() }}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost mobile-menu-btn" onClick={() => setMenuOpen(false)}>Entrar</Link>
              <Link href="/cadastro" className="btn btn-primary mobile-menu-btn" onClick={() => setMenuOpen(false)}>Cadastrar</Link>
            </>
          )}
        </div>
      </div>

      {/* Overlay escuro atrás do menu */}
      {menuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)} />
      )}
    </>
  )
}
