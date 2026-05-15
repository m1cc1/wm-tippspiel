'use client'
import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import Link from 'next/link'

const ADMIN_EMAIL = 'miro.harasic@gmail.com'
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const TZ_OPTIONS=[
  {label:'🇺🇸 LA −7',offset:-7},{label:'🇲🇽 MEX −6',offset:-6},
  {label:'🇺🇸 NYC −5',offset:-5},{label:'🇧🇷 SAO −4',offset:-4},
  {label:'🇬🇧 LON +0',offset:0},{label:'🇨🇭 ZRH +1',offset:1},
  {label:'🇬🇷 ATH +2',offset:2},{label:'🇨🇳 PEK +8',offset:8},
  {label:'🇯🇵 TYO +9',offset:9},
]
const ALL_48 = [
  '🇲🇽 Mexico','🇿🇦 South Africa','🇰🇷 South Korea','🇨🇿 Czechia',
  '🇨🇦 Canada','🇧🇦 Bosnia & Herz.','🇵🇹 Portugal','🇨🇩 DR Congo',
  '🇧🇷 Brazil','🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland','🇲🇦 Morocco','🇭🇹 Haiti',
  '🇺🇸 USA','🇵🇾 Paraguay','🇹🇷 Türkiye','🇦🇺 Australia',
  '🇪🇸 Spain','🇪🇬 Egypt','🇦🇹 Austria','🇯🇴 Jordan',
  '🇯🇵 Japan','🇹🇳 Tunisia','🇨🇴 Colombia','🇨🇮 Ivory Coast',
  '🇩🇪 Germany','🇸🇦 Saudi Arabia','🇸🇪 Sweden','🇳🇿 New Zealand',
  '🇳🇱 Netherlands','🇸🇳 Senegal','🇮🇷 Iran','🇪🇨 Ecuador',
  '🇫🇷 France','🇳🇴 Norway','🇮🇶 Iraq','🇩🇿 Algeria',
  '🇦🇷 Argentina','🇶🇦 Qatar','🇬🇭 Ghana','🇺🇿 Uzbekistan',
  '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England','🇭🇷 Croatia','🇵🇦 Panama','🇧🇪 Belgium',
  '🇺🇾 Uruguay','🇨🇻 Cape Verde','🇨🇼 Curaçao','🇨🇭 Switzerland',
]

function fmtDT(utcMs:number,tz:number){
  const d=new Date(utcMs+tz*3_600_000)
  return {time:`${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`,short:`${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`}
}

// Project final rank based on current pace
function projectFinalRank(myRank:number|null, myPts:number, leaderboard:any[], gamesPlayed:number, totalGames:number):string {
  if (!myRank || gamesPlayed === 0) return 'N/A'
  const ptsPerGame = myPts / gamesPlayed
  const remainingGames = totalGames - gamesPlayed
  const projectedTotal = myPts + (ptsPerGame * remainingGames)
  const ordinals:Record<number,string> = {1:'1st 🥇',2:'2nd 🥈',3:'3rd 🥉'}
  // Simple projection: assume others maintain same pace
  const projected = leaderboard.map(e => ({
    id: e.id,
    pts: e.total_points,
    projected: e.total_points + (e.total_points/Math.max(gamesPlayed,1)) * remainingGames
  })).sort((a,b)=>b.projected-a.projected)
  const myProjectedRank = projected.findIndex(e=>e.id===leaderboard.find((x:any)=>x.rank===myRank)?.id) + 1
  if (myProjectedRank <= 3) return ordinals[myProjectedRank] || `${myProjectedRank}th`
  return `${myProjectedRank}th`
}

export default function DashboardPage() {
  const supabase = createBrowserClient()
  const [tz,setTz]=useState(1)
  const [userEmail,setUserEmail]=useState<string|null>(null)
  const [profile,setProfile]=useState<any>(null)
  const [leaderboard,setLeaderboard]=useState<any[]>([])
  const [games,setGames]=useState<any[]>([])
  const [tips,setTips]=useState<Record<string,any>>({})
  const [tipInputs,setTipInputs]=useState<Record<string,{h:string,a:string}>>({})
  const [saving,setSaving]=useState<Record<string,boolean>>({})
  const [saved,setSaved]=useState<Record<string,boolean>>({})
  const [totalActive,setTotalActive]=useState(0)
  const [toast,setToast]=useState('')
  const [profileLoaded,setProfileLoaded]=useState(false)
  const [menuOpen,setMenuOpen]=useState(false)
  const [specialPick,setSpecialPick]=useState<{tournament_winner:string,top_scorer_nation:string,locked:boolean}|null>(null)
  const [savingSpecial,setSavingSpecial]=useState(false)
  const [specialSaved,setSpecialSaved]=useState(false)

  function showToast(msg:string){setToast(msg);setTimeout(()=>setToast(''),2800)}

  const loadAll=useCallback(async(uid:string)=>{
    const [{data:prof},{data:lb},{data:gData},{data:tData},{count},{data:sp}]=await Promise.all([
      supabase.from('profiles').select('*').eq('id',uid).single(),
      supabase.rpc('get_leaderboard'),
      supabase.from('games').select('*').order('kickoff',{ascending:true}).limit(7),
      supabase.from('tips').select('*').eq('user_id',uid),
      supabase.from('profiles').select('*',{count:'exact',head:true}).eq('status','active'),
      supabase.from('special_picks').select('*').eq('user_id',uid).single(),
    ])
    setProfile(prof);setProfileLoaded(true);setLeaderboard(lb??[]);setGames(gData??[]);setTotalActive(count??0)
    if (sp) setSpecialPick(sp)
    const tipMap:Record<string,any>={},inputMap:Record<string,{h:string,a:string}>={}
    for(const t of(tData??[])){tipMap[t.game_id]=t;inputMap[t.game_id]={h:String(t.tip_home),a:String(t.tip_away)}}
    setTips(tipMap);setTipInputs(inputMap)
  },[supabase])

  useEffect(()=>{
    supabase.auth.getUser().then(async({data})=>{
      if(!data.user)return
      setUserEmail(data.user.email??null)
      loadAll(data.user.id)
    })
    const channel=supabase.channel('dash-updates')
      .on('postgres_changes',{event:'*',schema:'public',table:'tips'},()=>{supabase.auth.getUser().then(({data})=>{if(data.user)loadAll(data.user.id)})})
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'games'},()=>{supabase.auth.getUser().then(({data})=>{if(data.user)loadAll(data.user.id)})})
      .subscribe()
    return()=>{supabase.removeChannel(channel)}
  },[loadAll,supabase])

  async function saveTip(gameId:string){
    if(!profile||profile.status!=='active'){showToast('⏳ Account pending activation');return}
    const inp=tipInputs[gameId]
    if(!inp||inp.h===''||inp.a==='')return
    const tipHome=parseInt(inp.h),tipAway=parseInt(inp.a)
    if(isNaN(tipHome)||isNaN(tipAway))return
    setSaving(s=>({...s,[gameId]:true}))
    const uid=(await supabase.auth.getUser()).data.user?.id
    if(!uid)return
    const existing=tips[gameId]
    if(existing)await supabase.from('tips').update({tip_home:tipHome,tip_away:tipAway}).eq('id',existing.id)
    else await supabase.from('tips').insert({user_id:uid,game_id:gameId,tip_home:tipHome,tip_away:tipAway})
    setSaving(s=>({...s,[gameId]:false}));setSaved(s=>({...s,[gameId]:true}))
    setTimeout(()=>setSaved(s=>({...s,[gameId]:false})),2500)
    const{data:user}=await supabase.auth.getUser()
    if(user.user)loadAll(user.user.id)
  }

  async function saveSpecialPick(field:'tournament_winner'|'top_scorer_nation', value:string){
    const uid=(await supabase.auth.getUser()).data.user?.id
    if(!uid||!profile||profile.status!=='active'){showToast('⏳ Account pending activation');return}
    if(specialPick?.locked){showToast('🔒 Bonus picks are locked since June 11');return}
    setSavingSpecial(true)
    const updated={...specialPick,user_id:uid,[field]:value}
    await supabase.from('special_picks').upsert(updated,{onConflict:'user_id'})
    setSpecialPick(updated as any)
    setSavingSpecial(false);setSpecialSaved(true)
    setTimeout(()=>setSpecialSaved(false),2000)
  }

  async function signOut(){await supabase.auth.signOut();window.location.href='/'}

  const myEntry=leaderboard.find(e=>e.id===profile?.id)
  const myRank=myEntry?Number(myEntry.rank):null
  const myPts=myEntry?myEntry.total_points:(profile?.total_points??0)
  const myDelta=myEntry?.delta??0
  const above=myRank&&myRank>1?leaderboard.find(e=>Number(e.rank)===myRank-1):null
  const ptsBehind=above?(above.total_points+above.delta)-(myPts+myDelta):0
  const pool=totalActive*25
  const prizes=[Math.round(pool*0.6),Math.round(pool*0.25),Math.round(pool*0.15)]
  const isAdmin=userEmail===ADMIN_EMAIL
  const isPending=profile?.status==='pending'
  const tippedScheduled=games.filter(g=>g.status==='scheduled'&&tips[g.id]).length
  const totalScheduled=games.filter(g=>g.status==='scheduled').length
  const ordinals:Record<number,string>={1:'ST',2:'ND',3:'RD'}
  const suffix=myRank?(ordinals[myRank]??'TH'):''
  const gamesFinished=(profile?.exact_count??0)+(profile?.tendency_count??0)+(leaderboard.length>0?1:0)
  const projectedRank=projectFinalRank(myRank,myPts,leaderboard,gamesFinished,104)
  const nav=[
    {href:'/leaderboard',label:'Standings'},
    {href:'/games',label:'Matches'},
    ...(isAdmin?[{href:'/admin',label:'Admin',warn:true}]:[]),
  ]

  return (
    <div style={{background:'var(--bg)',minHeight:'100vh'}}>
      {toast&&<div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',zIndex:200,background:'var(--text)',color:'var(--bg)',padding:'12px 20px',borderRadius:100,fontSize:13,fontWeight:600,boxShadow:'0 8px 24px rgba(26,24,20,0.2)',whiteSpace:'nowrap',maxWidth:'90vw',textAlign:'center'}}>{toast}</div>}

      {/* NAV */}
      <nav style={{position:'sticky',top:0,zIndex:50,backdropFilter:'blur(20px)',background:'rgba(245,240,230,0.92)',borderBottom:'1px solid var(--border)'}}>
        <div style={{maxWidth:1400,margin:'0 auto',padding:'0 20px',height:54,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          <Link href="/dashboard" style={{textDecoration:'none',color:'var(--text)',flexShrink:0,display:'flex',flexDirection:'column',gap:0}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:20,letterSpacing:'0.05em',lineHeight:1,color:'var(--text)'}}>World Cup 2026</div>
            <div style={{display:'flex',alignItems:'center',gap:5,marginTop:2}}>
              <span style={{fontSize:8,fontWeight:500,color:'var(--text-faint)',letterSpacing:'0.08em',textTransform:'uppercase',whiteSpace:'nowrap'}}>prediction game by</span>
              <img src="/m1c1-logo.jpg" alt="m1c1" style={{height:14,width:'auto',display:'block',mixBlendMode:'multiply',opacity:0.85}}/>
            </div>
          </Link>
          <div style={{display:'flex',gap:2}} className="hide-mobile">
            {nav.map(n=>(
              <Link key={n.href} href={n.href} style={{fontSize:12,fontWeight:600,color:n.warn?'var(--warn)':'var(--text-dim)',textDecoration:'none',padding:'7px 12px',borderRadius:100,letterSpacing:'0.05em',textTransform:'uppercase' as any}}>
                {n.label}
              </Link>
            ))}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
            <div className="hide-mobile" style={{display:'flex',alignItems:'center',gap:10}}>
              {profileLoaded&&profile?.display_name&&(
                <div style={{fontSize:13,fontWeight:600,color:'var(--text-dim)'}}>
                  Hi, <span style={{color:'var(--text)'}}>{profile.display_name.split(' ')[0]}</span>
                </div>
              )}
              <select value={tz} onChange={e=>setTz(Number(e.target.value))}
                style={{fontSize:11,border:'1px solid var(--border)',borderRadius:100,padding:'6px 10px',background:'transparent',color:'var(--text-dim)',cursor:'pointer',fontFamily:'Inter Tight',fontWeight:500}}>
                {TZ_OPTIONS.map(o=><option key={o.offset} value={o.offset}>{o.label}</option>)}
              </select>
              <button onClick={signOut} style={{fontSize:11,fontWeight:700,color:'var(--text-faint)',background:'none',border:'1px solid var(--border)',padding:'6px 14px',borderRadius:100,cursor:'pointer',textTransform:'uppercase',letterSpacing:'0.08em'}}>
                Sign out
              </button>
            </div>
            <button onClick={()=>setMenuOpen(!menuOpen)} className="show-mobile"
              style={{background:'var(--bg-elev)',border:'1px solid var(--border)',borderRadius:10,padding:'8px 10px',cursor:'pointer',fontSize:16,lineHeight:1,color:'var(--text)'}}>
              {menuOpen?'✕':'☰'}
            </button>
          </div>
        </div>
        {menuOpen&&(
          <div style={{background:'var(--bg)',borderTop:'1px solid var(--border)',padding:'12px 20px 20px',display:'flex',flexDirection:'column',gap:4}}>
            {nav.map(n=>(
              <Link key={n.href} href={n.href} onClick={()=>setMenuOpen(false)}
                style={{fontSize:14,fontWeight:600,color:n.warn?'var(--warn)':'var(--text-dim)',textDecoration:'none',padding:'12px 16px',borderRadius:12,textTransform:'uppercase',letterSpacing:'0.06em'}}>
                {n.label}
              </Link>
            ))}
            <div style={{borderTop:'1px solid var(--border)',marginTop:8,paddingTop:12}}>
              <select value={tz} onChange={e=>setTz(Number(e.target.value))}
                style={{width:'100%',fontSize:13,border:'1px solid var(--border)',borderRadius:12,padding:'10px 12px',background:'var(--bg-card-2)',color:'var(--text-dim)',cursor:'pointer',fontFamily:'Inter Tight',fontWeight:500,marginBottom:8}}>
                {TZ_OPTIONS.map(o=><option key={o.offset} value={o.offset}>{o.label}</option>)}
              </select>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 4px'}}>
                <div style={{fontSize:13,color:'var(--text-dim)'}}>
                  {profileLoaded&&profile?.display_name&&<>Hi, <strong style={{color:'var(--text)'}}>{profile.display_name.split(' ')[0]}</strong></>}
                </div>
                <button onClick={signOut} style={{background:'none',border:'1px solid var(--border)',color:'var(--text-faint)',fontSize:12,fontWeight:700,padding:'6px 14px',borderRadius:100,cursor:'pointer',textTransform:'uppercase'}}>Sign out</button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* TICKER */}
      <div style={{borderBottom:'1px solid var(--border)',padding:'11px 0',overflow:'hidden',display:'flex',alignItems:'center',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0,paddingLeft:20,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.12em'}}>
          <div style={{width:7,height:7,background:'var(--warn)',borderRadius:'50%',animation:'pulsewarn 1.5s infinite'}}/>
          <span style={{color:'var(--warn)'}}>LIVE</span>
        </div>
        <div style={{overflow:'hidden',flex:1}}>
          <div style={{display:'inline-block',animation:'ticker 40s linear infinite',whiteSpace:'nowrap',fontSize:12,color:'var(--text-dim)'}}>
            {[`You're ${myRank?`#${myRank}`:'not yet ranked'} · ${myPts+myDelta} pts`,`Prize pool: CHF ${pool}`,`${totalActive} players · projected finish: ${projectedRank}`,
              '🇫🇷 France 2–1 Senegal · 78\'','📰 Mbappé confirmed in France XI','📰 Record 5.8M tickets sold',
              `You're ${myRank?`#${myRank}`:'not yet ranked'} · ${myPts+myDelta} pts`,`Prize pool: CHF ${pool}`,`${totalActive} players · projected finish: ${projectedRank}`,
              '🇫🇷 France 2–1 Senegal · 78\'','📰 Mbappé confirmed in France XI','📰 Record 5.8M tickets sold',
            ].map((t,i)=><span key={i} style={{margin:'0 28px',color:t.startsWith('🇫')||t.startsWith('📰')?'var(--text)':'var(--text-dim)'}}>{t}</span>)}
          </div>
        </div>
      </div>

      {isPending&&(
        <div style={{background:'#fffbf0',borderBottom:'2px solid #f0dfa0',padding:'14px 20px',display:'flex',alignItems:'flex-start',gap:12}}>
          <span style={{fontSize:18,flexShrink:0}}>⏳</span>
          <div>
            <strong style={{color:'#92730a',fontSize:13}}>Payment pending</strong>
            <div style={{fontSize:12,color:'#a07820',marginTop:2}}>Send CHF 25 via Twint to <strong>+41 79 425 64 77</strong> · message: <code style={{fontFamily:'JetBrains Mono',fontWeight:700,background:'#fef3c7',padding:'1px 5px',borderRadius:4}}>WC2026</code></div>
          </div>
        </div>
      )}

      <div className="page-wrap">

        {/* ── MORNING BRIEFING TEASER ── */}
        <div style={{background:'var(--text)',borderRadius:20,padding:'24px 28px',marginBottom:32,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:'-40px',right:'-40px',width:200,height:200,background:'radial-gradient(circle,rgba(212,193,154,0.12) 0%,transparent 60%)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',top:16,right:20,fontSize:11,fontWeight:700,color:'rgba(245,240,230,0.25)',textTransform:'uppercase',letterSpacing:'0.12em'}}>Coming June 11</div>
          <div style={{fontSize:11,fontWeight:700,color:'var(--highlight)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:10}}>☀️ Morning Briefing</div>
          <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(22px,5vw,32px)',color:'var(--bg)',lineHeight:1.1,marginBottom:12}}>
            Your daily WC2026 update — ready every morning
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:16}}>
            {[
              {icon:'⚽',label:"Yesterday's goals & results",sub:'Full match recap'},
              {icon:'📊',label:"Leaderboard shake-up",sub:'Who gained / lost spots'},
              {icon:'🔮',label:'Match of the day preview',sub:'AI win probability'},
              {icon:'💡',label:'Tip recommendation',sub:'Based on form & stats'},
            ].map(b=>(
              <div key={b.label} style={{background:'rgba(245,240,230,0.05)',border:'1px solid rgba(245,240,230,0.1)',borderRadius:12,padding:'12px 14px',display:'flex',gap:10,alignItems:'flex-start',opacity:0.7}}>
                <span style={{fontSize:18,flexShrink:0}}>{b.icon}</span>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:'var(--bg)',lineHeight:1.3}}>{b.label}</div>
                  <div style={{fontSize:11,color:'var(--text-faint)',marginTop:2}}>{b.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:'rgba(212,193,154,0.12)',border:'1px solid rgba(212,193,154,0.2)',borderRadius:10,padding:'10px 14px',fontSize:12,color:'var(--highlight)'}}>
            🔔 Briefing unlocks when the tournament starts on June 11 — check back every morning during the World Cup!
          </div>
        </div>

        {/* ── BIG RANK BLOCK ── */}
        <div style={{background:'var(--text)',borderRadius:20,padding:'28px 24px',marginBottom:32,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:'-40px',right:'-40px',width:200,height:200,background:'radial-gradient(circle,rgba(212,193,154,0.1) 0%,transparent 60%)',pointerEvents:'none'}}/>
          <div style={{marginBottom:24}}>
            <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.15em',color:'var(--text-faint)',marginBottom:8}}>Your position · updates every goal</div>
            <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:6}}>
              <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(80px,20vw,160px)',lineHeight:0.85,background:'linear-gradient(180deg,#f5f0e6 0%,#d4c19a 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                {profileLoaded?(myRank??'—'):'…'}
              </div>
              {myRank&&<div style={{fontFamily:'Bebas Neue',fontSize:'clamp(28px,7vw,44px)',color:'var(--highlight)',lineHeight:1,opacity:0.85}}>{suffix}</div>}
              {myRank&&<div style={{fontSize:13,color:'var(--text-faint)',fontWeight:500}}>of {leaderboard.filter(e=>e.status==='active').length}</div>}
            </div>
            <div style={{fontSize:18,fontWeight:700,color:'var(--bg)'}}>
              {profileLoaded?profile?.display_name:'…'}
              <span style={{color:'var(--text-faint)',fontWeight:400,fontSize:14,marginLeft:8}}>· {myPts+myDelta} pts{myDelta>0?` (+${myDelta} live)`:''}</span>
            </div>
          </div>

          {/* Stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,paddingBottom:20,borderBottom:'1px solid rgba(245,240,230,0.1)',marginBottom:20}}>
            {[
              {val:myDelta>0?`+${myDelta}`:'N/A',label:'Live pts',dim:myDelta===0},
              {val:above?`${ptsBehind}`:'N/A',label:'Pts to top',dim:!above},
              {val:profile?.total_points??0,label:'Total pts'},
            ].map((s,i)=>(
              <div key={i}>
                <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(32px,8vw,52px)',lineHeight:1,marginBottom:4,color:s.dim?'rgba(245,240,230,0.25)':'var(--highlight)'}}>{s.val}</div>
                <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-faint)'}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Insights 2×2 */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
            {/* Projected prize */}
            <div style={{background:'rgba(212,193,154,0.1)',border:'1px solid rgba(212,193,154,0.2)',borderRadius:14,padding:'14px'}}>
              <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.12em',color:'var(--text-faint)',marginBottom:10,fontWeight:600}}>Projected prize</div>
              <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(20px,5vw,36px)',color:'var(--highlight)',lineHeight:1,marginBottom:4}}>
                {myRank&&myRank<=3?`CHF ${prizes[myRank-1]}`:'—'}
              </div>
              <div style={{fontSize:11,color:'var(--text-faint)'}}>{myRank&&myRank<=3?`${[60,25,15][myRank-1]}% of pool`:'Top 3 to win'}</div>
            </div>

            {/* Projected final rank — NEW */}
            <div style={{background:'rgba(245,240,230,0.06)',border:'1px solid rgba(245,240,230,0.1)',borderRadius:14,padding:'14px'}}>
              <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.12em',color:'var(--text-faint)',marginBottom:10,fontWeight:600}}>Projected finish</div>
              <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(20px,5vw,34px)',color:'var(--highlight)',lineHeight:1,marginBottom:4}}>
                {projectedRank}
              </div>
              <div style={{fontSize:11,color:'var(--text-faint)'}}>
                {gamesFinished>0?`At current ${Math.round(myPts/Math.max(gamesFinished,1))} pts/game pace`:'No games played yet'}
              </div>
            </div>

            {/* Tips today */}
            <div style={{background:'rgba(245,240,230,0.04)',border:'1px solid rgba(245,240,230,0.08)',borderRadius:14,padding:'14px'}}>
              <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.12em',color:'var(--text-faint)',marginBottom:10,fontWeight:600}}>Today's tips</div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <svg width={40} height={40} style={{transform:'rotate(-90deg)',flexShrink:0}}>
                  <circle cx={20} cy={20} r={16} fill="none" stroke="rgba(245,240,230,0.12)" strokeWidth={3}/>
                  <circle cx={20} cy={20} r={16} fill="none" stroke="var(--highlight)" strokeWidth={3} strokeLinecap="round" strokeDasharray={`${totalScheduled>0?tippedScheduled/totalScheduled*100:0} 100`}/>
                  <text x={20} y={20} textAnchor="middle" dominantBaseline="central" style={{transform:'rotate(90deg)',transformOrigin:'20px 20px',fill:'var(--bg)',fontFamily:'Bebas Neue',fontSize:13}}>{tippedScheduled}/{totalScheduled}</text>
                </svg>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:tippedScheduled<totalScheduled?'var(--highlight)':'#b8d4a8',marginBottom:2}}>
                    {tippedScheduled<totalScheduled?`${totalScheduled-tippedScheduled} left`:'All done!'}
                  </div>
                  <div style={{fontSize:11,color:'var(--text-faint)'}}>upcoming</div>
                </div>
              </div>
            </div>

            {/* Accuracy */}
            <div style={{background:'rgba(245,240,230,0.04)',border:'1px solid rgba(245,240,230,0.08)',borderRadius:14,padding:'14px'}}>
              <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.12em',color:'var(--text-faint)',marginBottom:10,fontWeight:600}}>Accuracy</div>
              <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(24px,6vw,40px)',color:'var(--highlight)',lineHeight:1,marginBottom:4}}>
                {(profile?.exact_count??0)+(profile?.tendency_count??0)>0
                  ?`${Math.round((profile.exact_count+(profile.tendency_count*0.5))/((profile.exact_count??0)+(profile.tendency_count??0))*100)}%`
                  :'N/A'}
              </div>
              <div style={{fontSize:11,color:'var(--text-faint)'}}>{(profile?.exact_count??0)>0?`${profile.exact_count} exact · ${profile.tendency_count} partial`:'No finished games yet'}</div>
            </div>
          </div>

          {above&&(
            <div style={{background:'rgba(245,240,230,0.05)',border:'1px solid rgba(245,240,230,0.1)',borderRadius:14,padding:'12px 16px',marginTop:16,display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:28,height:28,background:'var(--highlight)',color:'var(--text)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,flexShrink:0}}>!</div>
              <div style={{fontSize:13,lineHeight:1.4}}>
                <strong style={{color:'var(--highlight)'}}>{ptsBehind} pts behind {above.display_name}</strong>
                <span style={{color:'var(--text-faint)',display:'block',fontSize:11,marginTop:2}}>nail the next match to close the gap</span>
              </div>
            </div>
          )}
          {!above&&myRank===1&&(
            <div style={{background:'rgba(212,193,154,0.12)',border:'1px solid rgba(212,193,154,0.25)',borderRadius:14,padding:'12px 16px',marginTop:16,fontSize:13,color:'var(--highlight)',fontWeight:600}}>
              🏆 You're leading! Stay sharp.
            </div>
          )}
        </div>

        {/* ── BONUS PREDICTIONS ── */}
        <div style={{marginBottom:32}}>
          <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(32px,7vw,64px)',lineHeight:0.9,color:'var(--text)'}}>
              Bonus <span style={{color:'var(--beige-deep)'}}>predictions</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {specialSaved&&<span style={{fontSize:12,fontWeight:700,color:'#2d5a1b'}}>✓ Saved!</span>}
              <span style={{fontSize:11,color:'var(--warn)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em'}}>
                {specialPick?.locked?'🔒 Locked':'⏳ Locks June 11'}
              </span>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              {key:'tournament_winner' as const,icon:'🏆',title:'Tournament Winner',sub:'Which country lifts the trophy at MetLife Stadium on July 19?'},
              {key:'top_scorer_nation' as const,icon:'👟',title:"Top Scorer's Nationality",sub:'Which country will the Golden Boot winner come from?'},
            ].map(b=>(
              <div key={b.key} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:14,padding:'16px 18px'}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:'var(--text)',marginBottom:3}}>{b.icon} {b.title}</div>
                    <div style={{fontSize:12,color:'var(--text-faint)',lineHeight:1.5}}>{b.sub}</div>
                  </div>
                  <span style={{background:'rgba(74,122,58,0.12)',border:'1px solid rgba(74,122,58,0.25)',color:'#2d5a1b',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:100,flexShrink:0,marginLeft:12}}>+20 pts</span>
                </div>
                <select
                  value={specialPick?.[b.key]??''}
                  onChange={e=>!specialPick?.locked&&saveSpecialPick(b.key,e.target.value)}
                  disabled={isPending||specialPick?.locked||savingSpecial}
                  style={{width:'100%',background:'var(--bg-card-2)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 12px',fontSize:13,fontWeight:500,color:specialPick?.[b.key]?'var(--text)':'var(--text-faint)',cursor:isPending||specialPick?.locked?'not-allowed':'pointer',fontFamily:'Inter Tight',opacity:isPending?0.5:1}}>
                  <option value="">— Select a team —</option>
                  {ALL_48.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                {specialPick?.[b.key]&&(
                  <div style={{fontSize:11,color:'var(--beige-deep)',marginTop:6,fontWeight:600}}>
                    ✓ You picked: {specialPick[b.key]}
                    {!specialPick.locked&&<span style={{color:'var(--text-faint)',fontWeight:400,marginLeft:6}}>· changeable until June 11</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── LEADERBOARD ── */}
        <div style={{marginBottom:32}}>
          <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(36px,8vw,72px)',lineHeight:0.9,color:'var(--text)'}}>
              The <span style={{color:'var(--beige-deep)'}}>standings</span>
            </div>
            <Link href="/leaderboard" style={{fontSize:12,fontWeight:600,color:'var(--text-dim)',textDecoration:'none',textTransform:'uppercase',letterSpacing:'0.08em',borderBottom:'1px solid var(--border)',paddingBottom:1}}>View all →</Link>
          </div>
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden'}}>
            <div style={{borderBottom:'1px solid var(--border)',background:'var(--bg-card-2)'}}>
              <div style={{display:'grid',gridTemplateColumns:'44px 1fr 80px 56px',gap:8,padding:'10px 16px',fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-faint)',fontWeight:600}}>
                <div>#</div><div>Player</div><div>Pts</div><div style={{textAlign:'right'}}>Live</div>
              </div>
            </div>
            {leaderboard.slice(0,5).map((e)=>{
              const rank=Number(e.rank)
              const isMe=e.id===profile?.id
              const isPend=e.status==='pending'
              const rankColor=isPend?'var(--text-faint)':rank===1?'var(--text)':rank===2?'var(--beige-deep)':rank===3?'var(--beige-mid)':'var(--text-faint)'
              return(
                <div key={e.id} style={{display:'grid',gridTemplateColumns:'44px 1fr 80px 56px',gap:8,padding:'13px 16px',alignItems:'center',borderBottom:'1px solid var(--border)',background:isMe?'linear-gradient(90deg,rgba(26,24,20,0.04) 0%,transparent 100%)':isPend?'var(--bg-card-2)':'transparent',position:'relative',opacity:isPend?0.55:1}}>
                  {isMe&&<div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:'var(--text)'}}/>}
                  <div style={{fontFamily:'Bebas Neue',fontSize:22,color:rankColor}}>{isPend?'—':String(rank).padStart(2,'0')}</div>
                  <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                    <div style={{width:32,height:32,borderRadius:'50%',background:isMe?'var(--text)':isPend?'var(--border)':'var(--bg-elev)',border:`1px solid ${isMe?'var(--text)':'var(--border)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12,color:isMe?'var(--bg)':'var(--text-dim)',flexShrink:0}}>
                      {e.display_name.substring(0,2).toUpperCase()}
                    </div>
                    <div style={{fontWeight:600,fontSize:13,color:isPend?'var(--text-dim)':'var(--text)',display:'flex',alignItems:'center',gap:5,minWidth:0,flexWrap:'wrap'}}>
                      <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.display_name}</span>
                      {isMe&&<span style={{fontSize:9,background:'var(--text)',color:'var(--bg)',padding:'1px 5px',borderRadius:4,fontWeight:700,flexShrink:0}}>YOU</span>}
                      {isPend&&<span style={{fontSize:9,background:'var(--border)',color:'var(--text-faint)',padding:'1px 5px',borderRadius:4,fontWeight:700,flexShrink:0,textTransform:'uppercase'}}>Pending</span>}
                    </div>
                  </div>
                  <div style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:14,color:isPend?'var(--text-faint)':'var(--text)'}}>{isPend?'—':e.total_points}</div>
                  <div style={{textAlign:'right',fontFamily:'JetBrains Mono',fontSize:12,fontWeight:700,color:e.delta>0?'var(--warn)':'var(--text-faint)'}}>{e.delta>0?`+${e.delta}`:'—'}</div>
                </div>
              )
            })}
            <div style={{padding:'12px 20px',textAlign:'center',borderTop:'1px solid var(--border)',background:'var(--bg-card-2)'}}>
              <Link href="/leaderboard" style={{color:'var(--text)',textDecoration:'none',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em'}}>View all {leaderboard.length} players →</Link>
            </div>
          </div>
        </div>


        {/* ── MORNING BRIEFING ── */}
        <div style={{marginBottom:32}}>
          <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(32px,7vw,60px)',lineHeight:0.9,color:'var(--text)'}}>
              ☀️ Morning <span style={{color:'var(--beige-deep)'}}>briefing</span>
            </div>
            <span style={{fontSize:11,color:'var(--text-faint)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em'}}>Updated daily · June 11</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[
              {label:"Yesterday's results",icon:'⚽',value:'France 2–1 Senegal · Brazil 3–0 Scotland · Germany 1–1 Sweden',live:true},
              {label:"Leaderboard shake-up",icon:'📊',value:'Marco R. moved up 2 spots after France win · you gained 1 place · Lisa B. dropped to 5th',live:true},
              {label:"Today's matches",icon:'🗓',value:'USA vs Paraguay · 01:00 ZRH · Netherlands vs Iran · 19:00 ZRH · Spain vs Austria · 02:00 ZRH',live:true},
              {label:"Tip of the day",icon:'💡',value:'France to win vs Senegal is the crowd favourite (62%) — but Morocco at 3–1 odds is the bold call.',live:false},
            ].map(b=>(
              <div key={b.label} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12,padding:'12px 16px',display:'flex',gap:12,alignItems:'flex-start'}}>
                <span style={{fontSize:18,flexShrink:0,marginTop:1}}>{b.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,fontWeight:700,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:3,display:'flex',alignItems:'center',gap:6}}>
                    {b.label}
                    {b.live&&<span style={{width:5,height:5,background:'var(--warn)',borderRadius:'50%',display:'inline-block',animation:'pulsewarn 2s infinite'}}/>}
                  </div>
                  <div style={{fontSize:13,color:'var(--text)',lineHeight:1.5}}>{b.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:'rgba(139,122,94,0.1)',border:'1px solid rgba(139,122,94,0.2)',borderRadius:12,padding:'10px 16px',fontSize:12,color:'var(--beige-deep)',marginTop:8}}>
            🔔 Full briefing unlocks when the tournament starts on June 11 — check back every morning!
          </div>
        </div>

        {/* ── FIFA NEWS ── */}
        <div style={{marginBottom:32}}>
          <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(32px,7vw,60px)',lineHeight:0.9,color:'var(--text)'}}>
              WC <span style={{color:'var(--beige-deep)'}}>news</span>
            </div>
            <a href="https://www.fifa.com" target="_blank" rel="noreferrer" style={{fontSize:12,fontWeight:600,color:'var(--text-dim)',textDecoration:'none',textTransform:'uppercase',letterSpacing:'0.08em',borderBottom:'1px solid var(--border)',paddingBottom:1}}>FIFA.com →</a>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[
              {tag:'Preview',  h:'Mexico vs South Africa: The opening match of the biggest World Cup in history', t:'3h ago', feature:true},
              {tag:'Official', h:'Record 5.8 million tickets sold — WC 2026 set to be the most-watched sporting event ever', t:'6h ago'},
              {tag:'Team News',h:'France confirm Mbappé in starting XI for opener against Senegal', t:'8h ago'},
              {tag:'Stadiums', h:'A guide to all 16 World Cup venues — from MetLife to Estadio Azteca', t:'1d ago'},
            ].map((n,i)=>(
              <a key={i} href="https://www.fifa.com" target="_blank" rel="noreferrer"
                style={{background:n.feature?'var(--bg-elev)':'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12,padding:'14px 16px',textDecoration:'none',color:'var(--text)',display:'flex',gap:10,alignItems:'flex-start',transition:'border-color 0.15s'}}
                onMouseEnter={e=>(e.currentTarget as HTMLAnchorElement).style.borderColor='var(--border-strong)'}
                onMouseLeave={e=>(e.currentTarget as HTMLAnchorElement).style.borderColor='var(--border)'}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                    <span style={{background:'var(--text)',color:'var(--bg)',fontSize:9,textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:700,padding:'2px 7px',borderRadius:4}}>{n.tag}</span>
                    <span style={{fontSize:11,color:'var(--text-faint)'}}>{n.t}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:600,lineHeight:1.4,color:'var(--text)'}}>{n.h}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ── MATCHES TO TIP ── */}
        <div style={{marginBottom:32}}>
          <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(36px,8vw,72px)',lineHeight:0.9,color:'var(--text)'}}>
              Tip the <span style={{color:'var(--beige-deep)'}}>matches</span>
            </div>
            <Link href="/games" style={{fontSize:12,fontWeight:600,color:'var(--text-dim)',textDecoration:'none',textTransform:'uppercase',letterSpacing:'0.08em',borderBottom:'1px solid var(--border)',paddingBottom:1}}>All 104 →</Link>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {games.filter(g=>g.status!=='finished').slice(0,5).map((game)=>{
              const tip=tips[game.id]
              const inp=tipInputs[game.id]??{h:'',a:''}
              const isClosed=game.status!=='scheduled'
              const isLive=game.status==='live'
              const {time,short}=fmtDT(new Date(game.kickoff).getTime(),tz)
              return(
                <div key={game.id} style={{background:'var(--bg-card)',border:`1px solid ${isLive?'rgba(154,74,42,0.4)':'var(--border)'}`,borderRadius:14,padding:'16px 18px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:6}}>
                    <span style={{background:'var(--bg-elev)',padding:'3px 8px',borderRadius:5,fontSize:10,fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{game.group_stage}</span>
                    {isLive?<span style={{display:'inline-flex',alignItems:'center',gap:5,color:'var(--warn)',fontWeight:700,fontSize:11}}><span style={{width:5,height:5,background:'var(--warn)',borderRadius:'50%',animation:'pulsewarn 1.5s infinite',display:'inline-block'}}/>LIVE {game.minute}'</span>
                    :<span style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:11,color:'var(--text-dim)'}}>{short} · {time}</span>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                    <div style={{flex:1,display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontSize:28}}>{game.home_flag}</span>
                      <div style={{fontWeight:700,fontSize:14,color:'var(--text)'}}>{game.home_team}</div>
                    </div>
                    {isClosed
                      ?<div style={{fontFamily:'Bebas Neue',fontSize:24,color:isLive?'var(--warn)':'var(--text)',background:isLive?'rgba(154,74,42,0.1)':'var(--bg-elev)',padding:'4px 12px',borderRadius:8,flexShrink:0}}>{game.home_score??0}:{game.away_score??0}</div>
                      :<div style={{fontFamily:'Bebas Neue',fontSize:14,color:'var(--text-faint)',flexShrink:0}}>VS</div>}
                    <div style={{flex:1,display:'flex',alignItems:'center',gap:10,flexDirection:'row-reverse',textAlign:'right'}}>
                      <span style={{fontSize:28}}>{game.away_flag}</span>
                      <div style={{fontWeight:700,fontSize:14,color:'var(--text)'}}>{game.away_team}</div>
                    </div>
                  </div>
                  <div style={{background:'var(--bg-card-2)',border:'1px solid var(--border)',borderRadius:12,padding:'12px 14px'}}>
                    <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-faint)',marginBottom:8,display:'flex',justifyContent:'space-between'}}>
                      <span>Your prediction</span>
                      {tip&&!isClosed&&<span style={{color:'var(--beige-deep)'}}>Current: {tip.tip_home}:{tip.tip_away}</span>}
                    </div>
                    {isClosed?(
                      <div style={{textAlign:'center',padding:'4px 0',fontSize:13,color:'var(--text-faint)'}}>
                        {tip?<><span style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:16,color:'var(--text)'}}>{tip.tip_home}:{tip.tip_away}</span>{tip.points!=null&&<span style={{marginLeft:8,fontSize:11,fontWeight:700,fontFamily:'JetBrains Mono',background:tip.points===10?'rgba(74,122,58,0.15)':tip.points>0?'rgba(212,193,154,0.25)':'rgba(163,152,130,0.12)',color:tip.points===10?'#2d5a1b':tip.points>0?'var(--beige-deep)':'var(--text-faint)',padding:'2px 8px',borderRadius:6}}>+{tip.points} pts</span>}</>:<span>{isLive?'⏳ Locked':'No tip'}</span>}
                      </div>
                    ):(
                      <>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:10}}>
                          {(['h','a'] as const).map(side=>(
                            <input key={side} type="number" min={0} max={20} value={side==='h'?inp.h:inp.a} placeholder="0"
                              onChange={e=>setTipInputs(t=>({...t,[game.id]:side==='h'?{...inp,h:e.target.value}:{...inp,a:e.target.value}}))}
                              disabled={isPending}
                              style={{width:52,height:50,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,fontFamily:'Bebas Neue',fontSize:28,textAlign:'center',color:'var(--text)',outline:'none',opacity:isPending?0.4:1}}/>
                          ))}
                        </div>
                        <button onClick={()=>saveTip(game.id)} disabled={saving[game.id]||isPending}
                          style={{width:'100%',padding:'10px',background:saved[game.id]?'transparent':'var(--text)',color:saved[game.id]?'var(--text)':'var(--bg)',border:saved[game.id]?'1px solid var(--text)':'none',borderRadius:10,fontWeight:700,fontSize:12,textTransform:'uppercase',letterSpacing:'0.08em',cursor:isPending?'not-allowed':'pointer',transition:'all 0.2s'}}>
                          {saving[game.id]?'…':saved[game.id]?'✓ Saved!':tip?'Update tip':'Save tip'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── POINTS SYSTEM ── */}
        <div style={{marginBottom:16}}>
          <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(36px,8vw,64px)',lineHeight:0.9,color:'var(--text)',marginBottom:16}}>
            How you <span style={{color:'var(--beige-deep)'}}>score</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
            {[
              {n:'5',name:'Correct winner',desc:'Right outcome or draw'},
              {n:'3',name:'Goal difference',desc:'e.g. tip 2–0, actual 3–1'},
              {n:'1',name:'Exact team goals',desc:'1 pt per team you got right'},
              {n:'20',name:'Bonus picks',desc:'Winner & top scorer nation',dark:true},
            ].map((c,i)=>(
              <div key={i} style={{padding:'18px',borderRadius:14,background:c.dark?'var(--text)':'var(--bg-card)',border:`1px solid ${c.dark?'var(--text)':'var(--border)'}`}}>
                <div style={{fontFamily:'Bebas Neue',fontSize:44,lineHeight:0.9,marginBottom:4,color:c.dark?'var(--highlight)':'var(--text)'}}>{c.n}</div>
                <div style={{fontWeight:700,fontSize:13,marginBottom:2,color:c.dark?'var(--bg)':'var(--text)'}}>{c.name}</div>
                <div style={{fontSize:11,color:c.dark?'var(--text-faint)':'var(--text-dim)'}}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer style={{borderTop:'1px solid var(--border)',padding:'24px 20px',display:'flex',flexDirection:'column',alignItems:'center',gap:8,fontSize:12,color:'var(--text-faint)',textAlign:'center'}}>
        <div style={{fontSize:18,fontWeight:300,letterSpacing:'0.05em',color:'var(--text)',fontFamily:'Inter Tight, sans-serif'}}>m1c1</div>
        <div style={{fontSize:8,fontWeight:600,color:'var(--text-faint)',letterSpacing:'0.12em',textTransform:'uppercase'}}>World Cup 2026</div>
        <div>CHF {pool} pool · {totalActive} players</div>
      </footer>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.85)}}
        @keyframes pulsewarn{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(154,74,42,0.5)}50%{opacity:0.9;box-shadow:0 0 0 8px transparent}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        @media(max-width:768px){.hide-mobile{display:none!important}.show-mobile{display:flex!important}}
        @media(min-width:769px){.show-mobile{display:none!important}}
      `}</style>
    </div>
  )
}
