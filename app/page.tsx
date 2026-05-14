'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'

const MATCHES = [
  { home:'Mexico',      hf:'🇲🇽', away:'South Africa', af:'🇿🇦', group:'Group A', venue:'Estadio Azteca',       utcMs:Date.UTC(2026,5,11,19,0), homeP:52, drawP:24, awayP:24, featured:true },
  { home:'South Korea', hf:'🇰🇷', away:'Czechia',      af:'🇨🇿', group:'Group A', venue:'Estadio Akron',        utcMs:Date.UTC(2026,5,12,2,0),  homeP:44, drawP:28, awayP:28 },
  { home:'Canada',      hf:'🇨🇦', away:'Bosnia & H.',  af:'🇧🇦', group:'Group B', venue:'BMO Field',            utcMs:Date.UTC(2026,5,12,19,0), homeP:46, drawP:27, awayP:27 },
  { home:'USA',         hf:'🇺🇸', away:'Paraguay',     af:'🇵🇾', group:'Group D', venue:'SoFi Stadium',         utcMs:Date.UTC(2026,5,13,0,0),  homeP:55, drawP:23, awayP:22 },
  { home:'Brazil',      hf:'🇧🇷', away:'Morocco',      af:'🇲🇦', group:'Group C', venue:'MetLife Stadium',      utcMs:Date.UTC(2026,5,13,22,0), homeP:54, drawP:24, awayP:22 },
  { home:'France',      hf:'🇫🇷', away:'Senegal',      af:'🇸🇳', group:'Group I', venue:'MetLife Stadium',      utcMs:Date.UTC(2026,5,15,19,0), homeP:62, drawP:22, awayP:16 },
]
const NEWS = [
  { tag:'Opening Match', h:'Preview: Mexico vs South Africa — The opening match of the biggest World Cup in history', t:'3h ago', feature:true },
  { tag:'Official',      h:'Record 5.8 million tickets sold — WC 2026 set to be the most-watched sporting event ever', t:'6h ago' },
  { tag:'Team News',     h:'France confirm Mbappé in starting XI for opener against Senegal', t:'8h ago' },
  { tag:'Stadiums',      h:'A guide to all 16 World Cup venues — from MetLife to Estadio Azteca', t:'1d ago' },
  { tag:'Stars',         h:'The 10 players to watch at WM 2026 — Messi, Vinicius, Bellingham and more', t:'1d ago' },
]
const TZ_OPTIONS = [
  { label:'🇺🇸 Los Angeles (UTC−7)', offset:-7 },
  { label:'🇲🇽 Mexico City (UTC−6)', offset:-6 },
  { label:'🇺🇸 New York (UTC−5)',    offset:-5 },
  { label:'🇧🇷 São Paulo (UTC−4)',   offset:-4 },
  { label:'🇬🇧 London (UTC+0)',      offset: 0 },
  { label:'🇨🇭 Zurich (UTC+1)',      offset: 1 },
  { label:'🇬🇷 Athens (UTC+2)',      offset: 2 },
  { label:'🇨🇳 Beijing (UTC+8)',     offset: 8 },
  { label:'🇯🇵 Tokyo (UTC+9)',       offset: 9 },
]
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDT(utcMs: number, tz: number) {
  const d = new Date(utcMs + tz * 3_600_000)
  return {
    time: `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`,
    short: `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`,
  }
}

type ModalStep = 'closed'|'code'|'register'|'payment'
const ADMIN_EMAIL = 'miro.harasic@gmail.com'

export default function HomePage() {
  const supabase = createBrowserClient()
  const [tz, setTz] = useState(1)
  const [toast, setToast] = useState('')
  const [modal, setModal] = useState<ModalStep>('closed')
  const [code, setCode] = useState('')
  const [codeErr, setCodeErr] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [email, setEmail]         = useState('')
  const [emailC, setEmailC]       = useState('')
  const [password, setPassword]   = useState('')
  const [regErr, setRegErr]       = useState('')
  const [loading, setLoading]     = useState(false)

  function showToast(msg: string) { setToast(msg); setTimeout(()=>setToast(''), 2800) }
  function openJoin() { setModal('code'); setCode(''); setCodeErr(''); setFirstName(''); setLastName(''); setEmail(''); setEmailC(''); setPassword(''); setRegErr('') }
  function closeModal() { setModal('closed') }

  async function checkCode(e: React.FormEvent) {
    e.preventDefault(); setCodeErr(''); setLoading(true)
    const { data } = await supabase.from('settings').select('value').eq('key','invite_code').single()
    setLoading(false)
    code.trim().toUpperCase() === data?.value?.toUpperCase() ? setModal('register') : setCodeErr('Invalid code. Ask micci for the invite code.')
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setRegErr('')
    if (firstName.trim().length < 2) { setRegErr('Please enter your first name.'); return }
    if (lastName.trim().length < 1)  { setRegErr('Please enter your last name.'); return }
    if (email !== emailC)             { setRegErr('Email addresses do not match.'); return }
    if (password.length < 8)         { setRegErr('Password must be at least 8 characters.'); return }
    setLoading(true)
    const { data, error: err } = await supabase.auth.signUp({ email, password })
    if (err) { setRegErr(err.message); setLoading(false); return }
    if (data.user) {
      const displayName = `${firstName.trim()} ${lastName.trim().charAt(0).toUpperCase()}.`
      await supabase.from('profiles').insert({ id: data.user.id, display_name: displayName, status: email.toLowerCase()===ADMIN_EMAIL ? 'active' : 'pending', invite_code: code.trim().toUpperCase() })
    }
    setLoading(false); setModal('payment')
  }

  const stepNum = modal==='code' ? 1 : modal==='register' ? 2 : 3

  return (
    <div style={{background:'var(--bg)',minHeight:'100vh'}}>

      {/* TOAST */}
      {toast && (
        <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',zIndex:200,background:'var(--text)',color:'var(--bg)',padding:'12px 24px',borderRadius:100,fontSize:13,fontWeight:600,boxShadow:'0 8px 24px rgba(26,24,20,0.2)',whiteSpace:'nowrap'}}>
          {toast}
        </div>
      )}

      {/* JOIN MODAL */}
      {modal !== 'closed' && (
        <div style={{position:'fixed',inset:0,background:'rgba(26,24,20,0.6)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20,backdropFilter:'blur(8px)'}} onClick={closeModal}>
          <div style={{background:'var(--bg)',borderRadius:24,width:'100%',maxWidth:400,overflow:'hidden',boxShadow:'0 24px 80px rgba(26,24,20,0.3)'}} onClick={e=>e.stopPropagation()}>
            <div style={{height:3,background:'linear-gradient(90deg,#d4c19a,#b8a47e,#d4c19a)'}}/>
            <div style={{padding:'28px 28px 32px'}}>

              {/* Step indicators */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:28}}>
                {['Code','Details','Payment'].map((s,i) => {
                  const n=i+1
                  return (
                    <div key={s} style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,background:n<stepNum?'#b8d4a8':n===stepNum?'var(--text)':'var(--border)',color:n<stepNum?'#1a3a1a':n===stepNum?'var(--bg)':'var(--text-faint)',transition:'all 0.2s'}}>
                        {n<stepNum?'✓':n}
                      </div>
                      <span style={{fontSize:11,fontWeight:600,color:n===stepNum?'var(--text)':'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{s}</span>
                      {i<2 && <div style={{width:24,height:1,background:'var(--border)'}}/>}
                    </div>
                  )
                })}
              </div>

              {/* Step 1: Code */}
              {modal==='code' && (
                <>
                  <div style={{textAlign:'center',marginBottom:24}}>
                    <div style={{fontFamily:'Bebas Neue',fontSize:32,letterSpacing:'0.04em',color:'var(--text)',marginBottom:6}}>MICCI / WC26</div>
                    <div style={{fontSize:14,color:'var(--text-dim)'}}>Private game — enter your invite code to join.</div>
                  </div>
                  <form onSubmit={checkCode} style={{display:'flex',flexDirection:'column',gap:12}}>
                    <input type="text" value={code} onChange={e=>setCode(e.target.value)} placeholder="MICCI2026" required
                      style={{width:'100%',background:'var(--bg-card-2)',border:'1px solid var(--border)',borderRadius:12,padding:'14px 16px',fontSize:24,fontFamily:'JetBrains Mono',fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',textAlign:'center',color:'var(--text)',outline:'none',boxSizing:'border-box'}}
                      onFocus={e=>{e.target.style.borderColor='var(--text)'}} onBlur={e=>{e.target.style.borderColor='var(--border)'}}
                    />
                    {codeErr && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'10px 14px',fontSize:12,color:'#991b1b',textAlign:'center'}}>{codeErr}</div>}
                    <button type="submit" disabled={loading} className="btn-primary" style={{width:'100%',padding:'14px',fontSize:14,borderRadius:12,marginTop:4}}>
                      {loading ? 'Checking…' : 'Continue →'}
                    </button>
                    <div style={{textAlign:'center',fontSize:12,color:'var(--text-faint)'}}>
                      Already registered? <Link href="/login" style={{color:'var(--text)',fontWeight:600}} onClick={closeModal}>Sign in</Link>
                    </div>
                  </form>
                </>
              )}

              {/* Step 2: Register */}
              {modal==='register' && (
                <>
                  <div style={{textAlign:'center',marginBottom:20}}>
                    <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'#f0fdf4',border:'1px solid #bbf7d0',color:'#166534',fontSize:11,fontWeight:700,padding:'4px 12px',borderRadius:100,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.06em'}}>✓ Valid invite code</div>
                    <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:'0.02em',color:'var(--text)'}}>Create your account</div>
                    <div style={{fontSize:12,color:'var(--text-faint)',marginTop:4}}>You'll appear as e.g. <strong style={{color:'var(--text)'}}>Miro H.</strong></div>
                  </div>
                  <form onSubmit={handleRegister} style={{display:'flex',flexDirection:'column',gap:10}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                      <div>
                        <div style={{fontSize:11,fontWeight:600,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>First name</div>
                        <input type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="Miro" required className="input" style={{borderRadius:10}}/>
                      </div>
                      <div>
                        <div style={{fontSize:11,fontWeight:600,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>Last name</div>
                        <input type="text" value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Harasic" required className="input" style={{borderRadius:10}}/>
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>Email</div>
                      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required className="input" style={{borderRadius:10}}/>
                    </div>
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>Confirm email</div>
                      <input type="email" value={emailC} onChange={e=>setEmailC(e.target.value)} placeholder="you@example.com" required className="input" style={{borderRadius:10,borderColor:emailC&&email!==emailC?'#f87171':''}}/>
                      {emailC&&email!==emailC && <div style={{fontSize:11,color:'#dc2626',marginTop:4}}>Emails do not match</div>}
                    </div>
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>Password</div>
                      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min. 8 characters" minLength={8} required className="input" style={{borderRadius:10}}/>
                    </div>
                    {firstName&&lastName && (
                      <div style={{background:'var(--bg-elev)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 14px',fontSize:12,color:'var(--text-dim)',textAlign:'center'}}>
                        You'll appear as: <strong style={{color:'var(--text)'}}>{firstName.trim()} {lastName.trim().charAt(0).toUpperCase()}.</strong>
                      </div>
                    )}
                    {regErr && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'10px 14px',fontSize:12,color:'#991b1b'}}>{regErr}</div>}
                    <button type="submit" disabled={loading} className="btn-primary" style={{width:'100%',padding:'14px',fontSize:14,borderRadius:12,marginTop:4}}>
                      {loading ? 'Creating account…' : 'Create account →'}
                    </button>
                  </form>
                </>
              )}

              {/* Step 3: Payment */}
              {modal==='payment' && (
                <>
                  <div style={{textAlign:'center',marginBottom:20}}>
                    <div style={{fontSize:36,marginBottom:10}}>🎉</div>
                    <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:'0.02em',color:'var(--text)'}}>Almost there</div>
                    <div style={{fontSize:13,color:'var(--text-dim)',marginTop:4}}>Hi <strong>{firstName} {lastName.charAt(0).toUpperCase()}.</strong> — pay CHF 20 to activate.</div>
                  </div>
                  <div style={{textAlign:'center',marginBottom:16}}>
                    <div style={{fontFamily:'Bebas Neue',fontSize:64,color:'var(--text)',lineHeight:1}}>CHF 20</div>
                    <div style={{fontSize:11,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.1em'}}>One-time entry · Non-refundable</div>
                  </div>
                  <div style={{background:'var(--bg-elev)',border:'1px solid var(--border)',borderRadius:16,padding:'20px',marginBottom:16}}>
                    {[
                      <>Open <strong>Twint</strong> → tap <strong>"Pay"</strong> → enter number</>,
                      <><button onClick={()=>{navigator.clipboard.writeText('+41794256477');showToast('📋 Copied!')}} style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:16,background:'var(--bg-card)',border:'1px solid var(--border-strong)',borderRadius:8,padding:'4px 12px',cursor:'pointer',color:'var(--text)'}}>+41 79 425 64 77</button> <span style={{fontSize:11,color:'var(--text-faint)'}}>tap to copy</span></>,
                      <>Amount: <strong>CHF 20</strong> · Message: <code style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:6,padding:'2px 8px',fontFamily:'JetBrains Mono',fontWeight:700}}>WC2026</code></>,
                      <>Account activated <strong>within 24h</strong> after payment</>,
                    ].map((s,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:i<3?12:0,fontSize:13,color:'var(--text-dim)'}}>
                        <div style={{width:22,height:22,borderRadius:'50%',background:'var(--text)',color:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0,marginTop:2}}>{i+1}</div>
                        <div>{s}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:'#fffbf0',border:'1px solid #f0dfa0',borderRadius:12,padding:'12px 16px',fontSize:12,color:'#92730a',marginBottom:16}}>
                    <strong>⏳ Pending activation</strong> — you can browse, but predictions lock until micci confirms payment.
                  </div>
                  <Link href="/dashboard" onClick={closeModal} className="btn-primary" style={{display:'block',width:'100%',padding:'14px',fontSize:14,borderRadius:12,textAlign:'center'}}>
                    Go to dashboard →
                  </Link>
                  <div style={{textAlign:'center',fontSize:11,color:'var(--text-faint)',marginTop:12}}>Questions? tippspiel@micci.ch</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── NAV ── */}
      <nav style={{position:'sticky',top:0,zIndex:50,backdropFilter:'blur(20px)',background:'rgba(245,240,230,0.85)',borderBottom:'1px solid var(--border)'}}>
        <div style={{maxWidth:1400,margin:'0 auto',padding:'18px 32px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:'0.04em',display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:10,height:10,background:'var(--text)',borderRadius:'50%',animation:'pulse 2s infinite'}}/>
            MICCI <span style={{color:'var(--text-faint)',fontSize:13,fontWeight:500,fontFamily:'Inter Tight',letterSpacing:'0.05em',marginLeft:4}}>/ WC26</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:20}}>
            <select value={tz} onChange={e=>setTz(Number(e.target.value))}
              style={{fontSize:12,border:'1px solid var(--border)',borderRadius:100,padding:'7px 14px',background:'transparent',color:'var(--text-dim)',cursor:'pointer',fontFamily:'Inter Tight',fontWeight:500}}>
              {TZ_OPTIONS.map(o=><option key={o.offset} value={o.offset}>{o.label}</option>)}
            </select>
            <Link href="/login" style={{fontSize:13,fontWeight:600,color:'var(--text-dim)',textDecoration:'none'}}>Sign in</Link>
            <button onClick={openJoin} className="btn-primary" style={{fontSize:13}}>
              <span style={{width:6,height:6,background:'var(--highlight)',borderRadius:'50%'}}/>
              Join · CHF 20
            </button>
          </div>
        </div>
      </nav>

      {/* ── LIVE TICKER ── */}
      <div style={{borderBottom:'1px solid var(--border)',padding:'14px 0',overflow:'hidden',display:'flex',alignItems:'center',gap:16}}>
        <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0,paddingLeft:32,fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.12em'}}>
          <div style={{width:8,height:8,background:'var(--warn)',borderRadius:'50%',animation:'pulsewarn 1.5s infinite'}}/>
          <span style={{color:'var(--warn)'}}>LIVE</span>
        </div>
        <div style={{overflow:'hidden',flex:1}}>
          <div style={{display:'inline-block',animation:'ticker 40s linear infinite',whiteSpace:'nowrap',fontSize:13,color:'var(--text-dim)'}}>
            {['🇫🇷 France 2 — 1 Senegal · 78\'','France leads — you gain +8 pts this match','📰 Mbappé confirmed in France XI for opener','📰 Record 5.8M tickets sold — most-watched WC ever','Open spots still available — invite code needed','Winner takes 60% of the prize pool · CHF 20 entry',
              '🇫🇷 France 2 — 1 Senegal · 78\'','France leads — you gain +8 pts this match','📰 Mbappé confirmed in France XI for opener','📰 Record 5.8M tickets sold — most-watched WC ever','Open spots still available — invite code needed','Winner takes 60% of the prize pool · CHF 20 entry'
            ].map((t,i)=><span key={i} style={{margin:'0 32px',color:t.startsWith('📰')||t.startsWith('🇫')?'var(--text)':'var(--text-dim)'}}>{t}</span>)}
          </div>
        </div>
      </div>

      <div style={{maxWidth:1400,margin:'0 auto',padding:'48px 32px'}}>

        {/* ── HERO ── */}
        <div style={{marginBottom:80}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.15em',color:'var(--text-faint)',marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
            June 11 – July 19, 2026 · USA · Canada · Mexico
            <div style={{flex:1,height:1,background:'var(--border)'}}/>
          </div>
          <h1 style={{fontFamily:'Bebas Neue',fontSize:'clamp(72px,10vw,140px)',lineHeight:0.9,letterSpacing:'-0.01em',color:'var(--text)',marginBottom:24}}>
            World Cup 2026<br/><span style={{color:'var(--beige-deep)'}}>Betting</span> Game
          </h1>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:24}}>
            <p style={{fontSize:16,color:'var(--text-dim)',maxWidth:440,lineHeight:1.6}}>
              Predict every match, score up to 10 points per game, and battle for the prize pool. Leaderboard updates live with every goal.
            </p>
            <div style={{display:'flex',gap:12}}>
              <button onClick={openJoin} className="btn-primary" style={{fontSize:14,padding:'14px 28px'}}>Join for CHF 20 →</button>
              <Link href="/leaderboard" className="btn-ghost" style={{fontSize:14,padding:'14px 28px',textDecoration:'none'}}>View leaderboard</Link>
            </div>
          </div>
        </div>

        {/* ── POINTS SYSTEM ── */}
        <div style={{marginBottom:80}}>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:32,flexWrap:'wrap',gap:16}}>
            <h2 style={{fontFamily:'Bebas Neue',fontSize:'clamp(48px,6vw,80px)',lineHeight:0.9,color:'var(--text)'}}>How you <span style={{color:'var(--beige-deep)'}}>score</span></h2>
            <p style={{fontSize:14,color:'var(--text-dim)',maxWidth:280,textAlign:'right'}}>Simple math. Exact score = 10 pts max. Bonus picks pay 20 each.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,overflow:'hidden'}}>
            {[
              {n:'5',name:'Correct winner',desc:'Right outcome (or draw)'},
              {n:'3',name:'Goal difference',desc:'e.g. tip 2–0, actual 3–1'},
              {n:'1',name:'Exact team goals',desc:'1 pt per team you got right'},
              {n:'20',name:'Bonus picks',desc:'Winner & top scorer nation',dark:true},
            ].map((c,i)=>(
              <div key={i} style={{padding:'32px 28px',borderRight:i<3?'1px solid var(--border)':'none',background:c.dark?'var(--text)':'transparent'}}>
                <div style={{fontFamily:'Bebas Neue',fontSize:72,lineHeight:0.9,marginBottom:8,color:c.dark?'var(--highlight)':'var(--text)'}}>{c.n}</div>
                <div style={{fontWeight:700,fontSize:15,marginBottom:4,color:c.dark?'var(--bg)':'var(--text)'}}>{c.name}</div>
                <div style={{fontSize:12,color:c.dark?'var(--text-faint)':'var(--text-dim)'}}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── NEXT MATCHES ── */}
        <div style={{marginBottom:80}}>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:32,flexWrap:'wrap',gap:16}}>
            <h2 style={{fontFamily:'Bebas Neue',fontSize:'clamp(48px,6vw,80px)',lineHeight:0.9,color:'var(--text)'}}>Tip the <span style={{color:'var(--beige-deep)'}}>matches</span></h2>
            <Link href="/login" style={{fontSize:13,fontWeight:600,color:'var(--text-dim)',textDecoration:'none',textTransform:'uppercase',letterSpacing:'0.1em',borderBottom:'1px solid var(--border)',paddingBottom:2}}>Sign in to tip →</Link>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
            {MATCHES.map((m,i)=>{
              const {time,short} = fmtDT(m.utcMs,tz)
              const featured = i===0
              return (
                <div key={i} onClick={()=>showToast('👋 Sign in to enter predictions')}
                  style={{background:featured?'var(--text)':'var(--bg-card)',border:`1px solid ${featured?'var(--text)':'var(--border)'}`,borderRadius:20,padding:24,cursor:'pointer',transition:'all 0.2s',gridColumn:featured?'span 2':'span 1'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 8px 24px rgba(26,24,20,0.1)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='';(e.currentTarget as HTMLDivElement).style.boxShadow=''}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,fontSize:11,textTransform:'uppercase',letterSpacing:'0.1em',color:featured?'rgba(245,240,230,0.5)':'var(--text-faint)'}}>
                    <span style={{background:featured?'rgba(245,240,230,0.08)':'var(--bg-elev)',padding:'4px 10px',borderRadius:6,color:featured?'var(--highlight)':'var(--text-dim)'}}>{m.group}</span>
                    <span>{short} · {time} · {m.venue}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:featured?24:16,marginBottom:20}}>
                    <div style={{flex:1,display:'flex',alignItems:'center',gap:featured?14:10}}>
                      <span style={{fontSize:featured?40:32}}>{m.hf}</span>
                      <div>
                        <div style={{fontWeight:700,fontSize:featured?16:14,color:featured?'var(--bg)':'var(--text)'}}>{m.home}</div>
                        <div style={{fontSize:11,color:featured?'rgba(245,240,230,0.5)':'var(--text-faint)',marginTop:2}}>{m.homeP}% win</div>
                      </div>
                    </div>
                    <div style={{fontFamily:'Bebas Neue',fontSize:16,color:featured?'rgba(245,240,230,0.4)':'var(--text-faint)'}}>VS</div>
                    <div style={{flex:1,display:'flex',alignItems:'center',gap:featured?14:10,flexDirection:'row-reverse',textAlign:'right'}}>
                      <span style={{fontSize:featured?40:32}}>{m.af}</span>
                      <div>
                        <div style={{fontWeight:700,fontSize:featured?16:14,color:featured?'var(--bg)':'var(--text)'}}>{m.away}</div>
                        <div style={{fontSize:11,color:featured?'rgba(245,240,230,0.5)':'var(--text-faint)',marginTop:2}}>{m.awayP}% win</div>
                      </div>
                    </div>
                  </div>
                  {/* prob bar */}
                  <div style={{height:3,borderRadius:2,overflow:'hidden',display:'flex',background:featured?'rgba(245,240,230,0.15)':'var(--border)',marginBottom:8}}>
                    <div style={{width:`${m.homeP}%`,background:featured?'var(--bg)':'var(--text)'}}/>
                    <div style={{width:`${m.drawP}%`,background:featured?'var(--highlight)':'var(--beige-mid)'}}/>
                    <div style={{width:`${m.awayP}%`,background:'var(--beige-deep)'}}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:featured?'rgba(245,240,230,0.4)':'var(--text-faint)',marginBottom:16}}>
                    <span>{m.hf} {m.homeP}%</span><span>Draw {m.drawP}%</span><span>{m.af} {m.awayP}%</span>
                  </div>
                  <div style={{background:featured?'rgba(245,240,230,0.04)':'var(--bg-card-2)',border:`1px solid ${featured?'rgba(245,240,230,0.12)':'var(--border)'}`,borderRadius:12,padding:16}}>
                    <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.12em',color:featured?'rgba(245,240,230,0.4)':'var(--text-faint)',marginBottom:10,display:'flex',justifyContent:'space-between'}}>
                      <span>Your prediction</span><span>UP TO 10 PTS</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12}}>
                      <div style={{width:56,height:56,background:featured?'rgba(245,240,230,0.06)':'var(--bg-card)',border:`1px solid ${featured?'rgba(245,240,230,0.15)':'var(--border)'}`,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Bebas Neue',fontSize:32,color:featured?'rgba(245,240,230,0.3)':'var(--text-faint)'}}>—</div>
                      <span style={{fontFamily:'Bebas Neue',fontSize:24,color:featured?'rgba(245,240,230,0.3)':'var(--text-faint)'}}>—</span>
                      <div style={{width:56,height:56,background:featured?'rgba(245,240,230,0.06)':'var(--bg-card)',border:`1px solid ${featured?'rgba(245,240,230,0.15)':'var(--border)'}`,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Bebas Neue',fontSize:32,color:featured?'rgba(245,240,230,0.3)':'var(--text-faint)'}}>—</div>
                    </div>
                    <button style={{width:'100%',marginTop:12,padding:'10px',background:featured?'var(--bg)':'var(--text)',color:featured?'var(--text)':'var(--bg)',border:'none',borderRadius:10,fontWeight:700,fontSize:12,textTransform:'uppercase',letterSpacing:'0.1em',cursor:'pointer'}}>
                      Sign in to tip
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── PRIZE POOL ── */}
        <div style={{marginBottom:80}}>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:32,flexWrap:'wrap',gap:16}}>
            <h2 style={{fontFamily:'Bebas Neue',fontSize:'clamp(48px,6vw,80px)',lineHeight:0.9,color:'var(--text)'}}>The <span style={{color:'var(--beige-deep)'}}>pot</span></h2>
            <p style={{fontSize:14,color:'var(--text-dim)',maxWidth:280,textAlign:'right'}}>Top 3 take it home. Pool grows CHF 20 per player. Paid via Twint after the final.</p>
          </div>
          <div style={{background:'var(--text)',borderRadius:24,padding:'40px 48px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:'-100px',right:'-100px',width:400,height:400,background:'radial-gradient(circle,rgba(212,193,154,0.15) 0%,transparent 60%)',pointerEvents:'none'}}/>
            <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(80px,10vw,120px)',lineHeight:0.9,background:'linear-gradient(180deg,#f5f0e6 0%,#b8a47e 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',marginBottom:8,position:'relative'}}>CHF ???</div>
            <div style={{fontSize:13,color:'var(--text-faint)',marginBottom:32,textTransform:'uppercase',letterSpacing:'0.1em'}}>Prize pool · <span style={{color:'var(--highlight)',fontWeight:600}}>grows +CHF 20 with every new player</span></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
              {[['1ST','gold','60%'],['2ND','silver','25%'],['3RD','bronze','15%']].map(([p,c,pct])=>(
                <div key={p} style={{background:'rgba(245,240,230,0.06)',border:'1px solid rgba(245,240,230,0.12)',borderRadius:12,padding:20,textAlign:'center'}}>
                  <div style={{fontFamily:'Bebas Neue',fontSize:28,marginBottom:4,color:c==='gold'?'var(--bg)':c==='silver'?'var(--highlight)':'var(--beige-mid)'}}>{p}</div>
                  <div style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:20,color:'var(--bg)',marginBottom:4}}>{pct}</div>
                  <div style={{fontSize:11,color:'var(--text-faint)'}}>of pool</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── NEWS ── */}
        <div style={{marginBottom:80}}>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:32,flexWrap:'wrap',gap:16}}>
            <h2 style={{fontFamily:'Bebas Neue',fontSize:'clamp(48px,6vw,80px)',lineHeight:0.9,color:'var(--text)'}}>World Cup <span style={{color:'var(--beige-deep)'}}>news</span></h2>
            <a href="https://www.fifa.com" target="_blank" rel="noreferrer" style={{fontSize:13,fontWeight:600,color:'var(--text-dim)',textDecoration:'none',textTransform:'uppercase',letterSpacing:'0.1em',borderBottom:'1px solid var(--border)',paddingBottom:2}}>More on FIFA.com →</a>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
            {NEWS.map((n,i)=>(
              <a key={i} href="https://www.fifa.com" target="_blank" rel="noreferrer"
                style={{background:n.feature?'var(--bg-elev)':'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,padding:24,textDecoration:'none',color:'var(--text)',display:'flex',flexDirection:'column',gap:12,gridColumn:n.feature?'span 2':'span 1',transition:'all 0.2s'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLAnchorElement).style.borderColor='var(--border-strong)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.transform='';(e.currentTarget as HTMLAnchorElement).style.borderColor='var(--border)'}}>
                <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.12em',color:'var(--text-faint)',fontWeight:600}}>FIFA.com · {n.t}</div>
                <div style={{fontSize:n.feature?26:15,fontWeight:n.feature?400:600,lineHeight:n.feature?1.05:1.4,fontFamily:n.feature?'Bebas Neue':'Inter Tight',letterSpacing:n.feature?'-0.005em':'normal',color:'var(--text)'}}>{n.h}</div>
                <div style={{marginTop:'auto',background:'var(--text)',color:'var(--bg)',fontSize:11,textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:700,padding:'4px 10px',borderRadius:6,alignSelf:'flex-start'}}>{n.tag}</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{borderTop:'1px solid var(--border)',padding:'40px 32px',maxWidth:1400,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16,fontSize:12,color:'var(--text-faint)'}}>
        <div>micci · WC26 · All rights reserved 2026</div>
        <div style={{display:'flex',gap:24}}>
          {['About','Rules','Privacy'].map(l=><a key={l} href="#" style={{color:'var(--text-faint)',textDecoration:'none'}}>{l}</a>)}
          <a href="https://www.fifa.com" target="_blank" rel="noreferrer" style={{color:'var(--text-faint)',textDecoration:'none'}}>FIFA.com</a>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes pulsewarn { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(154,74,42,0.5)} 50%{opacity:0.9;box-shadow:0 0 0 8px transparent} }
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      `}</style>
    </div>
  )
}
