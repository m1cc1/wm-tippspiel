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
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [emailConfirm, setEmailConfirm] = useState('')
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
    if (firstName.trim().length < 2) { setError('Please enter your first name.'); return }
    if (lastName.trim().length < 1) { setError('Please enter your last name.'); return }
    if (email !== emailConfirm) { setError('Email addresses do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }

    setLoading(true)
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    if (data.user) {
      const displayName = `${firstName.trim()} ${lastName.trim().charAt(0).toUpperCase()}.`
      await supabase.from('profiles').insert({
        id: data.user.id,
        display_name: displayName,
        status: 'pending',
        invite_code: code.trim().toUpperCase(),
      })
    }
    setLoading(false)
    setStep('payment')
  }

  // ── Step 1: Invite code ───────────────────────────────────
  if (step === 'code') return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-black tracking-tight mb-1 text-gray-900">mic<span className="text-yellow-500">ci</span></div>
          <div className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-6">World Cup 2026</div>
          <h1 className="text-2xl font-bold text-gray-900">Enter invite code</h1>
          <p className="text-gray-400 mt-2 text-sm leading-relaxed">This is a private game. You need an invite code from micci to participate.</p>
        </div>
        <form onSubmit={checkCode} className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
          <div>
            <label className="block text-sm text-gray-500 mb-2 font-medium">Invite code</label>
            <input
              type="text" value={code} onChange={e => setCode(e.target.value)}
              placeholder="MICCI2026" required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-mono font-bold text-lg tracking-widest uppercase placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-center"
            />
          </div>
          {codeError && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2 text-center">{codeError}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl">
            {loading ? 'Checking…' : 'Continue →'}
          </button>
        </form>
        <p className="text-center text-gray-400 text-sm mt-4">
          Already registered? <Link href="/login" className="text-yellow-500 hover:text-yellow-600 font-medium">Sign in</Link>
        </p>
      </div>
    </main>
  )

  // ── Step 2: Register ──────────────────────────────────────
  if (step === 'register') return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-black tracking-tight mb-1 text-gray-900">mic<span className="text-yellow-500">ci</span></div>
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 text-xs font-bold px-3 py-1 rounded-full mb-4">
            ✓ Valid invite code
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-400 mt-1 text-sm">
            You'll appear in the leaderboard as e.g. <strong className="text-gray-600">Miro H.</strong>
          </p>
        </div>
        <form onSubmit={handleRegister} className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-500 mb-1 font-medium">First name</label>
              <input
                type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                placeholder="Miro" required className="input"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1 font-medium">Last name</label>
              <input
                type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                placeholder="Harasic" required className="input"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1 font-medium">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required className="input"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1 font-medium">Confirm email</label>
            <input
              type="email" value={emailConfirm} onChange={e => setEmailConfirm(e.target.value)}
              placeholder="you@example.com" required className="input"
              style={{ borderColor: emailConfirm && email !== emailConfirm ? '#f87171' : '' }}
            />
            {emailConfirm && email !== emailConfirm && (
              <p className="text-red-400 text-xs mt-1">Emails do not match</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1 font-medium">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 characters" minLength={8} required className="input"
            />
          </div>

          {/* Live name preview */}
          {firstName && lastName && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-2.5 text-sm text-yellow-700 font-medium text-center">
              You'll appear as: <strong>{firstName.trim()} {lastName.trim().charAt(0).toUpperCase()}.</strong>
            </div>
          )}

          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl mt-1">
            {loading ? 'Creating account…' : 'Create account →'}
          </button>
        </form>
      </div>
    </main>
  )

  // ── Step 3: Payment via Twint ─────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-3xl font-black tracking-tight mb-1 text-gray-900">mic<span className="text-yellow-500">ci</span></div>
          <div className="text-4xl mb-3 mt-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900">Almost there!</h1>
          <p className="text-gray-400 mt-2 text-sm leading-relaxed">
            Hi <strong className="text-gray-700">{firstName} {lastName.charAt(0).toUpperCase()}.</strong> — one last step.<br/>
            Pay the CHF 20 entry fee to activate your account.
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-4">
          {/* Amount */}
          <div className="text-center mb-6">
            <div className="text-4xl font-black text-gray-900">CHF 20.00</div>
            <div className="text-xs text-gray-300 mt-1">One-time entry · Non-refundable</div>
          </div>

          {/* Twint instructions */}
          <div className="bg-gray-50 rounded-2xl p-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-2xl">📱</div>
              <div className="font-bold text-gray-900 text-sm">Pay via Twint</div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                <div>Open <strong>Twint</strong> → tap <strong>"Pay"</strong> → enter phone number</div>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                <div>
                  Send to: <button
                    onClick={() => navigator.clipboard.writeText('+41794256477')}
                    className="font-black text-gray-900 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-lg text-sm hover:bg-yellow-100 transition-colors"
                  >
                    +41 79 425 64 77
                  </button>
                  <span className="text-xs text-gray-400 ml-1">(tap to copy)</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                <div>
                  Amount: <strong>CHF 20</strong> · Message: <strong className="bg-gray-200 px-2 py-0.5 rounded-lg font-mono text-xs">WC2026</strong>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
                <div>Your account will be <strong>activated within 24h</strong> after payment</div>
              </div>
            </div>
          </div>

          {/* Phone number big display */}
          <div className="border border-gray-100 rounded-2xl p-4 text-center mb-2">
            <div className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Twint number</div>
            <div className="text-2xl font-black text-gray-900 tracking-tight">+41 79 425 64 77</div>
            <div className="text-xs text-gray-400 mt-1">Message: <span className="font-mono font-bold text-gray-600">WC2026</span></div>
          </div>
        </div>

        {/* Pending notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-700 mb-4">
          <strong>⏳ Pending activation</strong><br/>
          You can browse the site, but predictions are locked until micci confirms your payment.
        </div>

        <button onClick={() => router.push('/dashboard')} className="btn-primary w-full py-3 rounded-xl">
          Go to dashboard →
        </button>
        <p className="text-center text-xs text-gray-300 mt-3">Questions? tippspiel@micci.ch</p>
      </div>
    </main>
  )
}
