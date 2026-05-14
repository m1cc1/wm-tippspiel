'use client'
import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import Link from 'next/link'

const ADMIN_EMAIL = 'miro.harasic@gmail.com'
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
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

function fmtDT(utcMs: number, tz: number) {
  const d = new Date(utcMs + tz * 3_600_000)
  return {
    time: `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`,
    short: `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`,
  }
}

export default function DashboardPage() {
  const supabase = createBrowserClient()
  const [tz, setTz] = useState(1)
  const [userEmail, setUserEmail] = useState<string|null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [games, setGames] = useState<any[]>([])
  const [tips, setTips] = useState<Record<string,any>>({})
  const [tipInputs, setTipInputs] = useState<Record<string,{h:string,a:string}>>({})
  const [saving, setSaving] = useState<Record<string,boolean>>({})
  const [saved, setSaved] = useState<Record<string,boolean>>({})
  const [totalActive, setTotalActive] = useState(0)
  const [toast, setToast] = useState('')
  const [profileLoaded, setProfileLoaded] = useState(false)

  function showToast(msg: string) { setToast(msg); setTimeout(()=>setToast(''),2800) }

  const loadAll = useCallback(async (uid: string) => {
    const [{ data: prof }, { data: lb }, { data: gData }, { data: tData }, { count }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.rpc('get_leaderboard'),
      supabase.from('games').select('*').order('kickoff', { ascending: true }).limit(7),
      supabase.from('tips').select('*').eq('user_id', uid),
      supabase.from('profiles').select('*', { count:'exact', head:true }).eq('status','active'),
    ])
    setProfile(prof)
    setProfileLoaded(true)
    setLeaderboard(lb ?? [])
    setGames(gData ?? [])
    setTotalActive(count ?? 0)
    const tipMap: Record<string,any> = {}
    const inputMap: Record<string,{h:string,a:string}> = {}
    for (const t of (tData ?? [])) {
      tipMap[t.game_id] = t
      inputMap[t.game_id] = { h: String(t.tip_home), a: String(t.tip_away) }
    }
    setTips(tipMap)
    setTipInputs(inputMap)
  }, [supabase])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      setUserEmail(data.user.email ?? null)
      loadAll(data.user.id)
    })
    // Realtime leaderboard
    const channel = supabase.channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tips' }, () => {
        supabase.auth.getUser().then(({ data }) => { if (data.user) loadAll(data.user.id) })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games' }, () => {
        supabase.auth.getUser().then(({ data }) => { if (data.user) loadAll(data.user.id) })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadAll, supabase])

  async function saveTip(gameId: string) {
    if (!profile || profile.status !== 'active') { showToast('⏳ Account pending activation'); return }
    const inp = tipInputs[gameId]
    if (!inp || inp.h==='' || inp.a==='') return
    const tipHome = parseInt(inp.h), tipAway = parseInt(inp.a)
    if (isNaN(tipHome) || isNaN(tipAway)) return
    setSaving(s=>({...s,[gameId]:true}))
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return
    const existing = tips[gameId]
    if (existing) {
      await supabase.from('tips').update({ tip_home: tipHome, tip_away: tipAway }).eq('id', existing.id)
    } else {
      await supabase.from('tips').insert({ user_id: uid, game_id: gameId, tip_home: tipHome, tip_away: tipAway })
    }
    setSaving(s=>({...s,[gameId]:false}))
    setSaved(s=>({...s,[gameId]:true}))
    setTimeout(()=>setSaved(s=>({...s,[gameId]:false})),2500)
    const { data: user } = await supabase.auth.getUser()
    if (user.user) loadAll(user.user.id)
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const myEntry = leaderboard.find(e => e.id === profile?.id)
  const myRank = myEntry ? Number(myEntry.rank) : null
  const myPts = myEntry ? myEntry.total_points : (profile?.total_points ?? 0)
  const myDelta = myEntry?.delta ?? 0
  const above = myRank && myRank > 1 ? leaderboard.find(e => Number(e.rank) === myRank - 1) : null
  const ptsBehind = above ? (above.total_points + above.delta) - (myPts + myDelta) : 0
  const pool = totalActive * 20
  const prizes = [Math.round(pool*0.6), Math.round(pool*0.25), Math.round(pool*0.15)]
  const isAdmin = userEmail === ADMIN_EMAIL
  const isPending = profile?.status === 'pending'
  const tippedToday = games.filter(g => g.status === 'scheduled' && tips[g.id]).length
  const scheduledToday = games.filter(g => g.status === 'scheduled').length

  const ordinals: Record<number,string> = {1:'ST',2:'ND',3:'RD'}
  const suffix = myRank ? (ordinals[myRank] ?? 'TH') : ''

  return (
    <div style={{background:'var(--bg)',minHeight:'100vh'}}>

      {toast && (
        <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',zIndex:200,background:'var(--text)',color:'var(--bg)',padding:'12px 24px',borderRadius:100,fontSize:13,fontWeight:600,boxShadow:'0 8px 24px rgba(26,24,20,0.2)',whiteSpace:'nowrap'}}>
          {toast}
        </div>
      )}

      {/* ── NAV ── */}
      <nav style={{position:'sticky',top:0,zIndex:50,backdropFilter:'blur(20px)',background:'rgba(245,240,230,0.85)',borderBottom:'1px solid var(--border)'}}>
        <div style={{maxWidth:1400,margin:'0 auto',padding:'18px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>
          <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:'0.04em',display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:10,height:10,background:'var(--text)',borderRadius:'50%',animation:'pulse 2s infinite'}}/>
            MICCI <span style={{color:'var(--text-faint)',fontSize:13,fontWeight:500,fontFamily:'Inter Tight',letterSpacing:'0.05em',marginLeft:4}}>/ WC26</span>
          </div>
          <div style={{display:'flex',gap:4}}>
            {[
              {href:'/leaderboard',label:'Leaderboard'},
              {href:'/games',label:'All Matches'},
            ].map(n=>(
              <Link key={n.href} href={n.href} style={{fontSize:13,fontWeight:500,color:'var(--text-dim)',textDecoration:'none',padding:'8px 14px',borderRadius:100,letterSpacing:'0.05em',textTransform:'uppercase'}}>
                {n.label}
              </Link>
            ))}
            {isAdmin && <Link href="/admin" style={{fontSize:13,fontWeight:500,color:'var(--warn)',textDecoration:'none',padding:'8px 14px',borderRadius:100,letterSpacing:'0.05em',textTransform:'uppercase'}}>Admin</Link>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <select value={tz} onChange={e=>setTz(Number(e.target.value))}
              style={{fontSize:12,border:'1px solid var(--border)',borderRadius:100,padding:'7px 14px',background:'transparent',color:'var(--text-dim)',cursor:'pointer',fontFamily:'Inter Tight',fontWeight:500}}>
              {TZ_OPTIONS.map(o=><option key={o.offset} value={o.offset}>{o.label}</option>)}
            </select>
            <button onClick={signOut} style={{display:'flex',alignItems:'center',gap:8,background:'var(--text)',color:'var(--bg)',border:'none',padding:'10px 20px',borderRadius:100,fontWeight:700,fontSize:13,cursor:'pointer'}}>
              <span style={{width:6,height:6,background:'var(--highlight)',borderRadius:'50%'}}/>
              {profileLoaded ? profile?.display_name : '…'}
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
            {['🇫🇷 France 2 — 1 Senegal · 78\'',`You're ${myRank ? `#${myRank}` : 'climbing'} — ${myDelta > 0 ? `+${myDelta} pts live` : 'no live games'}`,`Prize pool: CHF ${pool}`,`${totalActive} players · Winner takes CHF ${prizes[0]}`,
              '📰 Mbappé confirmed in France XI','📰 Record 5.8M tickets sold','🇫🇷 France 2 — 1 Senegal · 78\'',`You're ${myRank ? `#${myRank}` : 'climbing'} — ${myDelta > 0 ? `+${myDelta} pts live` : 'no live games'}`,`Prize pool: CHF ${pool}`,`${totalActive} players · Winner takes CHF ${prizes[0]}`,
              '📰 Mbappé confirmed in France XI','📰 Record 5.8M tickets sold',
            ].map((t,i)=><span key={i} style={{margin:'0 32px',color:t.startsWith('🇫')||t.startsWith('📰')?'var(--text)':'var(--text-dim)'}}>{t}</span>)}
          </div>
        </div>
      </div>

      {/* ── PENDING BANNER ── */}
      {isPending && (
        <div style={{background:'#fffbf0',borderBottom:'2px solid #f0dfa0',padding:'16px 32px',display:'flex',alignItems:'center',gap:16}}>
          <span style={{fontSize:20}}>⏳</span>
          <div>
            <strong style={{color:'#92730a',fontSize:14}}>Payment pending</strong>
            <span style={{fontSize:13,color:'#a07820',marginLeft:12}}>Send CHF 20 via Twint to <strong>+41 79 425 64 77</strong> with message <code style={{background:'#fef3c7',padding:'1px 6px',borderRadius:4,fontFamily:'JetBrains Mono',fontWeight:700}}>WC2026</code> — activated within 24h</span>
          </div>
        </div>
      )}

      <div style={{maxWidth:1400,margin:'0 auto',padding:'48px 32px'}}>

        {/* ── BIG RANK DASHBOARD ── */}
        <div style={{background:'var(--text)',borderRadius:24,padding:48,display:'grid',gridTemplateColumns:'1fr 1.4fr',gap:56,position:'relative',overflow:'hidden',marginBottom:80}}>
          <div style={{position:'absolute',top:'-50%',right:'40%',width:600,height:600,background:'radial-gradient(circle,rgba(212,193,154,0.08) 0%,transparent 60%)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',top:0,bottom:0,left:'calc(100%/2.4 + 28px)',width:1,background:'rgba(245,240,230,0.08)'}}/>

          {/* Left: rank */}
          <div style={{display:'flex',flexDirection:'column',justifyContent:'space-between',position:'relative',zIndex:2}}>
            <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.15em',color:'var(--text-faint)',marginBottom:16,display:'flex',alignItems:'center',gap:12}}>
              Your position · updates every goal
              <div style={{flex:1,height:1,background:'rgba(245,240,230,0.15)'}}/>
            </div>
            <div style={{display:'flex',alignItems:'baseline',gap:12,marginBottom:8}}>
              <div style={{fontFamily:'Bebas Neue',fontSize:160,lineHeight:0.85,background:'linear-gradient(180deg,#f5f0e6 0%,#d4c19a 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                {profileLoaded ? (myRank ?? '—') : '…'}
              </div>
              {myRank && <div style={{fontFamily:'Bebas Neue',fontSize:44,color:'var(--highlight)',lineHeight:1,opacity:0.85}}>{suffix}</div>}
              {myRank && <div style={{fontSize:13,color:'var(--text-faint)',fontWeight:500,marginBottom:12}}>of {leaderboard.length}</div>}
            </div>
            <div style={{fontSize:20,fontWeight:700,marginBottom:24,color:'var(--bg)'}}>
              {profileLoaded ? profile?.display_name : '…'} <span style={{color:'var(--text-faint)',fontWeight:500}}>· {myPts + myDelta} pts{myDelta > 0 ? ` (+${myDelta} live)` : ''}</span>
            </div>
            {above && (
              <div style={{background:'rgba(245,240,230,0.05)',border:'1px solid rgba(245,240,230,0.1)',borderRadius:14,padding:'14px 16px',display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:32,height:32,background:'var(--highlight)',color:'var(--text)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:16,flexShrink:0}}>!</div>
                <div style={{fontSize:13,lineHeight:1.4}}>
                  <strong style={{color:'var(--highlight)'}}>{ptsBehind} pts behind {above.display_name}</strong>
                  <span style={{color:'var(--text-faint)',display:'block',marginTop:2}}>nail the next match to {ptsBehind <= 10 ? 'overtake' : 'close the gap'}</span>
                </div>
              </div>
            )}
            {!above && myRank===1 && (
              <div style={{background:'rgba(212,193,154,0.12)',border:'1px solid rgba(212,193,154,0.25)',borderRadius:14,padding:'14px 16px',fontSize:13,color:'var(--highlight)',fontWeight:600}}>
                🏆 You're leading! Stay sharp.
              </div>
            )}
          </div>

          {/* Right: stats */}
          <div style={{display:'flex',flexDirection:'column',gap:32,position:'relative',zIndex:2}}>
            {/* Core stats */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,paddingBottom:28,borderBottom:'1px solid rgba(245,240,230,0.1)'}}>
              {[
                {val:`+${myDelta}`,label:'Live points',dim:myDelta===0},
                {val:`${ptsBehind||0}`,label:'Pts to overtake',dim:!above},
                {val:profile?.total_points??0,label:'Total points'},
              ].map((s,i)=>(
                <div key={i}>
                  <div style={{fontFamily:'Bebas Neue',fontSize:52,lineHeight:1,marginBottom:6,color:s.dim?'rgba(245,240,230,0.3)':'var(--highlight)'}}>{s.val}</div>
                  <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-faint)'}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Insights grid */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
              {/* Projected prize */}
              <div style={{background:'linear-gradient(135deg,rgba(212,193,154,0.12) 0%,rgba(245,240,230,0.04) 100%)',border:'1px solid rgba(212,193,154,0.25)',borderRadius:14,padding:18}}>
                <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.15em',color:'var(--text-faint)',marginBottom:14,fontWeight:600}}>Projected prize</div>
                <div style={{display:'flex',alignItems:'center',gap:16}}>
                  <div style={{fontFamily:'Bebas Neue',fontSize:44,lineHeight:0.9,color:'var(--highlight)',letterSpacing:'-0.02em'}}>
                    {myRank && myRank<=3 ? `CHF ${prizes[myRank-1]}` : '—'}
                  </div>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:'#b8d4a8',marginBottom:2}}>{myRank && myRank<=3 ? `🥇🥈🥉`[myRank-1]+` place` : 'Outside top 3'}</div>
                    <div style={{fontSize:11,color:'var(--text-faint)'}}>{myRank && myRank<=3 ? `${[60,25,15][myRank-1]}% of CHF ${pool}` : 'Climb to top 3 to win'}</div>
                  </div>
                </div>
              </div>

              {/* Tips progress */}
              <div style={{background:'rgba(245,240,230,0.04)',border:'1px solid rgba(245,240,230,0.08)',borderRadius:14,padding:18}}>
                <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.15em',color:'var(--text-faint)',marginBottom:14,fontWeight:600}}>Today's tips</div>
                <div style={{display:'flex',alignItems:'center',gap:16}}>
                  <svg width={52} height={52} style={{transform:'rotate(-90deg)',flexShrink:0}}>
                    <circle cx={26} cy={26} r={22} fill="none" stroke="rgba(245,240,230,0.12)" strokeWidth={3}/>
                    <circle cx={26} cy={26} r={22} fill="none" stroke="var(--highlight)" strokeWidth={3} strokeLinecap="round"
                      strokeDasharray={`${scheduledToday>0?tippedToday/scheduledToday*138:0} 138`}/>
                    <text x={26} y={26} textAnchor="middle" dominantBaseline="central" style={{transform:'rotate(90deg)',transformOrigin:'26px 26px',fill:'var(--bg)',fontFamily:'Bebas Neue',fontSize:16,letterSpacing:'0.02em'}}>{tippedToday}/{scheduledToday}</text>
                  </svg>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:tippedToday<scheduledToday?'var(--highlight)':'#b8d4a8',marginBottom:2}}>
                      {tippedToday<scheduledToday ? `⚠ ${scheduledToday-tippedToday} untipped` : '✓ All tipped'}
                    </div>
                    <div style={{fontSize:11,color:'var(--text-faint)'}}>upcoming matches</div>
                  </div>
                </div>
              </div>

              {/* Accuracy */}
              <div style={{background:'rgba(245,240,230,0.04)',border:'1px solid rgba(245,240,230,0.08)',borderRadius:14,padding:18}}>
                <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.15em',color:'var(--text-faint)',marginBottom:14,fontWeight:600}}>Accuracy</div>
                <div style={{display:'flex',alignItems:'center',gap:16}}>
                  <div style={{fontFamily:'Bebas Neue',fontSize:44,lineHeight:0.9,color:'var(--highlight)'}}>
                    {profile?.exact_count>0 ? `${Math.round(profile.exact_count/(profile.exact_count+profile.tendency_count)*100)}%` : '—'}
                  </div>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:'var(--bg)',marginBottom:2}}>{profile?.exact_count??0} exact tips</div>
                    <div style={{fontSize:11,color:'var(--text-faint)'}}>{profile?.tendency_count??0} partial pts</div>
                  </div>
                </div>
              </div>

              {/* Prize pool */}
              <div style={{background:'rgba(245,240,230,0.04)',border:'1px solid rgba(245,240,230,0.08)',borderRadius:14,padding:18}}>
                <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.15em',color:'var(--text-faint)',marginBottom:14,fontWeight:600}}>Prize pool</div>
                <div style={{display:'flex',alignItems:'center',gap:16}}>
                  <div style={{fontFamily:'Bebas Neue',fontSize:44,lineHeight:0.9,color:'var(--highlight)'}}>CHF {pool}</div>
                </div>
                <div style={{fontSize:11,color:'var(--text-faint)',marginTop:8}}>🥇 CHF {prizes[0]} · 🥈 CHF {prizes[1]} · 🥉 CHF {prizes[2]}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── LEADERBOARD ── */}
        <div style={{marginBottom:80}}>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:32,flexWrap:'wrap',gap:16}}>
            <h2 style={{fontFamily:'Bebas Neue',fontSize:'clamp(48px,6vw,80px)',lineHeight:0.9,color:'var(--text)'}}>The <span style={{color:'var(--beige-deep)'}}>standings</span></h2>
            <Link href="/leaderboard" style={{fontSize:13,fontWeight:600,color:'var(--text-dim)',textDecoration:'none',textTransform:'uppercase',letterSpacing:'0.1em',borderBottom:'1px solid var(--border)',paddingBottom:2}}>View all {leaderboard.length} players →</Link>
          </div>
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'60px 1fr 100px 100px 140px',gap:16,padding:'16px 28px',borderBottom:'1px solid var(--border)',fontSize:11,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-faint)',fontWeight:600,background:'var(--bg-card-2)'}}>
              <div>Rank</div><div>Player</div><div>Points</div><div>Live</div><div style={{textAlign:'right'}}>Prize</div>
            </div>
            {leaderboard.slice(0,6).map((e,i)=>{
              const rank=Number(e.rank)
              const isMe=e.id===profile?.id
              const prize=rank<=3?prizes[rank-1]:null
              const prizeColor=rank===1?'var(--text)':rank===2?'var(--beige-deep)':rank===3?'var(--beige-mid)':'var(--text-faint)'
              const rankColor=rank===1?'var(--text)':rank===2?'var(--beige-deep)':rank===3?'var(--beige-mid)':'var(--text-faint)'
              return (
                <div key={e.id} style={{display:'grid',gridTemplateColumns:'60px 1fr 100px 100px 140px',gap:16,padding:'20px 28px',alignItems:'center',borderBottom:'1px solid var(--border)',background:isMe?'linear-gradient(90deg,rgba(26,24,20,0.04) 0%,transparent 100%)':'transparent',position:'relative',transition:'background 0.2s'}}>
                  {isMe && <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:'var(--text)'}}/>}
                  <div style={{fontFamily:'Bebas Neue',fontSize:32,color:rankColor}}>{String(rank).padStart(2,'0')}</div>
                  <div style={{display:'flex',alignItems:'center',gap:14}}>
                    <div style={{width:40,height:40,borderRadius:'50%',background:isMe?'var(--text)':'var(--bg-elev)',border:`1px solid ${isMe?'var(--text)':'var(--border)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,color:isMe?'var(--bg)':'var(--text-dim)',flexShrink:0}}>
                      {e.display_name.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontWeight:600,fontSize:15,color:'var(--text)',display:'flex',alignItems:'center',gap:6}}>
                        {e.display_name}
                        {isMe && <span style={{fontSize:10,background:'var(--text)',color:'var(--bg)',padding:'2px 6px',borderRadius:4,fontWeight:700,letterSpacing:'0.05em'}}>YOU</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:18,color:'var(--text)'}}>{e.total_points}</div>
                  <div style={{fontFamily:'JetBrains Mono',fontSize:13,color:e.delta>0?'var(--warn)':'var(--text-faint)',fontWeight:600}}>{e.delta>0?`+${e.delta}`:'—'}</div>
                  <div style={{textAlign:'right',fontWeight:700,fontSize:15,color:prizeColor}}>{prize!=null?`CHF ${prize}`:'—'}</div>
                </div>
              )
            })}
            <div style={{padding:'18px 28px',textAlign:'center',borderTop:'1px solid var(--border)',background:'var(--bg-card-2)'}}>
              <Link href="/leaderboard" style={{color:'var(--text)',textDecoration:'none',fontSize:13,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em'}}>View all {leaderboard.length} players →</Link>
            </div>
          </div>
        </div>

        {/* ── NEXT MATCHES TO TIP ── */}
        <div style={{marginBottom:80}}>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:32,flexWrap:'wrap',gap:16}}>
            <h2 style={{fontFamily:'Bebas Neue',fontSize:'clamp(48px,6vw,80px)',lineHeight:0.9,color:'var(--text)'}}>Tip the <span style={{color:'var(--beige-deep)'}}>matches</span></h2>
            <Link href="/games" style={{fontSize:13,fontWeight:600,color:'var(--text-dim)',textDecoration:'none',textTransform:'uppercase',letterSpacing:'0.1em',borderBottom:'1px solid var(--border)',paddingBottom:2}}>All 104 matches →</Link>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
            {games.filter(g=>g.status!=='finished').slice(0,6).map((game,i)=>{
              const featured=i===0&&game.status==='scheduled'
              const tip=tips[game.id]
              const inp=tipInputs[game.id]??{h:'',a:''}
              const isClosed=game.status!=='scheduled'
              const {time,short}=fmtDT(new Date(game.kickoff).getTime(),tz)
              return (
                <div key={game.id} style={{background:featured?'var(--text)':'var(--bg-card)',border:`1px solid ${featured?'var(--text)':game.status==='live'?'rgba(154,74,42,0.4)':'var(--border)'}`,borderRadius:20,padding:24,gridColumn:featured?'span 2':'span 1',transition:'all 0.2s'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,fontSize:11,textTransform:'uppercase',letterSpacing:'0.1em',color:featured?'rgba(245,240,230,0.5)':'var(--text-faint)'}}>
                    <span style={{background:featured?'rgba(245,240,230,0.08)':'var(--bg-elev)',padding:'4px 10px',borderRadius:6,color:featured?'var(--highlight)':'var(--text-dim)'}}>{game.group_stage}</span>
                    {game.status==='live'
                      ? <span style={{color:'var(--warn)',fontWeight:700,display:'flex',alignItems:'center',gap:6}}><span style={{width:6,height:6,background:'var(--warn)',borderRadius:'50%',animation:'pulsewarn 1.5s infinite',display:'inline-block'}}/>LIVE {game.minute}'</span>
                      : <span>{short} · {time} · {game.venue}</span>
                    }
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:featured?24:16,marginBottom:20}}>
                    <div style={{flex:1,display:'flex',alignItems:'center',gap:featured?14:10}}>
                      <span style={{fontSize:featured?40:32}}>{game.home_flag}</span>
                      <div>
                        <div style={{fontWeight:700,fontSize:featured?16:14,color:featured?'var(--bg)':'var(--text)'}}>{game.home_team}</div>
                      </div>
                    </div>
                    {isClosed
                      ? <div style={{fontFamily:'Bebas Neue',fontSize:featured?28:22,color:game.status==='live'?'var(--warn)':featured?'var(--bg)':'var(--text)',background:game.status==='live'?'rgba(154,74,42,0.15)':'transparent',padding:'4px 10px',borderRadius:8}}>{game.home_score??0}:{game.away_score??0}</div>
                      : <div style={{fontFamily:'Bebas Neue',fontSize:16,color:featured?'rgba(245,240,230,0.4)':'var(--text-faint)'}}>VS</div>
                    }
                    <div style={{flex:1,display:'flex',alignItems:'center',gap:featured?14:10,flexDirection:'row-reverse',textAlign:'right'}}>
                      <span style={{fontSize:featured?40:32}}>{game.away_flag}</span>
                      <div>
                        <div style={{fontWeight:700,fontSize:featured?16:14,color:featured?'var(--bg)':'var(--text)'}}>{game.away_team}</div>
                      </div>
                    </div>
                  </div>

                  {/* Tip area */}
                  <div style={{background:featured?'rgba(245,240,230,0.04)':'var(--bg-card-2)',border:`1px solid ${featured?'rgba(245,240,230,0.12)':'var(--border)'}`,borderRadius:12,padding:16}}>
                    <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.12em',color:featured?'rgba(245,240,230,0.4)':'var(--text-faint)',marginBottom:10,display:'flex',justifyContent:'space-between'}}>
                      <span>Your prediction</span>
                      {tip&&!isClosed&&<span style={{color:featured?'var(--highlight)':'var(--beige-deep)'}}>Current: {tip.tip_home}:{tip.tip_away}</span>}
                    </div>

                    {isClosed ? (
                      <div style={{textAlign:'center',padding:'8px 0',fontSize:13,color:featured?'rgba(245,240,230,0.5)':'var(--text-faint)'}}>
                        {tip ? <><span style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:16,color:featured?'var(--highlight)':'var(--text)'}}>{tip.tip_home}:{tip.tip_away}</span>{tip.points!=null&&<span style={{marginLeft:8,fontSize:11,background:tip.points===10?'#b8d4a8':tip.points>0?'#fef3c7':'rgba(245,240,230,0.1)',color:tip.points===10?'#1a3a1a':tip.points>0?'#92730a':'var(--text-faint)',padding:'2px 8px',borderRadius:4,fontWeight:700}}>+{tip.points} pts</span>}</> : <span>⏳ {game.status==='live'?'Locked while live':'No tip entered'}</span>}
                      </div>
                    ) : (
                      <>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,marginBottom:12}}>
                          {(['h','a'] as const).map((side,si)=>(
                            <input key={side} type="number" min={0} max={20} value={side==='h'?inp.h:inp.a} placeholder="—"
                              onChange={e=>setTipInputs(t=>({...t,[game.id]:side==='h'?{...inp,h:e.target.value}:{...inp,a:e.target.value}}))}
                              disabled={isPending}
                              style={{width:56,height:56,background:featured?'rgba(245,240,230,0.06)':'var(--bg-card)',border:`1px solid ${featured?'rgba(245,240,230,0.15)':'var(--border)'}`,borderRadius:12,fontFamily:'Bebas Neue',fontSize:32,color:featured?'var(--bg)':'var(--text)',textAlign:'center',outline:'none',opacity:isPending?0.4:1}}
                            />
                          ))}
                        </div>
                        <button onClick={()=>saveTip(game.id)} disabled={saving[game.id]||isPending}
                          style={{width:'100%',padding:'10px',background:saved[game.id]?'transparent':featured?'var(--bg)':'var(--text)',color:saved[game.id]?(featured?'var(--highlight)':'var(--text)'):(featured?'var(--text)':'var(--bg)'),border:saved[game.id]?`1px solid ${featured?'var(--highlight)':'var(--text)'}`:featured?'1px solid var(--bg)':'1px solid var(--text)',borderRadius:10,fontWeight:700,fontSize:12,textTransform:'uppercase',letterSpacing:'0.1em',cursor:isPending?'not-allowed':'pointer',opacity:isPending?0.5:1,transition:'all 0.2s'}}>
                          {saving[game.id]?'Saving…':saved[game.id]?'✓ Saved!':tip?'Update tip':'Save tip'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Bonus picks inline */}
            <div style={{gridColumn:'span 2',background:'var(--bg-elev)',border:'1px solid var(--border-strong)',borderRadius:20,padding:24}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,fontSize:11,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-faint)'}}>
                <span style={{background:'var(--bg-card)',padding:'4px 10px',borderRadius:6,color:'var(--text-dim)'}}>Special</span>
                <span style={{color:'var(--warn)',fontWeight:600}}>+40 PTS · Editable until June 11</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
                {[
                  {icon:'🏆',label:'Trophy lifter',q:'Who lifts the trophy on July 19?'},
                  {icon:'⚽',label:'Golden boot',q:"Top scorer's nationality?"},
                ].map((b,i)=>(
                  <div key={i}>
                    <div style={{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:'0.02em',color:'var(--text)',marginBottom:6}}>{b.label}</div>
                    <div style={{fontSize:13,color:'var(--text-dim)',marginBottom:12}}>{b.q}</div>
                    <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12,padding:'14px 16px',display:'flex',alignItems:'center',gap:12,cursor:'pointer'}}>
                      <span style={{fontSize:24}}>?</span>
                      <span style={{color:'var(--text-faint)',fontSize:13}}>Pick a {i===0?'country':'nationality'}</span>
                      <span style={{marginLeft:'auto',fontSize:11,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:600}}>Not set</span>
                    </div>
                    <div style={{fontSize:11,color:'var(--text-faint)',marginTop:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>Earns 20 pts if correct</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── POINTS SYSTEM ── */}
        <div style={{marginBottom:80}}>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:32,flexWrap:'wrap',gap:16}}>
            <h2 style={{fontFamily:'Bebas Neue',fontSize:'clamp(48px,6vw,80px)',lineHeight:0.9,color:'var(--text)'}}>How you <span style={{color:'var(--beige-deep)'}}>score</span></h2>
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
      </div>

      {/* FOOTER */}
      <footer style={{borderTop:'1px solid var(--border)',padding:'40px 32px',maxWidth:1400,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16,fontSize:12,color:'var(--text-faint)'}}>
        <div>micci · WC26 · CHF {pool} pool · {totalActive} players</div>
        <div style={{display:'flex',gap:24}}>
          {['About','Rules','Privacy'].map(l=><a key={l} href="#" style={{color:'var(--text-faint)',textDecoration:'none'}}>{l}</a>)}
          <a href="https://www.fifa.com" target="_blank" rel="noreferrer" style={{color:'var(--text-faint)',textDecoration:'none'}}>FIFA.com</a>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes pulsewarn { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(154,74,42,0.5)} 50%{opacity:0.9;box-shadow:0 0 0 8px transparent} }
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none }
      `}</style>
    </div>
  )
}
