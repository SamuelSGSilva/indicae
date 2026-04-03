import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

interface NavbarProps {
  userId?: number | null
  userName?: string | null
  onLogout?: () => void
}

export default function Navbar({ userId, userName, onLogout }: NavbarProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  // Fecha ao trocar de rota
  useEffect(() => { setMenuOpen(false) }, [router.pathname])

  // Trava o scroll do body quando menu aberto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const links = [
    { href: '/', label: 'Início', icon: '🏠' },
    ...(userId ? [
      { href: '/feed', label: 'Feed', icon: '🌐' },
      { href: `/perfil/${userId}`, label: 'Meu Perfil', icon: '👤' },
      { href: '/grafo', label: 'Grafo 3D', icon: '◈' },
      { href: '/analytics', label: 'Analytics', icon: '📊' },
    ] : []),
  ]

  const isActive = (href: string) =>
    href.startsWith('/perfil')
      ? router.pathname.startsWith('/perfil')
      : router.pathname === href

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar-logo">◈ INDICAE</Link>

        {/* Links — desktop only */}
        <ul className="navbar-links">
          {links.map(l => (
            <li key={l.href}>
              <Link href={l.href} className={isActive(l.href) ? 'active' : ''}>{l.label}</Link>
            </li>
          ))}
        </ul>

        {/* Ações — desktop only */}
        <div className="navbar-actions">
          {userId ? (
            <>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Olá, <strong style={{ color: 'var(--text-primary)' }}>{userName}</strong>
              </span>
              <button className="btn btn-ghost" onClick={onLogout} style={{ padding: '8px 16px' }}>Sair</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '13px' }}>Entrar</Link>
              <Link href="/cadastro" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>Cadastrar</Link>
            </>
          )}
        </div>

        {/* Botão hambúrguer — mobile only (via CSS) */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          <span style={{
            display: 'block', width: 20, height: 2,
            background: 'var(--text-primary)', borderRadius: 2,
            transition: 'transform .25s, opacity .25s',
            transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none',
          }} />
          <span style={{
            display: 'block', width: 20, height: 2,
            background: 'var(--text-primary)', borderRadius: 2,
            transition: 'opacity .25s',
            opacity: menuOpen ? 0 : 1,
          }} />
          <span style={{
            display: 'block', width: 20, height: 2,
            background: 'var(--text-primary)', borderRadius: 2,
            transition: 'transform .25s, opacity .25s',
            transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
          }} />
        </button>
      </nav>

      {/* Overlay — clique fora fecha */}
      <div
        className="mob-overlay"
        style={{ opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? 'all' : 'none' }}
        onClick={() => setMenuOpen(false)}
      />

      {/* Drawer lateral */}
      <div className="mob-drawer" style={{ transform: menuOpen ? 'translateX(0)' : 'translateX(100%)' }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderRadius: 'var(--radius-md)',
                textDecoration: 'none', fontSize: 15, fontWeight: 500,
                color: isActive(l.href) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                background: isActive(l.href) ? 'rgba(124,58,237,0.15)' : 'transparent',
              }}
            >
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>

        <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

        {userId ? (
          <>
            <div style={{ padding: '8px 16px', color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
              Olá, <strong style={{ color: 'var(--text-primary)' }}>{userName}</strong>
            </div>
            <button
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              onClick={() => { setMenuOpen(false); onLogout?.() }}
            >
              Sair
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link href="/login" className="btn btn-ghost" onClick={() => setMenuOpen(false)}
              style={{ justifyContent: 'center', padding: '12px' }}>Entrar</Link>
            <Link href="/cadastro" className="btn btn-primary" onClick={() => setMenuOpen(false)}
              style={{ justifyContent: 'center', padding: '12px' }}>Cadastrar</Link>
          </div>
        )}
      </div>
    </>
  )
}
