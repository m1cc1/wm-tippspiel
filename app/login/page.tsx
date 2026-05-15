'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Login is now an overlay on the homepage — redirect there
export default function LoginPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/') }, [router])
  return (
    <div style={{background:'var(--bg)',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{fontFamily:'Bebas Neue',fontSize:28,color:'var(--text-faint)',letterSpacing:'0.04em'}}>Redirecting…</div>
    </div>
  )
}
