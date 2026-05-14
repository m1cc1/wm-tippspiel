'use client'
import { useEffect, useState, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import { createBrowserClient } from '@/lib/supabase'
import type { Game, Tip } from '@/lib/types'

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const TZ_OPTIONS = [
  {label:'🇺🇸 Los Angeles (UTC−7)',offset:-7},
  {label:'🇲🇽 Mexico City (UTC−6)',offset:-6},
  {label:'🇺🇸 New York (UTC−5)',offset:-5},
  {label:'🇧🇷 São Paulo (UTC−4)',offset:-4},
  {label:'🇬🇧 London (UTC+0)',offset:0},
  {label:'🇨🇭 Zurich (UTC+1)',offset:1},
  {label:'🇬🇷 Athens (UTC+2)',offset:2},
  {label:'🇨🇳 Beijing (UTC+8)',offset:8},
  {label:'🇯🇵 Tokyo (UTC+9)',offset:9},
]

function fmtDT(iso: string, tz: number) {
  const d = new Date(new Date(iso).getTime() + tz*3_600_000)
  return {
    time:`${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`,
    date:`${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`,
  }
}

function PtsBadge({pts}:{pts:number}) {
  const cfg = pts===10
    ? {bg:'rgba(184,212,168,0.2)',color:'#1a3a1a',border:'1px solid rgba(184,212,168,0.4)',text:'+10 perfect ⭐'}
    : pts>0
    ? {bg:'rgba(212,193,154,0.2)',color:'var(--beige-deep)',border:'1px solid rgba(212,193,154,0.4)',text:`+${pts} pts`}
    : {bg:'rgba(163,152,130,0.15)',color:'var(--text-faint)',border:'1px solid rgba(163,152,130,0.2)',text:'+0 pts'}
  return <span style={{...cfg,fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:6,fontFamily:'JetBrains Mono'}}>{cfg.text}</span>
}

export default function GamesPage() {
  const supabase = createBrowserClient()
  const [tz, setTz] = useState(1)
  const [games, setGames] = useState<Game[]>([])
  const [tips, setTips] = useState<Record<string,Tip>>({})
  const [userEmail, setUserEmail] = useState<string|null>(null)
  const [displayName, setDisplayName] = useState<string|null>(null)
  const [userId, setUserId] = useState<string|null>(null)
  const [isActive, setIsActive] = useState(false)
  const [saving, setSaving] = useState<Record<string,boolean>>({})
  const [saved, setSaved] = useState<Record<string,boolean>>({})
  const [tipInputs, setTipInputs] = useState<Record<string,{h:string,a:string}>>({})
  const [toast, setToast] = useState('')

  function showToast(msg:string){setToast(msg);setTimeout(()=>setToast(''),2500)}

  const load = useCallback(async (uid: string) => {
    const [{data:gData},{data:tData}] = await Promise.all([
      supabase.from('games').select('*').order('kickoff',{ascending:true}),
      supabase.from('tips').select('*').eq('user_id',uid),
    ])
    setGames(gData??[])
    const tipMap:Record<string,Tip>={}, inputMap:Record<string,{h:string,a:string}>={}
    for (const t of (tData??[])) { tipMap[t.game_id]=t; inputMap[t.game_id]={h:String(t.tip_home),a:String(t.tip_away)} }
    setTips(tipMap); setTipInputs(inputMap)
  },[supabase])

  useEffect(()=>{
    supabase.auth.getUser().then(async({data})=>{
      const uid=data.user?.id??null
      setUserId(uid); setUserEmail(data.user?.email??null)
      if (uid) {
        load(uid)
        const {data:prof}=await supabase.from('profiles').select('status,display_name').eq('id',uid).single()
        setIsActive(prof?.status==='active')
        setDisplayName(prof?.display_name??null)
      }
    })
  },[load,supabase])

  async function saveTip(gameId:string) {
    if (!userId||!isActive){showToast('⏳ Account pending activation');return}
    const inp=tipInputs[gameId]
    if (!inp||inp.h===''||inp.a==='') return
    const tipHome=parseInt(inp.h),tipAway=parseInt(inp.a)
    if (isNaN(tipHome)||isNaN(tipAway)) return
    setSaving(s=>({...s,[gameId]:true}))
    const existing=tips[gameId]
    if (existing) await supabase.from('tips').update({tip_home:tipHome,tip_away:tipAway}).eq('id',existing.id)
    else await supabase.from('tips').insert({user_id:userId,game_id:gameId,tip_home:tipHome,tip_away:tipAway})
    setSaving(s=>({...s,[gameId]:false}))
    setSaved(s=>({...s,[gameId]:true}))
    setTimeout(()=>setSaved(s=>({...s,[gameId]:false})),2500)
    if (userId) load(userId)
  }

  // Group by date
  const grouped: Record<string,Game[]> = {}
  games.forEach(g=>{
    const {date}=fmtDT(g.kickoff,tz)
    if (!grouped[date]) grouped[date]=[]
    grouped[date].push(g)
  })

  return (
    <div style={{background:'var(--bg)',minHeight:'100vh'}}>
      {toast && <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',zIndex:200,background:'var(--text)',color:'var(--bg)',padding:'12px 24px',borderRadius:100,fontSize:13,fontWeight:600,boxShadow:'0 8px 24px rgba(26,24,20,0.2)',whiteSpace:'nowrap'}}>{toast}</div>}

      <Navbar userEmail={userEmail} displayName={displayName}/>

      <div style={{maxWidth:1400,margin:'0 auto',padding:'48px 32px'}}>
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:32,flexWrap:'wrap',gap:16}}>
          <div>
            <h1 style={{fontFamily:'Bebas Neue',fontSize:'clamp(56px,7vw,96px)',lineHeight:0.9,color:'var(--text)'}}>
              All <span style={{color:'var(--beige-deep)'}}>matches</span>
            </h1>
            <div style={{fontSize:14,color:'var(--text-dim)',marginTop:8}}>
              {isActive ? 'Enter your prediction before each kickoff · up to 10 pts per game' : '⏳ Activate your account to start predicting'}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:12,fontWeight:600,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.08em'}}>Timezone</span>
            <select value={tz} onChange={e=>setTz(Number(e.target.value))}
              style={{fontSize:12,border:'1px solid var(--border)',borderRadius:100,padding:'8px 16px',background:'transparent',color:'var(--text-dim)',cursor:'pointer',fontFamily:'Inter Tight',fontWeight:500}}>
              {TZ_OPTIONS.map(o=><option key={o.offset} value={o.offset}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Points reminder */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden',marginBottom:40}}>
          {[{n:'5',l:'Correct winner'},{n:'3',l:'Goal difference'},{n:'1',l:'Goals per team'},{n:'10',l:'Max per game',dark:true}].map((c,i)=>(
            <div key={i} style={{padding:'20px 24px',borderRight:i<3?'1px solid var(--border)':'none',background:c.dark?'var(--text)':'transparent',textAlign:'center'}}>
              <div style={{fontFamily:'Bebas Neue',fontSize:44,lineHeight:1,color:c.dark?'var(--highlight)':'var(--text)',marginBottom:4}}>{c.n}</div>
              <div style={{fontSize:12,color:c.dark?'var(--text-faint)':'var(--text-dim)',fontWeight:500}}>{c.l}</div>
            </div>
          ))}
        </div>

        {!isActive && (
          <div style={{background:'#fffbf0',border:'2px solid #f0dfa0',borderRadius:16,padding:'16px 24px',fontSize:13,color:'#92730a',marginBottom:32}}>
            <strong>⏳ Account pending</strong> — send CHF 20 via Twint to <strong>+41 79 425 64 77</strong> with message <code style={{background:'#fef3c7',padding:'1px 6px',borderRadius:4,fontFamily:'JetBrains Mono',fontWeight:700}}>WC2026</code>. Predictions unlock within 24h.
          </div>
        )}

        {Object.entries(grouped).map(([date,dayGames])=>(
          <div key={date} style={{marginBottom:40}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:16,display:'flex',alignItems:'center',gap:12}}>
              {date}<div style={{flex:1,height:1,background:'var(--border)'}}/>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {dayGames.map(game=>{
                const tip=tips[game.id]
                const inp=tipInputs[game.id]??{h:'',a:''}
                const isClosed=game.status!=='scheduled'
                const {time}=fmtDT(game.kickoff,tz)
                const isLive=game.status==='live'
                return (
                  <div key={game.id} style={{background:'var(--bg-card)',border:`1px solid ${isLive?'rgba(154,74,42,0.4)':'var(--border)'}`,borderRadius:16,padding:'20px 24px',transition:'all 0.2s'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{background:'var(--bg-elev)',padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:600,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{game.group_stage}</span>
                        {isLive && <span style={{display:'inline-flex',alignItems:'center',gap:6,color:'var(--warn)',fontWeight:700,fontSize:12,textTransform:'uppercase',letterSpacing:'0.08em'}}><span style={{width:6,height:6,background:'var(--warn)',borderRadius:'50%',animation:'pulsewarn 1.5s infinite',display:'inline-block'}}/>LIVE {game.minute}'</span>}
                        {game.status==='finished' && <span style={{fontSize:11,color:'var(--text-faint)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em'}}>Full time</span>}
                        {game.status==='scheduled' && <span style={{fontSize:12,fontWeight:700,color:'var(--text-dim)',fontFamily:'JetBrains Mono'}}>{time}</span>}
                      </div>
                      {game.venue && <span style={{fontSize:12,color:'var(--text-faint)'}}>{game.venue}</span>}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:24,marginBottom:16}}>
                      <div style={{flex:1,display:'flex',alignItems:'center',gap:14,justifyContent:'flex-end'}}>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontWeight:700,fontSize:16,color:'var(--text)'}}>{game.home_team}</div>
                        </div>
                        <span style={{fontSize:36}}>{game.home_flag}</span>
                      </div>
                      <div style={{minWidth:72,textAlign:'center'}}>
                        {isClosed
                          ? <div style={{fontFamily:'Bebas Neue',fontSize:28,color:isLive?'var(--warn)':'var(--text)',background:isLive?'rgba(154,74,42,0.1)':'var(--bg-elev)',padding:'6px 14px',borderRadius:10}}>{game.home_score??0}:{game.away_score??0}</div>
                          : <div style={{fontFamily:'Bebas Neue',fontSize:18,color:'var(--text-faint)'}}>VS</div>
                        }
                      </div>
                      <div style={{flex:1,display:'flex',alignItems:'center',gap:14}}>
                        <span style={{fontSize:36}}>{game.away_flag}</span>
                        <div>
                          <div style={{fontWeight:700,fontSize:16,color:'var(--text)'}}>{game.away_team}</div>
                        </div>
                      </div>
                    </div>
                    {/* Tip row */}
                    <div style={{borderTop:'1px solid var(--border)',paddingTop:16,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                      <span style={{fontSize:12,fontWeight:600,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.08em',flex:1}}>Your prediction</span>
                      {isClosed ? (
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <span style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:16,color:tip?'var(--text)':'var(--text-faint)'}}>{tip?`${tip.tip_home}:${tip.tip_away}`:'—'}</span>
                          {tip&&tip.points!=null&&<PtsBadge pts={tip.points}/>}
                          {!tip&&<span style={{fontSize:12,color:'var(--text-faint)'}}>No tip entered</span>}
                        </div>
                      ):(
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <input type="number" min={0} max={20} value={inp.h} placeholder="0" disabled={!isActive}
                            onChange={e=>setTipInputs(t=>({...t,[game.id]:{...inp,h:e.target.value}}))}
                            style={{width:52,height:52,background:'var(--bg-card-2)',border:'1px solid var(--border)',borderRadius:10,fontFamily:'Bebas Neue',fontSize:28,textAlign:'center',color:'var(--text)',outline:'none',opacity:!isActive?0.4:1}}/>
                          <span style={{fontFamily:'Bebas Neue',fontSize:24,color:'var(--text-faint)'}}>—</span>
                          <input type="number" min={0} max={20} value={inp.a} placeholder="0" disabled={!isActive}
                            onChange={e=>setTipInputs(t=>({...t,[game.id]:{...inp,a:e.target.value}}))}
                            style={{width:52,height:52,background:'var(--bg-card-2)',border:'1px solid var(--border)',borderRadius:10,fontFamily:'Bebas Neue',fontSize:28,textAlign:'center',color:'var(--text)',outline:'none',opacity:!isActive?0.4:1}}/>
                          {isActive&&(
                            <button onClick={()=>saveTip(game.id)} disabled={saving[game.id]}
                              style={{padding:'10px 20px',background:saved[game.id]?'transparent':'var(--text)',color:saved[game.id]?'var(--text)':'var(--bg)',border:saved[game.id]?'1px solid var(--text)':'1px solid var(--text)',borderRadius:10,fontWeight:700,fontSize:12,textTransform:'uppercase',letterSpacing:'0.08em',cursor:'pointer',transition:'all 0.2s'}}>
                              {saving[game.id]?'…':saved[game.id]?'✓ Saved':tip?'Update':'Save'}
                            </button>
                          )}
                          {tip&&!saved[game.id]&&<span style={{fontSize:12,color:'var(--text-faint)',fontFamily:'JetBrains Mono'}}>Current: {tip.tip_home}:{tip.tip_away}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {games.length===0&&<div style={{textAlign:'center',padding:64,color:'var(--text-faint)',fontSize:14}}>Games will appear here once the schedule is loaded.</div>}
      </div>
      <style>{`
        @keyframes pulsewarn{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(154,74,42,0.5)}50%{opacity:0.9;box-shadow:0 0 0 8px transparent}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.85)}}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
      `}</style>
    </div>
  )
}
