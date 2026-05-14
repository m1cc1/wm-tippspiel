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
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/games',       label: 'All Matches' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', warn: true }] : []),
  ]

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav style={{position:'sticky',top:0,zIndex:50,backdropFilter:'blur(20px)',background:'rgba(245,240,230,0.85)',borderBottom:'1px solid var(--border)'}}>
      <div style={{maxWidth:1400,margin:'0 auto',padding:'18px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>
        <Link href="/dashboard" style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:'0.04em',display:'flex',alignItems:'center',gap:10,textDecoration:'none',color:'var(--text)'}}>
          <div style={{width:10,height:10,background:'var(--text)',borderRadius:'50%',animation:'pulse 2s infinite'}}/>
          MICCI <span style={{color:'var(--text-faint)',fontSize:13,fontWeight:500,fontFamily:'Inter Tight',letterSpacing:'0.05em',marginLeft:4}}>/ WC26</span>
        </Link>

        <div className="hidden sm:flex" style={{display:'flex',gap:4}}>
          {nav.map(n => (
            <Link key={n.href} href={n.href}
              style={{fontSize:13,fontWeight:500,color:n.warn?'var(--warn)':pathname===n.href?'var(--text)':'var(--text-dim)',textDecoration:'none',padding:'8px 14px',borderRadius:100,letterSpacing:'0.05em',textTransform:'uppercase',background:pathname===n.href?'var(--bg-elev)':'transparent',transition:'all 0.2s'}}>
              {n.label}
            </Link>
          ))}
        </div>

        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button onClick={signOut}
            style={{display:'flex',alignItems:'center',gap:8,background:'var(--text)',color:'var(--bg)',border:'none',padding:'10px 20px',borderRadius:100,fontWeight:700,fontSize:13,cursor:'pointer',transition:'all 0.2s'}}>
            <span style={{width:6,height:6,background:'var(--highlight)',borderRadius:'50%'}}/>
            {displayName || userEmail?.split('@')[0] || '…'}
          </button>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }`}</style>
    </nav>
  )
}
