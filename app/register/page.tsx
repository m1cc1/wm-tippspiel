'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'

type Step = 'code' | 'register' | 'payment'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [step, setStep] = useState<Step>('code')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function checkCode(e: React.FormEvent) {
    e.preventDefault()
    setCodeError('')
    setLoading(true)
    const { data } = await supabase.from('settings').select('value').eq('key', 'invite_code').single()
    setLoading(false)
    if (code.trim().toUpperCase() === data?.value?.toUpperCase()) {
      setStep('register')
    } else {
      setCodeError('Invalid invite code. Ask micci for the code to join.')
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (name.trim().length < 2) { setError('Display name must be at least 2 characters.'); return }
    setLoading(true)
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        display_name: name.trim(),
        status: 'pending',
        invite_code: code.trim().toUpperCase(),
      })
    }
    setLoading(false)
    setStep('payment')
  }

  if (step === 'code') return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-black tracking-tight mb-1 text-slate-900">mic<span className="text-yellow-600">ci</span></div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">World Cup 2026</div>
          <h1 className="text-2xl font-bold text-slate-900">Enter invite code</h1>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">This is a private game. You need an invite code from micci to participate.</p>
        </div>
        <form onSubmit={checkCode} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
          <div>
            <label className="block text-sm text-slate-500 mb-2 font-medium">Invite code</label>
            <input
              type="text" value={code} onChange={e => setCode(e.target.value)}
              placeholder="MICCI2026" required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono font-bold text-lg tracking-widest uppercase placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-center"
            />
          </div>
          {codeError && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2 text-center">{codeError}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl font-bold">
            {loading ? 'Checking…' : 'Continue →'}
          </button>
        </form>
        <p className="text-center text-slate-400 text-sm mt-4">
          Already registered? <Link href="/login" className="text-yellow-600 hover:text-yellow-700 font-medium">Sign in</Link>
        </p>
      </div>
    </main>
  )

  if (step === 'register') return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-black tracking-tight mb-1 text-slate-900">mic<span className="text-yellow-600">ci</span></div>
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-4">✓ Valid invite code</div>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        </div>
        <form onSubmit={handleRegister} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
          <div>
            <label className="block text-sm text-slate-500 mb-1 font-medium">Display name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Torjäger99" required className="input" />
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1 font-medium">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="input" />
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1 font-medium">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" minLength={8} required className="input" />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl font-bold">
            {loading ? 'Creating account…' : 'Create account →'}
          </button>
        </form>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-3xl font-black tracking-tight mb-1 text-slate-900">mic<span className="text-yellow-600">ci</span></div>
          <div className="text-4xl mb-3 mt-4">🎉</div>
          <h1 className="text-2xl font-bold text-slate-900">Account created!</h1>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">Pay the entry fee to activate your account and join the game.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-4">
          <div className="text-center mb-5">
            <div className="text-3xl font-black text-slate-900">CHF 20.00</div>
            <div className="text-xs text-slate-400 mt-1">One-time entry · Non-refundable</div>
          </div>
          <div className="w-44 h-44 mx-auto mb-5 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center flex-col gap-2 bg-slate-50">
            <div className="text-3xl">📲</div>
            <div className="text-xs text-slate-400 text-center leading-relaxed font-medium">Replace with your<br/>Twint QR code</div>
          </div>
          <div className="flex flex-col gap-3">
            {['Open Twint → tap "Pay" → scan QR', 'Enter CHF 20 and add your name as reference', 'Your account will be activated within 24h'].map((s, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-slate-600">
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</div>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-800 mb-4">
          <strong>⏳ Pending activation</strong><br/>
          You can browse, but predictions are locked until micci confirms your payment.
        </div>
        <button onClick={() => router.push('/dashboard')} className="btn-primary w-full py-3 rounded-xl font-bold">
          Go to dashboard →
        </button>
        <p className="text-center text-xs text-slate-400 mt-3">Questions? tippspiel@micci.ch</p>
      </div>
    </main>
  )
}
