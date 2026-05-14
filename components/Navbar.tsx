'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { useState } from 'react'

const ADMIN_EMAIL = 'miro.harasic@gmail.com'

export default function Navbar({ userEmail, displayName }: { userEmail?: string | null, displayName?: string | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const isAdmin = userEmail === ADMIN_EMAIL

  const nav = [
    { href: '/dashboard',   label: 'Dashboard' },
    { href: '/leaderboard', label: 'Standings' },
    { href: '/games',       label: 'Matches' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', warn: true }] : []),
  ]

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <nav style={{position:'sticky',top:0,zIndex:50,backdropFilter:'blur(20px)',background:'rgba(245,240,230,0.92)',borderBottom:'1px solid var(--border)'}}>
        <div style={{maxWidth:1400,margin:'0 auto',padding:'0 20px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          {/* Logo */}
          <Link href="/dashboard" style={{textDecoration:'none',color:'var(--text)',flexShrink:0,display:'flex',flexDirection:'column',gap:1}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:24,letterSpacing:'0.04em',lineHeight:1}}>WC2026</div>
            <div style={{fontSize:9,fontWeight:600,color:'var(--text-faint)',letterSpacing:'0.12em',textTransform:'uppercase'}}>Betting game by M11</div>
          </Link>

          {/* Desktop nav */}
          <div style={{display:'flex',gap:2}} className="hide-mobile">
            {nav.map(n => (
              <Link key={n.href} href={n.href}
                style={{fontSize:12,fontWeight:600,color:n.warn?'var(--warn)':pathname===n.href?'var(--text)':'var(--text-dim)',textDecoration:'none',padding:'7px 12px',borderRadius:100,letterSpacing:'0.05em',textTransform:'uppercase',background:pathname===n.href?'var(--bg-elev)':'transparent',transition:'all 0.2s'}}>
                {n.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
            {/* User pill — desktop */}
            <button onClick={signOut}
              style={{display:'flex',alignItems:'center',gap:6,background:'var(--text)',color:'var(--bg)',border:'none',padding:'8px 16px',borderRadius:100,fontWeight:700,fontSize:12,cursor:'pointer'}}
              className="hide-mobile">
              <span style={{width:5,height:5,background:'var(--highlight)',borderRadius:'50%'}}/>
              {displayName || '…'}
            </button>

            {/* Hamburger — mobile only */}
            <button onClick={()=>setMenuOpen(!menuOpen)}
              style={{display:'none',background:'var(--bg-elev)',border:'1px solid var(--border)',borderRadius:10,padding:'8px 10px',cursor:'pointer',fontSize:16,lineHeight:1}}
              className="show-mobile">
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{background:'var(--bg)',borderTop:'1px solid var(--border)',padding:'16px 20px',display:'flex',flexDirection:'column',gap:4}}>
            {nav.map(n=>(
              <Link key={n.href} href={n.href} onClick={()=>setMenuOpen(false)}
                style={{fontSize:14,fontWeight:600,color:n.warn?'var(--warn)':pathname===n.href?'var(--text)':'var(--text-dim)',textDecoration:'none',padding:'12px 16px',borderRadius:12,background:pathname===n.href?'var(--bg-elev)':'transparent',textTransform:'uppercase',letterSpacing:'0.06em'}}>
                {n.label}
              </Link>
            ))}
            <div style={{borderTop:'1px solid var(--border)',marginTop:8,paddingTop:12}}>
              <div style={{fontSize:12,color:'var(--text-faint)',padding:'4px 16px',marginBottom:4}}>{userEmail}</div>
              <button onClick={signOut} style={{width:'100%',textAlign:'left',background:'none',border:'none',color:'var(--text-dim)',fontSize:14,fontWeight:600,padding:'12px 16px',cursor:'pointer',borderRadius:12}}>Sign out</button>
            </div>
          </div>
        )}
      </nav>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.85)}}
        @media(max-width:768px){.hide-mobile{display:none!important}.show-mobile{display:flex!important}}
        @media(min-width:769px){.show-mobile{display:none!important}}
      `}</style>
    </>
  )
}
