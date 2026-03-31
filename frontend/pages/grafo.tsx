'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import Navbar from '../components/Navbar'

// Force-graph is client-only (uses Three.js/WebGL)
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false })

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export default function Grafo() {
  const router = useRouter()
  const [userId, setUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)
  const [hoveredNode, setHoveredNode] = useState<any>(null)
  const fgRef = useRef<any>(null)

  useEffect(() => {
    const storedId = localStorage.getItem('indicae_user_id')
    const storedName = localStorage.getItem('indicae_user_name')
    if (!storedId) { router.push('/login'); return }
    setUserId(Number(storedId)); setUserName(storedName)

    fetch(`${API}/api/network/visualize`)
      .then(r => r.json())
      .then(data => {
        setGraphData({
          nodes: data.nodes || [],
          links: (data.links || []).map((l: any) => ({ ...l, source: l.source, target: l.target })),
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleLogout = () => { localStorage.clear(); setUserId(null); setUserName(null); router.push('/') }

  const getNodeColor = (node: any) => {
    if (node.label === 'User') return '#7c3aed'
    if (node.label === 'Skill') return '#06b6d4'
    if (node.label === 'Intention') return '#10b981'
    return '#a855f7'
  }

  return (
    <>
      <Head><title>Grafo 3D — Indicae</title></Head>
      <Navbar userId={userId} userName={userName} onLogout={handleLogout} />

      <div style={{ position: 'fixed', top: 68, left: 0, right: 0, bottom: 0, background: 'var(--bg-primary)' }}>
        {/* Info overlay */}
        <div style={{
          position: 'absolute', top: 20, left: 20, zIndex: 10,
          background: 'rgba(5,8,22,0.85)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '16px 20px',
          backdropFilter: 'blur(12px)', maxWidth: 260,
        }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, marginBottom: 12 }}>Malha Neural 3D</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { color: '#7c3aed', label: 'Usuário' },
              { color: '#06b6d4', label: 'Skill' },
              { color: '#10b981', label: 'Intenção' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)' }}>
            {graphData.nodes.length} nós · {graphData.links.length} conexões
          </div>
        </div>

        {/* Hovered node tooltip */}
        {hoveredNode && (
          <div style={{
            position: 'absolute', top: 20, right: 20, zIndex: 10,
            background: 'rgba(5,8,22,0.9)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '14px 18px',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4 }}>
              {hoveredNode.label}
            </div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>{hoveredNode.name}</div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
            <div style={{ fontSize: 40, animation: 'spin-slow 2s linear infinite' }}>◈</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Construindo a Malha Neural...</p>
          </div>
        ) : graphData.nodes.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
            <div style={{ fontSize: 40 }}>🌐</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>O Grafo está vazio.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Cadastre usuários e endosse skills para ver a Malha.</p>
          </div>
        ) : (
          <ForceGraph3D
            ref={fgRef}
            graphData={graphData}
            nodeLabel="name"
            nodeColor={getNodeColor}
            nodeOpacity={0.9}
            nodeResolution={12}
            linkColor={() => 'rgba(124,58,237,0.3)'}
            linkWidth={0.5}
            linkOpacity={0.6}
            backgroundColor="#050816"
            onNodeHover={setHoveredNode}
            onNodeClick={(node) => {
              if (fgRef.current && typeof fgRef.current.cameraPosition === 'function') {
                fgRef.current.cameraPosition(
                  { x: node.x! * 1.2, y: node.y! * 1.2, z: node.z! * 1.2 },
                  node as any,
                  1000,
                )
              }
            }}
          />
        )}
      </div>
    </>
  )
}
