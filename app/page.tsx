'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'

const MATCHES = [
  { home:'Mexico',      hf:'🇲🇽', away:'South Africa', af:'🇿🇦', group:'Group A', venue:'Estadio Azteca',    utcMs:Date.UTC(2026,5,11,19,0), homeP:52, drawP:24, awayP:24 },
  { home:'South Korea', hf:'🇰🇷', away:'Czechia',      af:'🇨🇿', group:'Group A', venue:'Estadio Akron',     utcMs:Date.UTC(2026,5,12,2,0),  homeP:44, drawP:28, awayP:28 },
  { home:'Canada',      hf:'🇨🇦', away:'Bosnia & H.',  af:'🇧🇦', group:'Group B', venue:'BMO Field',         utcMs:Date.UTC(2026,5,12,19,0), homeP:46, drawP:27, awayP:27 },
  { home:'USA',         hf:'🇺🇸', away:'Paraguay',     af:'🇵🇾', group:'Group D', venue:'SoFi Stadium',      utcMs:Date.UTC(2026,5,13,0,0),  homeP:55, drawP:23, awayP:22 },
  { home:'Brazil',      hf:'🇧🇷', away:'Morocco',      af:'🇲🇦', group:'Group C', venue:'MetLife Stadium',   utcMs:Date.UTC(2026,5,13,22,0), homeP:54, drawP:24, awayP:22 },
  { home:'France',      hf:'🇫🇷', away:'Senegal',      af:'🇸🇳', group:'Group I', venue:'MetLife Stadium',   utcMs:Date.UTC(2026,5,15,19,0), homeP:62, drawP:22, awayP:16 },
]
const NEWS = [
  { tag:'Preview',  h:'Mexico vs South Africa: The opening match of the biggest World Cup in history', t:'3h ago', feature:true },
  { tag:'Official', h:'Record 5.8 million tickets sold — WC 2026 set to be the most-watched sporting event ever', t:'6h ago' },
  { tag:'Team News',h:'France confirm Mbappé in starting XI for opener against Senegal', t:'8h ago' },
  { tag:'Stadiums', h:'A guide to all 16 World Cup venues — from MetLife to Estadio Azteca', t:'1d ago' },
  { tag:'Stars',    h:'The 10 players to watch at WM 2026 — Messi, Vinicius, Bellingham and more', t:'1d ago' },
]
const TZ_OPTIONS = [
  {label:'🇺🇸 LA (UTC−7)',offset:-7},{label:'🇲🇽 MEX (UTC−6)',offset:-6},
  {label:'🇺🇸 NYC (UTC−5)',offset:-5},{label:'🇧🇷 SAO (UTC−4)',offset:-4},
  {label:'🇬🇧 LON (UTC+0)',offset:0},{label:'🇨🇭 ZRH (UTC+1)',offset:1},
  {label:'🇬🇷 ATH (UTC+2)',offset:2},{label:'🇨🇳 PEK (UTC+8)',offset:8},
  {label:'🇯🇵 TYO (UTC+9)',offset:9},
]
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDT(utcMs:number,tz:number){
  const d=new Date(utcMs+tz*3_600_000)
  return {time:`${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`,short:`${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`}
}
type ModalStep='closed'|'code'|'register'|'payment'
const ADMIN_EMAIL='miro.harasic@gmail.com'

export default function HomePage() {
  const supabase = createBrowserClient()
  const [tz,setTz]=useState(1)
  const [toast,setToast]=useState('')
  const [modal,setModal]=useState<ModalStep>('closed')
  const [code,setCode]=useState('')
  const [codeErr,setCodeErr]=useState('')
  const [firstName,setFirstName]=useState('')
  const [lastName,setLastName]=useState('')
  const [email,setEmail]=useState('')
  const [emailC,setEmailC]=useState('')
  const [password,setPassword]=useState('')
  const [regErr,setRegErr]=useState('')
  const [loading,setLoading]=useState(false)

  function showToast(msg:string){setToast(msg);setTimeout(()=>setToast(''),2800)}
  function openJoin(){setModal('code');setCode('');setCodeErr('');setFirstName('');setLastName('');setEmail('');setEmailC('');setPassword('');setRegErr('')}
  function closeModal(){setModal('closed')}

  async function checkCode(e:React.FormEvent){
    e.preventDefault();setCodeErr('');setLoading(true)
    const {data}=await supabase.from('settings').select('value').eq('key','invite_code').single()
    setLoading(false)
    code.trim().toUpperCase()===data?.value?.toUpperCase()?setModal('register'):setCodeErr('Invalid code. Ask micci for the invite code.')
  }
  async function handleRegister(e:React.FormEvent){
    e.preventDefault();setRegErr('')
    if(firstName.trim().length<2){setRegErr('Please enter your first name.');return}
    if(lastName.trim().length<1){setRegErr('Please enter your last name.');return}
    if(email!==emailC){setRegErr('Email addresses do not match.');return}
    if(password.length<8){setRegErr('Password must be at least 8 characters.');return}
    setLoading(true)
    const {data,error:err}=await supabase.auth.signUp({email,password})
    if(err){setRegErr(err.message);setLoading(false);return}
    if(data.user){
      const displayName=`${firstName.trim()} ${lastName.trim().charAt(0).toUpperCase()}.`
      await supabase.from('profiles').insert({id:data.user.id,display_name:displayName,status:email.toLowerCase()===ADMIN_EMAIL?'active':'pending',invite_code:code.trim().toUpperCase()})
    }
    setLoading(false);setModal('payment')
  }

  const stepNum=modal==='code'?1:modal==='register'?2:3

  const iB = (style:any):any => style // inline style helper

  return (
    <div style={{background:'var(--bg)',minHeight:'100vh'}}>

      {/* TOAST */}
      {toast&&<div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',zIndex:200,background:'var(--text)',color:'var(--bg)',padding:'12px 20px',borderRadius:100,fontSize:13,fontWeight:600,boxShadow:'0 8px 24px rgba(26,24,20,0.2)',whiteSpace:'nowrap',maxWidth:'90vw',textAlign:'center'}}>{toast}</div>}

      {/* JOIN MODAL */}
      {modal!=='closed'&&(
        <div style={{position:'fixed',inset:0,background:'rgba(26,24,20,0.6)',zIndex:100,display:'flex',alignItems:'flex-end',justifyContent:'center',backdropFilter:'blur(8px)'}} onClick={closeModal}>
          <div style={{background:'var(--bg)',borderRadius:'24px 24px 0 0',width:'100%',maxWidth:480,boxShadow:'0 -8px 40px rgba(26,24,20,0.25)',maxHeight:'95vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{height:3,background:'linear-gradient(90deg,#d4c19a,#b8a47e,#d4c19a)',borderRadius:'24px 24px 0 0'}}/>
            {/* Drag handle */}
            <div style={{display:'flex',justifyContent:'center',padding:'12px 0 0'}}>
              <div style={{width:40,height:4,background:'var(--border)',borderRadius:2}}/>
            </div>
            <div style={{padding:'16px 24px 32px'}}>
              {/* Steps */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:24}}>
                {['Code','Details','Payment'].map((s,i)=>{
                  const n=i+1
                  return(
                    <div key={s} style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,background:n<stepNum?'#4a7a3a':n===stepNum?'var(--text)':'var(--border)',color:n<stepNum?'white':n===stepNum?'var(--bg)':'var(--text-faint)',transition:'all 0.2s'}}>
                        {n<stepNum?'✓':n}
                      </div>
                      <span style={{fontSize:11,fontWeight:600,color:n===stepNum?'var(--text)':'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{s}</span>
                      {i<2&&<div style={{width:16,height:1,background:'var(--border)'}}/>}
                    </div>
                  )
                })}
              </div>

              {/* Step 1 */}
              {modal==='code'&&(
                <>
                  <div style={{textAlign:'center',marginBottom:20}}>
                    <div style={{fontFamily:'Bebas Neue',fontSize:28,color:'var(--text)',marginBottom:6}}>MICCI / WC26</div>
                    <div style={{fontSize:14,color:'var(--text-dim)'}}>Private game — enter your invite code to join.</div>
                  </div>
                  <form onSubmit={checkCode} style={{display:'flex',flexDirection:'column',gap:12}}>
                    <input type="text" value={code} onChange={e=>setCode(e.target.value)} placeholder="MICCI2026" required
                      style={{width:'100%',background:'var(--bg-card-2)',border:'1px solid var(--border)',borderRadius:14,padding:'16px',fontSize:22,fontFamily:'JetBrains Mono',fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',textAlign:'center',color:'var(--text)',outline:'none',boxSizing:'border-box'}}
                      onFocus={e=>e.target.style.borderColor='var(--text)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
                    {codeErr&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#991b1b',textAlign:'center'}}>{codeErr}</div>}
                    <button type="submit" disabled={loading} style={{width:'100%',padding:'15px',background:'var(--text)',color:'var(--bg)',border:'none',borderRadius:14,fontWeight:700,fontSize:15,cursor:'pointer'}}>
                      {loading?'Checking…':'Continue →'}
                    </button>
                    <div style={{textAlign:'center',fontSize:13,color:'var(--text-faint)'}}>
                      Already registered? <Link href="/login" style={{color:'var(--text)',fontWeight:700}} onClick={closeModal}>Sign in</Link>
                    </div>
                  </form>
                </>
              )}

              {/* Step 2 */}
              {modal==='register'&&(
                <>
                  <div style={{textAlign:'center',marginBottom:16}}>
                    <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'#f0fdf4',border:'1px solid #bbf7d0',color:'#166534',fontSize:11,fontWeight:700,padding:'4px 12px',borderRadius:100,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.06em'}}>✓ Valid code</div>
                    <div style={{fontFamily:'Bebas Neue',fontSize:26,color:'var(--text)'}}>Create your account</div>
                    <div style={{fontSize:12,color:'var(--text-faint)',marginTop:4}}>You'll appear as e.g. <strong style={{color:'var(--text)'}}>Miro H.</strong></div>
                  </div>
                  <form onSubmit={handleRegister} style={{display:'flex',flexDirection:'column',gap:10}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                      {[['First name','Miro',firstName,setFirstName],['Last name','Harasic',lastName,setLastName]].map(([label,ph,val,setter]:any)=>(
                        <div key={String(label)}>
                          <div style={{fontSize:11,fontWeight:700,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{label}</div>
                          <input type="text" value={val} onChange={(e:any)=>setter(e.target.value)} placeholder={ph} required className="input" style={{borderRadius:10,fontSize:14}}/>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>Email</div>
                      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required className="input" style={{borderRadius:10,fontSize:14}}/>
                    </div>
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>Confirm email</div>
                      <input type="email" value={emailC} onChange={e=>setEmailC(e.target.value)} placeholder="you@example.com" required className="input" style={{borderRadius:10,fontSize:14,borderColor:emailC&&email!==emailC?'#f87171':''}}/>
                      {emailC&&email!==emailC&&<div style={{fontSize:11,color:'#dc2626',marginTop:4}}>Emails do not match</div>}
                    </div>
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>Password</div>
                      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min. 8 characters" minLength={8} required className="input" style={{borderRadius:10,fontSize:14}}/>
                    </div>
                    {firstName&&lastName&&(
                      <div style={{background:'var(--bg-elev)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'var(--text-dim)',textAlign:'center'}}>
                        You'll appear as: <strong style={{color:'var(--text)'}}>{firstName.trim()} {lastName.trim().charAt(0).toUpperCase()}.</strong>
                      </div>
                    )}
                    {regErr&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#991b1b'}}>{regErr}</div>}
                    <button type="submit" disabled={loading} style={{width:'100%',padding:'15px',background:'var(--text)',color:'var(--bg)',border:'none',borderRadius:14,fontWeight:700,fontSize:15,cursor:'pointer',marginTop:4}}>
                      {loading?'Creating account…':'Create account →'}
                    </button>
                  </form>
                </>
              )}

              {/* Step 3 */}
              {modal==='payment'&&(
                <>
                  <div style={{textAlign:'center',marginBottom:16}}>
                    <div style={{fontSize:40,marginBottom:8}}>🎉</div>
                    <div style={{fontFamily:'Bebas Neue',fontSize:28,color:'var(--text)'}}>Almost there</div>
                    <div style={{fontSize:13,color:'var(--text-dim)',marginTop:4}}>Hi <strong>{firstName} {lastName.charAt(0).toUpperCase()}.</strong> — pay CHF 20 to activate.</div>
                  </div>
                  <div style={{textAlign:'center',marginBottom:14}}>
                    <div style={{fontFamily:'Bebas Neue',fontSize:56,color:'var(--text)',lineHeight:1}}>CHF 20</div>
                    <div style={{fontSize:11,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.1em'}}>One-time · Non-refundable</div>
                  </div>
                  <div style={{background:'var(--bg-elev)',border:'1px solid var(--border)',borderRadius:16,padding:18,marginBottom:14}}>
                    {[
                      <>Open <strong>Twint</strong> → tap <strong>"Pay"</strong> → enter number</>,
                      <><button onClick={()=>{navigator.clipboard.writeText('+41794256477');showToast('📋 Copied!')}} style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:17,background:'var(--bg-card)',border:'1px solid var(--border-strong)',borderRadius:8,padding:'6px 14px',cursor:'pointer',color:'var(--text)',display:'inline-block'}}>+41 79 425 64 77</button><span style={{fontSize:12,color:'var(--text-faint)',marginLeft:8}}>tap to copy</span></>,
                      <>Amount: <strong>CHF 20</strong> · Message: <code style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:6,padding:'2px 8px',fontFamily:'JetBrains Mono',fontWeight:700,fontSize:13}}>WC2026</code></>,
                      <>Account activated <strong>within 24h</strong> after payment</>,
                    ].map((s,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:i<3?12:0,fontSize:13,color:'var(--text-dim)'}}>
                        <div style={{width:22,height:22,borderRadius:'50%',background:'var(--text)',color:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0,marginTop:2}}>{i+1}</div>
                        <div>{s}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:'#fffbf0',border:'1px solid #f0dfa0',borderRadius:12,padding:'12px 16px',fontSize:13,color:'#92730a',marginBottom:14}}>
                    <strong>⏳ Pending</strong> — browse freely, predictions unlock after activation.
                  </div>
                  <Link href="/dashboard" onClick={closeModal} style={{display:'block',width:'100%',padding:'15px',background:'var(--text)',color:'var(--bg)',border:'none',borderRadius:14,fontWeight:700,fontSize:15,textAlign:'center',textDecoration:'none'}}>
                    Go to dashboard →
                  </Link>
                  <div style={{textAlign:'center',fontSize:12,color:'var(--text-faint)',marginTop:10}}>Questions? tippspiel@micci.ch</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{position:'sticky',top:0,zIndex:50,backdropFilter:'blur(20px)',background:'rgba(245,240,230,0.92)',borderBottom:'1px solid var(--border)'}}>
        <div style={{maxWidth:1400,margin:'0 auto',padding:'0 20px',height:54,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          <div style={{fontFamily:'Bebas Neue',fontSize:24,letterSpacing:'0.04em',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
            <div style={{width:8,height:8,background:'var(--text)',borderRadius:'50%',animation:'pulse 2s infinite'}}/>
            MICCI <span style={{color:'var(--text-faint)',fontSize:12,fontWeight:500,fontFamily:'Inter Tight',letterSpacing:'0.05em',marginLeft:4}} className="hide-mobile">/ WC26</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <select value={tz} onChange={e=>setTz(Number(e.target.value))}
              style={{fontSize:11,border:'1px solid var(--border)',borderRadius:100,padding:'6px 10px',background:'transparent',color:'var(--text-dim)',cursor:'pointer',fontFamily:'Inter Tight',fontWeight:500,maxWidth:140}}>
              {TZ_OPTIONS.map(o=><option key={o.offset} value={o.offset}>{o.label}</option>)}
            </select>
            <Link href="/login" style={{fontSize:12,fontWeight:600,color:'var(--text-dim)',textDecoration:'none'}} className="hide-mobile">Sign in</Link>
            <button onClick={openJoin} style={{display:'flex',alignItems:'center',gap:6,background:'var(--text)',color:'var(--bg)',border:'none',padding:'9px 16px',borderRadius:100,fontWeight:700,fontSize:12,cursor:'pointer',whiteSpace:'nowrap'}}>
              <span style={{width:5,height:5,background:'var(--highlight)',borderRadius:'50%'}}/>
              Join · CHF 20
            </button>
          </div>
        </div>
      </nav>

      {/* LIVE TICKER */}
      <div style={{borderBottom:'1px solid var(--border)',padding:'12px 0',overflow:'hidden',display:'flex',alignItems:'center',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0,paddingLeft:20,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.12em'}}>
          <div style={{width:7,height:7,background:'var(--warn)',borderRadius:'50%',animation:'pulsewarn 1.5s infinite'}}/>
          <span style={{color:'var(--warn)'}}>LIVE</span>
        </div>
        <div style={{overflow:'hidden',flex:1}}>
          <div style={{display:'inline-block',animation:'ticker 40s linear infinite',whiteSpace:'nowrap',fontSize:12,color:'var(--text-dim)'}}>
            {['🇫🇷 France 2–1 Senegal · 78\'','Open to join — invite code needed','Winner takes 60% · CHF 20 entry','104 matches to predict · up to 10 pts each','📰 Mbappé confirmed in France XI','📰 Record 5.8M tickets sold',
              '🇫🇷 France 2–1 Senegal · 78\'','Open to join — invite code needed','Winner takes 60% · CHF 20 entry','104 matches to predict · up to 10 pts each','📰 Mbappé confirmed in France XI','📰 Record 5.8M tickets sold'
            ].map((t,i)=><span key={i} style={{margin:'0 28px',color:t.startsWith('🇫')||t.startsWith('📰')?'var(--text)':'var(--text-dim)'}}>{t}</span>)}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="page-wrap">

        {/* HERO */}
        <div style={{marginBottom:56}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.12em',color:'var(--text-faint)',marginBottom:16,display:'flex',alignItems:'center',gap:10}}>
            June 11 – July 19, 2026 · USA · Canada · Mexico
            <div style={{flex:1,height:1,background:'var(--border)'}} className="hide-mobile"/>
          </div>
          <h1 className="section-title" style={{marginBottom:20,fontSize:'clamp(52px,11vw,140px)'}}>
            World Cup 2026<br/><span style={{color:'var(--beige-deep)'}}>Betting</span> Game
          </h1>
          <p style={{fontSize:15,color:'var(--text-dim)',maxWidth:420,lineHeight:1.65,marginBottom:24}}>
            Predict every match, score up to 10 points per game, and battle for the prize pool. Leaderboard updates live with every goal.
          </p>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <button onClick={openJoin} style={{display:'flex',alignItems:'center',gap:6,background:'var(--text)',color:'var(--bg)',border:'none',padding:'14px 24px',borderRadius:100,fontWeight:700,fontSize:14,cursor:'pointer'}}>
              Join for CHF 20 →
            </button>
            <Link href="/leaderboard" style={{display:'flex',alignItems:'center',padding:'14px 24px',borderRadius:100,border:'1px solid var(--border-strong)',color:'var(--text-dim)',fontWeight:600,fontSize:14,textDecoration:'none'}}>
              View leaderboard
            </Link>
          </div>
        </div>

        {/* POINTS STRIP */}
        <div style={{marginBottom:56}}>
          <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(36px,6vw,64px)',lineHeight:0.9,color:'var(--text)',marginBottom:20}}>
            How you <span style={{color:'var(--beige-deep)'}}>score</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
            {[
              {n:'5',name:'Correct winner',desc:'Right outcome or draw'},
              {n:'3',name:'Goal difference',desc:'e.g. tip 2–0, actual 3–1'},
              {n:'1',name:'Exact team goals',desc:'1 pt per team you got right'},
              {n:'20',name:'Bonus picks',desc:'Winner & top scorer nation',dark:true},
            ].map((c,i)=>(
              <div key={i} style={{padding:'20px',borderRadius:16,background:c.dark?'var(--text)':'var(--bg-card)',border:`1px solid ${c.dark?'var(--text)':'var(--border)'}`}}>
                <div style={{fontFamily:'Bebas Neue',fontSize:48,lineHeight:0.9,marginBottom:6,color:c.dark?'var(--highlight)':'var(--text)'}}>{c.n}</div>
                <div style={{fontWeight:700,fontSize:14,marginBottom:2,color:c.dark?'var(--bg)':'var(--text)'}}>{c.name}</div>
                <div style={{fontSize:12,color:c.dark?'var(--text-faint)':'var(--text-dim)'}}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MATCHES */}
        <div style={{marginBottom:56}}>
          <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:8}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(36px,6vw,64px)',lineHeight:0.9,color:'var(--text)'}}>
              Tip the <span style={{color:'var(--beige-deep)'}}>matches</span>
            </div>
            <Link href="/login" style={{fontSize:12,fontWeight:600,color:'var(--text-dim)',textDecoration:'none',textTransform:'uppercase',letterSpacing:'0.08em',borderBottom:'1px solid var(--border)',paddingBottom:1}}>Sign in to tip →</Link>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {MATCHES.map((m,i)=>{
              const {time,short}=fmtDT(m.utcMs,tz)
              return (
                <div key={i} onClick={()=>showToast('👋 Sign in to enter predictions')}
                  style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'16px 18px',cursor:'pointer',transition:'all 0.2s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='var(--border-strong)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='var(--border)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,fontSize:11,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-faint)'}}>
                    <span style={{background:'var(--bg-elev)',padding:'3px 8px',borderRadius:5,color:'var(--text-dim)',fontWeight:600}}>{m.group}</span>
                    <span style={{fontFamily:'JetBrains Mono',fontWeight:700,color:'var(--text-dim)'}}>{short} · {time}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                    <div style={{flex:1,display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontSize:28}}>{m.hf}</span>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:'var(--text)'}}>{m.home}</div>
                        <div style={{fontSize:11,color:'var(--text-faint)'}}>{m.homeP}% win</div>
                      </div>
                    </div>
                    <div style={{fontFamily:'Bebas Neue',fontSize:14,color:'var(--text-faint)'}}>VS</div>
                    <div style={{flex:1,display:'flex',alignItems:'center',gap:10,flexDirection:'row-reverse',textAlign:'right'}}>
                      <span style={{fontSize:28}}>{m.af}</span>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:'var(--text)'}}>{m.away}</div>
                        <div style={{fontSize:11,color:'var(--text-faint)'}}>{m.awayP}% win</div>
                      </div>
                    </div>
                  </div>
                  <div style={{height:3,borderRadius:2,overflow:'hidden',display:'flex',background:'var(--border)',marginBottom:6}}>
                    <div style={{width:`${m.homeP}%`,background:'var(--text)'}}/><div style={{width:`${m.drawP}%`,background:'var(--beige-mid)'}}/><div style={{width:`${m.awayP}%`,background:'var(--beige-deep)'}}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-faint)',marginBottom:12}}>
                    <span>{m.hf} {m.homeP}%</span><span>Draw {m.drawP}%</span><span>{m.af} {m.awayP}%</span>
                  </div>
                  <button style={{width:'100%',padding:'10px',background:'var(--text)',color:'var(--bg)',border:'none',borderRadius:10,fontWeight:700,fontSize:12,textTransform:'uppercase',letterSpacing:'0.08em',cursor:'pointer'}}>
                    Sign in to tip
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* PRIZE */}
        <div style={{marginBottom:56}}>
          <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(36px,6vw,64px)',lineHeight:0.9,color:'var(--text)',marginBottom:20}}>
            The <span style={{color:'var(--beige-deep)'}}>pot</span>
          </div>
          <div style={{background:'var(--text)',borderRadius:20,padding:'28px 24px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:'-60px',right:'-60px',width:240,height:240,background:'radial-gradient(circle,rgba(212,193,154,0.15) 0%,transparent 60%)',pointerEvents:'none'}}/>
            <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(56px,14vw,96px)',lineHeight:0.9,background:'linear-gradient(180deg,#f5f0e6 0%,#b8a47e 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',marginBottom:6}}>CHF ???</div>
            <div style={{fontSize:13,color:'var(--text-faint)',marginBottom:24}}><span style={{color:'var(--highlight)',fontWeight:600}}>Grows +CHF 20 per player</span> · paid via Twint · distributed July 19</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
              {[['1ST','var(--bg)','60%'],['2ND','var(--highlight)','25%'],['3RD','var(--beige-mid)','15%']].map(([p,c,pct])=>(
                <div key={String(p)} style={{background:'rgba(245,240,230,0.06)',border:'1px solid rgba(245,240,230,0.12)',borderRadius:12,padding:'14px',textAlign:'center'}}>
                  <div style={{fontFamily:'Bebas Neue',fontSize:22,marginBottom:2,color:c}}>{p}</div>
                  <div style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:16,color:'var(--bg)',marginBottom:2}}>{pct}</div>
                  <div style={{fontSize:11,color:'var(--text-faint)'}}>of pool</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* NEWS */}
        <div style={{marginBottom:40}}>
          <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:8}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(36px,6vw,64px)',lineHeight:0.9,color:'var(--text)'}}>
              WC <span style={{color:'var(--beige-deep)'}}>news</span>
            </div>
            <a href="https://www.fifa.com" target="_blank" rel="noreferrer" style={{fontSize:12,fontWeight:600,color:'var(--text-dim)',textDecoration:'none',textTransform:'uppercase',letterSpacing:'0.08em',borderBottom:'1px solid var(--border)',paddingBottom:1}}>FIFA.com →</a>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {NEWS.map((n,i)=>(
              <a key={i} href="https://www.fifa.com" target="_blank" rel="noreferrer"
                style={{background:n.feature?'var(--bg-elev)':'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'18px 20px',textDecoration:'none',color:'var(--text)',display:'flex',flexDirection:'column',gap:8,transition:'border-color 0.2s'}}
                onMouseEnter={e=>(e.currentTarget as HTMLAnchorElement).style.borderColor='var(--border-strong)'}
                onMouseLeave={e=>(e.currentTarget as HTMLAnchorElement).style.borderColor='var(--border)'}>
                <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-faint)',fontWeight:600}}>FIFA.com · {n.t}</div>
                <div style={{fontSize:n.feature?17:14,fontWeight:600,lineHeight:1.4,color:'var(--text)'}}>{n.h}</div>
                <div style={{background:'var(--text)',color:'var(--bg)',fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:700,padding:'3px 8px',borderRadius:5,alignSelf:'flex-start'}}>{n.tag}</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{borderTop:'1px solid var(--border)',padding:'28px 20px',display:'flex',flexDirection:'column',alignItems:'center',gap:12,fontSize:12,color:'var(--text-faint)',textAlign:'center'}}>
        <div style={{fontFamily:'Bebas Neue',fontSize:20,color:'var(--text)'}}>MICCI / WC26</div>
        <div style={{display:'flex',gap:20,flexWrap:'wrap',justifyContent:'center'}}>
          {['About','Rules','Privacy'].map(l=><a key={l} href="#" style={{color:'var(--text-faint)',textDecoration:'none'}}>{l}</a>)}
          <a href="https://www.fifa.com" target="_blank" rel="noreferrer" style={{color:'var(--text-faint)',textDecoration:'none'}}>FIFA.com</a>
        </div>
        <div>© 2026 micci · All rights reserved</div>
      </footer>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.85)}}
        @keyframes pulsewarn{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(154,74,42,0.5)}50%{opacity:0.9;box-shadow:0 0 0 8px transparent}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @media(max-width:768px){.hide-mobile{display:none!important}}
      `}</style>
    </div>
  )
}
