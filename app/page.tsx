'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'

const MATCHES = [
  { home:'Mexico',      hf:'🇲🇽', away:'South Africa', af:'🇿🇦', group:'Group A', venue:'Estadio Azteca, Mexico City',    utcMs:Date.UTC(2026,5,11,19,0), homeP:52, drawP:24, awayP:24 },
  { home:'South Korea', hf:'🇰🇷', away:'Czechia',      af:'🇨🇿', group:'Group A', venue:'Estadio Akron, Zapopan',         utcMs:Date.UTC(2026,5,12,2,0),  homeP:44, drawP:28, awayP:28 },
  { home:'Canada',      hf:'🇨🇦', away:'Bosnia & H.',  af:'🇧🇦', group:'Group B', venue:'BMO Field, Toronto',             utcMs:Date.UTC(2026,5,12,19,0), homeP:46, drawP:27, awayP:27 },
  { home:'USA',         hf:'🇺🇸', away:'Paraguay',     af:'🇵🇾', group:'Group D', venue:'SoFi Stadium, Los Angeles',      utcMs:Date.UTC(2026,5,13,0,0),  homeP:55, drawP:23, awayP:22 },
  { home:'Brazil',      hf:'🇧🇷', away:'Morocco',      af:'🇲🇦', group:'Group C', venue:'MetLife Stadium, New Jersey',    utcMs:Date.UTC(2026,5,13,22,0), homeP:54, drawP:24, awayP:22 },
  { home:'France',      hf:'🇫🇷', away:'Senegal',      af:'🇸🇳', group:'Group I', venue:'MetLife Stadium, New Jersey',    utcMs:Date.UTC(2026,5,15,19,0), homeP:62, drawP:22, awayP:16 },
]

const NEWS = [
  { tag:'Preview',  h:'Mexico vs South Africa: The opening match of the biggest World Cup in history', t:'3h ago' },
  { tag:'Official', h:'Record 5.8 million tickets sold — WM 2026 set to be the most-watched sporting event ever', t:'6h ago' },
  { tag:'Team News',h:'France confirm Mbappé in starting XI for opener against Senegal', t:'8h ago' },
  { tag:'Stadiums', h:"A guide to all 16 World Cup venues: from New York's MetLife to Mexico City's Azteca", t:'1d ago' },
  { tag:'Stars',    h:'The 10 players to watch at WM 2026 — Messi, Vinicius, Bellingham and more', t:'1d ago' },
  { tag:'History',  h:'48 teams for the first time: why the expanded format changes the tournament forever', t:'2d ago' },
]

const TZ_OPTIONS = [
  { label:'🇺🇸 Los Angeles (UTC−7)', offset:-7 },
  { label:'🇲🇽 Mexico City (UTC−6)', offset:-6 },
  { label:'🇺🇸 New York (UTC−5)',    offset:-5 },
  { label:'🇧🇷 São Paulo (UTC−4)',   offset:-4 },
  { label:'🇬🇧 London (UTC+0)',      offset: 0 },
  { label:'🇨🇭 Zurich (UTC+1)',      offset: 1 },
  { label:'🇬🇷 Athens (UTC+2)',      offset: 2 },
  { label:'🇸🇦 Riyadh (UTC+3)',      offset: 3 },
  { label:'🇨🇳 Beijing (UTC+8)',     offset: 8 },
  { label:'🇯🇵 Tokyo (UTC+9)',       offset: 9 },
]

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtDateTime(utcMs: number, tz: number) {
  const d = new Date(utcMs + tz * 3_600_000)
  return {
    time: `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`,
    date: `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`,
  }
}

type ModalStep = 'closed' | 'code' | 'register' | 'payment'

const ADMIN_EMAIL = 'miro.harasic@gmail.com'

export default function HomePage() {
  const supabase = createBrowserClient()
  const [tz, setTz] = useState(1)
  const [toast, setToast] = useState('')
  const [modalStep, setModalStep] = useState<ModalStep>('closed')

  // Registration state
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [email, setEmail]         = useState('')
  const [emailConfirm, setEmailConfirm] = useState('')
  const [password, setPassword]   = useState('')
  const [regError, setRegError]   = useState('')
  const [loading, setLoading]     = useState(false)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  function openModal() {
    setModalStep('code')
    setCode(''); setCodeError(''); setFirstName(''); setLastName('')
    setEmail(''); setEmailConfirm(''); setPassword(''); setRegError('')
  }
  function closeModal() { setModalStep('closed') }

  async function checkCode(e: React.FormEvent) {
    e.preventDefault()
    setCodeError('')
    setLoading(true)
    const { data } = await supabase.from('settings').select('value').eq('key', 'invite_code').single()
    setLoading(false)
    if (code.trim().toUpperCase() === data?.value?.toUpperCase()) {
      setModalStep('register')
    } else {
      setCodeError('Invalid invite code. Ask micci for the code.')
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setRegError('')
    if (firstName.trim().length < 2) { setRegError('Please enter your first name.'); return }
    if (lastName.trim().length < 1)  { setRegError('Please enter your last name.'); return }
    if (email !== emailConfirm)       { setRegError('Email addresses do not match.'); return }
    if (password.length < 8)         { setRegError('Password must be at least 8 characters.'); return }

    setLoading(true)
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setRegError(signUpError.message); setLoading(false); return }

    if (data.user) {
      const displayName = `${firstName.trim()} ${lastName.trim().charAt(0).toUpperCase()}.`
      const isAdmin = email.toLowerCase() === ADMIN_EMAIL
      await supabase.from('profiles').insert({
        id: data.user.id,
        display_name: displayName,
        status: isAdmin ? 'active' : 'pending',
        invite_code: code.trim().toUpperCase(),
      })
    }
    setLoading(false)
    setModalStep('payment')
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl animate-fade-in">
          {toast}
        </div>
      )}

      {/* REGISTRATION OVERLAY MODAL */}
      {modalStep !== 'closed' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Gold top bar */}
            <div className="h-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400" />

            {/* Close button */}
            <button onClick={closeModal} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center text-sm transition-colors">✕</button>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 pt-5 pb-2 px-6">
              {['Code','Details','Payment'].map((s, i) => {
                const stepNum = i + 1
                const currentStep = modalStep === 'code' ? 1 : modalStep === 'register' ? 2 : 3
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      stepNum < currentStep ? 'bg-green-500 text-white' :
                      stepNum === currentStep ? 'bg-gray-900 text-white' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {stepNum < currentStep ? '✓' : stepNum}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${stepNum === currentStep ? 'text-gray-900' : 'text-gray-300'}`}>{s}</span>
                    {i < 2 && <div className="w-6 h-px bg-gray-200 hidden sm:block" />}
                  </div>
                )
              })}
            </div>

            <div className="px-6 pb-6 pt-3">

              {/* ── STEP 1: Invite Code ── */}
              {modalStep === 'code' && (
                <>
                  <div className="text-center mb-5">
                    <div className="text-2xl font-black tracking-tight text-gray-900 mb-1">mic<span className="text-yellow-500">ci</span></div>
                    <h2 className="text-lg font-bold text-gray-900">Enter invite code</h2>
                    <p className="text-gray-400 text-xs mt-1">Private game — you need a code from micci to join.</p>
                  </div>
                  <form onSubmit={checkCode} className="flex flex-col gap-3">
                    <input
                      type="text" value={code} onChange={e => setCode(e.target.value)}
                      placeholder="MICCI2026" required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-mono font-bold text-xl tracking-widest uppercase placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-center"
                    />
                    {codeError && <p className="text-red-500 text-xs bg-red-50 rounded-xl px-3 py-2 text-center">{codeError}</p>}
                    <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl">
                      {loading ? 'Checking…' : 'Continue →'}
                    </button>
                    <p className="text-center text-xs text-gray-400">
                      Already registered? <Link href="/login" className="text-yellow-500 font-semibold" onClick={closeModal}>Sign in</Link>
                    </p>
                  </form>
                </>
              )}

              {/* ── STEP 2: Register Form ── */}
              {modalStep === 'register' && (
                <>
                  <div className="text-center mb-5">
                    <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-600 text-xs font-bold px-3 py-1 rounded-full mb-2">✓ Valid code</div>
                    <h2 className="text-lg font-bold text-gray-900">Create your account</h2>
                    <p className="text-gray-400 text-xs mt-1">You'll appear as e.g. <strong className="text-gray-600">Miro H.</strong></p>
                  </div>
                  <form onSubmit={handleRegister} className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1 font-medium">First name</label>
                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                          placeholder="Miro" required className="input text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1 font-medium">Last name</label>
                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                          placeholder="Harasic" required className="input text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">Email</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com" required className="input text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">Confirm email</label>
                      <input type="email" value={emailConfirm} onChange={e => setEmailConfirm(e.target.value)}
                        placeholder="you@example.com" required className="input text-sm"
                        style={{ borderColor: emailConfirm && email !== emailConfirm ? '#f87171' : '' }} />
                      {emailConfirm && email !== emailConfirm && (
                        <p className="text-red-400 text-xs mt-1">Emails do not match</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">Password</label>
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="Min. 8 characters" minLength={8} required className="input text-sm" />
                    </div>
                    {firstName && lastName && (
                      <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2 text-xs text-yellow-700 font-medium text-center">
                        You'll appear as: <strong>{firstName.trim()} {lastName.trim().charAt(0).toUpperCase()}.</strong>
                      </div>
                    )}
                    {regError && <p className="text-red-500 text-xs bg-red-50 rounded-xl px-3 py-2">{regError}</p>}
                    <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl">
                      {loading ? 'Creating account…' : 'Create account →'}
                    </button>
                  </form>
                </>
              )}

              {/* ── STEP 3: Payment ── */}
              {modalStep === 'payment' && (
                <>
                  <div className="text-center mb-5">
                    <div className="text-3xl mb-2">🎉</div>
                    <h2 className="text-lg font-bold text-gray-900">Account created!</h2>
                    <p className="text-gray-400 text-xs mt-1">
                      Hi <strong className="text-gray-700">{firstName} {lastName.charAt(0).toUpperCase()}.</strong> — pay to activate your account.
                    </p>
                  </div>

                  <div className="text-center mb-4">
                    <div className="text-3xl font-black text-gray-900">CHF 20.00</div>
                    <div className="text-xs text-gray-300 mt-0.5">One-time entry · Non-refundable</div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">📱</span>
                      <span className="font-bold text-gray-900 text-sm">Pay via Twint</span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {[
                        <>Open Twint → tap <strong>"Pay"</strong> → enter number</>,
                        <>Send to: <button onClick={() => {navigator.clipboard.writeText('+41794256477'); showToast('📋 Number copied!')}} className="font-black text-gray-900 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-lg text-xs hover:bg-yellow-100">+41 79 425 64 77</button> <span className="text-gray-300 text-xs">tap to copy</span></>,
                        <>Amount: <strong>CHF 20</strong> · Message: <strong className="bg-gray-200 px-1.5 py-0.5 rounded font-mono text-xs">WC2026</strong></>,
                        <>Account activated <strong>within 24h</strong></>,
                      ].map((s, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-gray-600">
                          <div className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</div>
                          <div>{s}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-2xl p-3 text-center mb-4">
                    <div className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide font-medium">Twint number</div>
                    <div className="text-xl font-black text-gray-900">+41 79 425 64 77</div>
                    <div className="text-xs text-gray-400 mt-0.5">Message: <span className="font-mono font-bold text-gray-600">WC2026</span></div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 text-xs text-yellow-700 mb-4">
                    <strong>⏳ Pending</strong> — browse freely, predictions unlock after activation.
                  </div>

                  <Link href="/dashboard" onClick={closeModal} className="btn-primary w-full py-3 rounded-xl text-center block">
                    Go to dashboard →
                  </Link>
                  <p className="text-center text-xs text-gray-300 mt-2">Questions? tippspiel@micci.ch</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="font-black text-xl tracking-tight text-gray-900">mic<span className="text-yellow-500">ci</span></span>
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-widest border-l border-gray-200 pl-3 hidden sm:block">World Cup 2026</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400 font-medium hidden md:block">Timezone</span>
            <select value={tz} onChange={e => setTz(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400">
              {TZ_OPTIONS.map(o => <option key={o.offset} value={o.offset}>{o.label}</option>)}
            </select>
            <Link href="/login" className="text-xs font-semibold text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              Sign in
            </Link>
            <button onClick={openModal} className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
              Join · CHF 20
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div className="bg-white border-b border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400" />
        <div className="max-w-5xl mx-auto px-5 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-xs font-bold text-yellow-700 uppercase tracking-widest mb-6">
            🏆 June 11 – July 19, 2026 · USA · Canada · Mexico
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none mb-4 text-gray-900">
            World Cup 2026<br />
            <span className="text-yellow-500">Betting</span>{' '}
            <span className="font-light text-gray-400">Game</span>
          </h1>
          <p className="text-gray-400 text-base max-w-md mx-auto mb-8 leading-relaxed">
            Predict every match, score points, and battle for the prize pool — leaderboard updates live with every goal.
          </p>
          <div className="flex gap-3 justify-center mb-12">
            <button onClick={openModal} className="bg-gray-900 text-white font-bold px-7 py-3 rounded-xl hover:bg-gray-700 transition-colors text-sm">
              Join for CHF 20 →
            </button>
            <Link href="/leaderboard" className="bg-white text-gray-700 font-semibold px-7 py-3 rounded-xl border border-gray-200 hover:border-gray-400 transition-colors text-sm">
              View leaderboard
            </Link>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { icon:'⚡', text:'Live leaderboard',      sub:'Updates with every goal' },
              { icon:'⚽', text:'104 matches to predict', sub:'Group stage through Final' },
              { icon:'🏆', text:'Real prize pool',        sub:'CHF 20 entry · top 3 win' },
              { icon:'🎯', text:'Up to 10 pts per game',  sub:'Exact score = max points' },
            ].map(p => (
              <div key={p.text} className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-full px-4 py-2">
                <span className="text-base">{p.icon}</span>
                <div className="text-left">
                  <div className="text-xs font-semibold text-gray-700">{p.text}</div>
                  <div className="text-xs text-gray-400">{p.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-10">

        {/* PRIZE POOL BANNER */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-10 flex flex-wrap gap-6 items-center">
          <div className="flex-1 min-w-[180px]">
            <div className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-1">💰 Prize Pool</div>
            <div className="text-2xl font-black text-white">Grows with every signup</div>
            <div className="text-gray-500 text-xs mt-1">CHF 20 entry · paid via Twint · distributed after July 19 Final</div>
          </div>
          <div className="flex gap-3">
            {[['🥇','60%','1st'],['🥈','25%','2nd'],['🥉','15%','3rd']].map(([m,p,l]) => (
              <div key={String(l)} className="bg-white/10 rounded-xl px-4 py-3 text-center min-w-[64px]">
                <div className="text-lg mb-0.5">{m}</div>
                <div className="text-white font-bold text-sm">{p}</div>
                <div className="text-gray-500 text-xs">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* POINTS SYSTEM */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">🎯 Points System</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { pts:'5 pts', label:'Correct winner / draw',  sub:'Right outcome',       color:'text-yellow-500', bg:'bg-yellow-50',  border:'border-yellow-100' },
            { pts:'3 pts', label:'Correct goal difference', sub:'e.g. both 2–0',      color:'text-orange-500', bg:'bg-orange-50',  border:'border-orange-100' },
            { pts:'1 pt',  label:'Correct goals per team', sub:'1 pt each side',      color:'text-blue-500',   bg:'bg-blue-50',    border:'border-blue-100'   },
            { pts:'20 pts',label:'Bonus questions',        sub:'Winner & top scorer', color:'text-green-600',  bg:'bg-green-50',   border:'border-green-100'  },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 text-center`}>
              <div className={`text-xl font-black ${s.color} mb-1`}>{s.pts}</div>
              <div className="text-xs font-semibold text-gray-700 leading-snug">{s.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* NEXT 6 MATCHES */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">⚽ Next Matches</h2>
          <Link href="/games" className="text-xs text-gray-400 hover:text-gray-700 font-medium">Full schedule →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          {MATCHES.map((m, i) => {
            const { time, date } = fmtDateTime(m.utcMs, tz)
            return (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-gray-200 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">{m.group}</span>
                  <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">{date} · {time}</span>
                </div>
                <div className="text-xs text-gray-300 mb-3 truncate">📍 {m.venue}</div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 text-center">
                    <div className="text-2xl mb-1">{m.hf}</div>
                    <div className="text-xs font-semibold text-gray-700">{m.home}</div>
                    <div className="text-xs text-gray-300 mt-0.5">{m.homeP}% win</div>
                  </div>
                  <div className="text-gray-200 text-sm min-w-[28px] text-center">vs</div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl mb-1">{m.af}</div>
                    <div className="text-xs font-semibold text-gray-700">{m.away}</div>
                    <div className="text-xs text-gray-300 mt-0.5">{m.awayP}% win</div>
                  </div>
                </div>
                <div className="flex h-1 rounded-full overflow-hidden mb-1.5">
                  <div className="bg-gray-800" style={{ width:`${m.homeP}%` }} />
                  <div className="bg-gray-200" style={{ width:`${m.drawP}%` }} />
                  <div className="bg-yellow-400" style={{ width:`${m.awayP}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-300 mb-3">
                  <span>{m.hf} {m.homeP}%</span><span>Draw {m.drawP}%</span><span>{m.af} {m.awayP}%</span>
                </div>
                <div className="border-t border-gray-50 pt-3 flex items-center gap-2">
                  <span className="text-xs text-gray-300 flex-1">Your tip:</span>
                  <input onFocus={() => showToast('👋 Sign in to enter predictions')} type="number" min={0} max={20} placeholder="0"
                    className="w-8 h-7 border border-gray-200 rounded-lg text-center text-xs font-bold bg-gray-50 focus:outline-none" />
                  <span className="text-gray-200 text-xs">:</span>
                  <input onFocus={() => showToast('👋 Sign in to enter predictions')} type="number" min={0} max={20} placeholder="0"
                    className="w-8 h-7 border border-gray-200 rounded-lg text-center text-xs font-bold bg-gray-50 focus:outline-none" />
                  <button onClick={() => showToast('👋 Sign in to enter predictions')}
                    className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors">
                    Save
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* SPECIAL PREDICTIONS */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">🏆 Special Predictions</h2>
          <span className="text-xs text-yellow-500 font-bold">⏳ Locks June 11 at kickoff</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {[
            { icon:'🥇', title:'Tournament Winner',        sub:'Which country lifts the trophy at MetLife Stadium on July 19?' },
            { icon:'👟', title:"Top Scorer's Nationality", sub:'Which country will the Golden Boot winner come from?' },
          ].map(s => (
            <div key={s.title} className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-sm font-bold text-gray-900">{s.title}</div>
                  <div className="text-xs text-gray-400 mt-1 leading-relaxed">{s.sub}</div>
                </div>
                <span className="bg-green-50 border border-green-100 text-green-600 text-xs font-black px-2.5 py-1 rounded-full ml-3 flex-shrink-0">20 pts</span>
              </div>
              <select onFocus={() => showToast('👋 Sign in to enter predictions')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 focus:outline-none cursor-pointer">
                <option>— Select a team —</option>
                {['🇫🇷 France','🇧🇷 Brazil','🇦🇷 Argentina','🇩🇪 Germany','🇪🇸 Spain','🇵🇹 Portugal','🏴󠁧󠁢󠁥󠁮󠁧󠁿 England','🇳🇱 Netherlands','🇺🇸 USA','🇲🇽 Mexico','🇯🇵 Japan','🇰🇷 South Korea'].map(t => <option key={t}>{t}</option>)}
              </select>
              <div className="text-xs text-yellow-500 font-semibold mt-3">🔒 Changeable until June 11, 2026</div>
            </div>
          ))}
        </div>

        {/* LEADERBOARD PREVIEW */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">🏅 Leaderboard</h2>
          <Link href="/leaderboard" className="text-xs text-gray-400 hover:text-gray-700 font-medium">Full table →</Link>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-10 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">Live prize pool · updates with every goal</span>
            <span className="flex items-center gap-1.5 text-xs text-red-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />Live
            </span>
          </div>
          {[
            { rank:'🥇', av:'MR', bg:'#fef3c7', fg:'#d97706', name:'Marco R.',   pts:142, delta:'+5',  prize:'CHF 144', pct:'60%', pc:'text-yellow-500' },
            { rank:'🥈', av:'JK', bg:'#f0fdf4', fg:'#16a34a', name:'Julia K.',   pts:128, delta:'+3',  prize:'CHF 60',  pct:'25%', pc:'text-gray-400'   },
            { rank:'🥉', av:'AX', bg:'#eff6ff', fg:'#2563eb', name:'You (Alex)', pts:105, delta:'+8',  prize:'CHF 36',  pct:'15%', pc:'text-amber-600', me:true },
            { rank:'4',  av:'SM', bg:'#fdf4ff', fg:'#9333ea', name:'Stefan M.',  pts:98,  delta:'—',   prize:'—',       pct:'',    pc:'text-gray-200'   },
            { rank:'5',  av:'LB', bg:'#fff1f2', fg:'#e11d48', name:'Lisa B.',    pts:87,  delta:'—',   prize:'—',       pct:'',    pc:'text-gray-200'   },
          ].map((p, i) => (
            <div key={i} className={`flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0 ${p.me ? 'bg-yellow-50' : ''}`}>
              <div className="text-sm font-bold w-6 text-center">{p.rank}</div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: p.bg, color: p.fg }}>{p.av}</div>
              <div className="flex-1 text-sm font-medium text-gray-800">{p.name}{p.me && <span className="text-yellow-500 text-xs font-bold ml-1.5 uppercase">you</span>}</div>
              <div className="text-xs font-bold bg-yellow-50 text-yellow-600 border border-yellow-200 px-2 py-0.5 rounded-lg">{p.pts} pts</div>
              <div className={`text-xs font-bold w-14 text-right ${p.delta !== '—' ? 'text-green-500' : 'text-gray-200'}`}>{p.delta !== '—' ? `${p.delta} live` : '—'}</div>
              <div className="text-right min-w-[68px]">
                <div className={`text-xs font-bold ${p.pc}`}>{p.prize}</div>
                {p.pct && <div className="text-xs text-gray-300">{p.pct}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* NEWS */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">📰 World Cup News <span className="text-xs text-gray-300 font-normal ml-1">via FIFA.com</span></h2>
          <a href="https://www.fifa.com" target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-gray-700 font-medium">More →</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {NEWS.map((n, i) => (
            <a key={i} href="https://www.fifa.com" target="_blank" rel="noreferrer"
              className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-gray-200 transition-all block">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">FIFA.com</span>
                <span className="bg-yellow-50 border border-yellow-200 text-yellow-600 text-xs font-bold px-2 py-0.5 rounded-full">{n.tag}</span>
              </div>
              <p className="text-sm font-semibold text-gray-800 leading-snug mb-2">{n.h}</p>
              <p className="text-xs text-gray-300">{n.t}</p>
            </a>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-100 mt-10 py-6 px-5">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <span className="font-black text-lg tracking-tight text-gray-900">mic<span className="text-yellow-500">ci</span></span>
          <div className="flex gap-5">
            {['About','Privacy','Terms'].map(l => <a key={l} href="#" className="text-xs text-gray-300 hover:text-gray-600">{l}</a>)}
            <a href="https://www.fifa.com" target="_blank" rel="noreferrer" className="text-xs text-gray-300 hover:text-gray-600">FIFA.com</a>
          </div>
          <span className="text-xs text-gray-300">© 2026 micci · football-data.org</span>
        </div>
      </footer>
    </div>
  )
}
