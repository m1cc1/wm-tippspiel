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
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-black tracking-tight mb-1 text-gray-900">mic<span className="text-yellow-500">ci</span></div>
          <div className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-6">World Cup 2026</div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-400 mt-1 text-sm">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
          <div>
            <label className="block text-sm text-gray-500 mb-1 font-medium">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required className="input" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1 font-medium">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              required className="input" />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl mt-1">
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-4">
          No account yet?{' '}
          <Link href="/register" className="text-yellow-500 hover:text-yellow-600 font-medium">Join for CHF 20</Link>
        </p>
      </div>
    </main>
  )
}
