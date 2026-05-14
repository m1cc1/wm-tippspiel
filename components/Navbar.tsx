'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { useState } from 'react'

const ADMIN_EMAIL = 'miro.harasic@gmail.com'

export default function Navbar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const isAdmin = userEmail === ADMIN_EMAIL

  const nav = [
    { href: '/leaderboard', label: '🏆 Leaderboard' },
    { href: '/games',       label: '⚽ Games' },
    { href: '/dashboard',   label: '📋 My Tips' },
    ...(isAdmin ? [{ href: '/admin', label: '⚙️ Admin' }] : []),
  ]

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/leaderboard" className="flex items-center gap-2.5">
          <span className="font-black text-lg tracking-tight text-gray-900">mic<span className="text-yellow-500">ci</span></span>
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-widest border-l border-gray-200 pl-2.5 hidden sm:block">WC 2026</span>
        </Link>

        <div className="hidden sm:flex items-center gap-1">
          {nav.map(n => (
            <Link key={n.href} href={n.href}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                pathname === n.href ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}>
              {n.label}
            </Link>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <span className="text-gray-300 text-xs truncate max-w-[180px]">{userEmail}</span>
          <button onClick={signOut} className="text-xs font-semibold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
            Sign out
          </button>
        </div>

        <button className="sm:hidden text-gray-400 p-1" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      </div>

      {menuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-100 px-4 pb-4 pt-2 flex flex-col gap-1">
          {nav.map(n => (
            <Link key={n.href} href={n.href} className="text-gray-600 py-2 text-sm font-medium" onClick={() => setMenuOpen(false)}>
              {n.label}
            </Link>
          ))}
          <div className="text-xs text-gray-300 py-1">{userEmail}</div>
          <button onClick={signOut} className="text-left text-gray-400 py-2 text-sm">Sign out</button>
        </div>
      )}
    </nav>
  )
}
