'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) { setError(signInError.message); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{background:'var(--bg)',minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      <nav style={{position:'sticky',top:0,zIndex:50,backdropFilter:'blur(20px)',background:'rgba(245,240,230,0.92)',borderBottom:'1px solid var(--border)'}}>
        <div style={{maxWidth:1400,margin:'0 auto',padding:'0 20px',height:54,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <Link href="/" style={{textDecoration:'none',color:'var(--text)'}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:'0.04em',lineHeight:1}}>WC2026</div>
            <div style={{fontSize:9,fontWeight:600,color:'var(--text-faint)',letterSpacing:'0.12em',textTransform:'uppercase',marginTop:2}}>Betting game by M11</div>
          </Link>
          <Link href="/" style={{fontSize:12,fontWeight:600,color:'var(--text-dim)',textDecoration:'none',textTransform:'uppercase',letterSpacing:'0.08em'}}>← Back</Link>
        </div>
      </nav>

      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'32px 20px'}}>
        <div style={{width:'100%',maxWidth:380}}>
          <div style={{textAlign:'center',marginBottom:32}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(36px,10vw,56px)',color:'var(--text)',lineHeight:0.9,marginBottom:8}}>Welcome back</div>
            <div style={{fontSize:14,color:'var(--text-dim)'}}>Sign in to your micci WC26 account</div>
          </div>

          <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,padding:24}}>
            <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>Email</div>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required
                  className="input" style={{borderRadius:12,fontSize:15,padding:'13px 14px'}}/>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>Password</div>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password" required
                  className="input" style={{borderRadius:12,fontSize:15,padding:'13px 14px'}}/>
              </div>
              {error&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:12,padding:'12px 14px',fontSize:13,color:'#991b1b'}}>{error}</div>}
              <button type="submit" disabled={loading}
                style={{width:'100%',padding:'14px',background:'var(--text)',color:'var(--bg)',border:'none',borderRadius:14,fontWeight:700,fontSize:15,cursor:'pointer',marginTop:4}}>
                {loading?'Signing in…':'Sign in →'}
              </button>
            </form>
          </div>

          <div style={{textAlign:'center',marginTop:20,fontSize:14,color:'var(--text-faint)'}}>
            No account yet?{' '}
            <Link href="/" style={{color:'var(--text)',fontWeight:700,textDecoration:'none'}}>Join for CHF 20</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
