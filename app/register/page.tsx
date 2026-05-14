'use client'
// Registration now happens as an overlay on the homepage (app/page.tsx)
// This page redirects to home so the overlay opens there
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/') }, [router])
  return (
    <div style={{background:'var(--bg)',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{fontFamily:'Bebas Neue',fontSize:32,color:'var(--text-faint)'}}>Redirecting…</div>
    </div>
  )
}
