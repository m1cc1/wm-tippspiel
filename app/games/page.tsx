'use client'
import { useEffect, useState, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import { createBrowserClient } from '@/lib/supabase'
import type { Game, Tip } from '@/lib/types'

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const TZ_OPTIONS = [
  {label:'🇺🇸 LA −7',offset:-7},{label:'🇲🇽 MEX −6',offset:-6},
  {label:'🇺🇸 NYC −5',offset:-5},{label:'🇧🇷 SAO −4',offset:-4},
  {label:'🇬🇧 LON +0',offset:0},{label:'🇨🇭 ZRH +1',offset:1},
  {label:'🇬🇷 ATH +2',offset:2},{label:'🇨🇳 PEK +8',offset:8},
  {label:'🇯🇵 TYO +9',offset:9},
]

const STAGE_FILTERS = [
  { value:'all',          label:'All stages' },
  { value:'group',        label:'Group stage' },
  { value:'knockout',     label:'Knockout stage' },
  { value:'Group A',      label:'Group A' },
  { value:'Group B',      label:'Group B' },
  { value:'Group C',      label:'Group C' },
  { value:'Group D',      label:'Group D' },
  { value:'Group E',      label:'Group E' },
  { value:'Group F',      label:'Group F' },
  { value:'Group G',      label:'Group G' },
  { value:'Group H',      label:'Group H' },
  { value:'Group I',      label:'Group I' },
  { value:'Group J',      label:'Group J' },
  { value:'Group K',      label:'Group K' },
  { value:'Group L',      label:'Group L' },
  { value:'Round of 32',  label:'Round of 32' },
  { value:'Round of 16',  label:'Round of 16' },
  { value:'Quarter-final',label:'Quarter-finals' },
  { value:'Semi-final',   label:'Semi-finals' },
  { value:'Third place',  label:'Third place' },
  { value:'Final',        label:'Final 🏆' },
]

const KNOCKOUT_STAGES = ['Round of 32','Round of 16','Quarter-final','Semi-final','Third place','Final']

const KNOCKOUT_BADGE: Record<string,{bg:string,color:string,label:string}> = {
  'Round of 32':  { bg:'rgba(139,92,246,0.12)',  color:'#6d28d9', label:'Round of 32' },
  'Round of 16':  { bg:'rgba(59,130,246,0.12)',  color:'#1d4ed8', label:'Round of 16' },
  'Quarter-final':{ bg:'rgba(16,185,129,0.12)', color:'#065f46', label:'Quarter-final' },
  'Semi-final':   { bg:'rgba(245,158,11,0.15)',  color:'#92400e', label:'Semi-final' },
  'Third place':  { bg:'rgba(107,114,128,0.12)', color:'#374151', label:'Third place' },
  'Final':        { bg:'rgba(212,193,154,0.25)', color:'#78350f', label:'🏆 Final' },
}

function isKnockout(gs: string) { return KNOCKOUT_STAGES.includes(gs) }

function fmtDT(iso: string, tz: number) {
  const d = new Date(new Date(iso).getTime() + tz * 3_600_000)
  return {
    time: `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`,
    date: `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`,
  }
}

function PtsBadge({pts}:{pts:number}) {
  const cfg = pts===10
    ? {bg:'rgba(74,122,58,0.15)',color:'#2d5a1b',text:'+10 perfect ⭐'}
    : pts>0
    ? {bg:'rgba(212,193,154,0.25)',color:'var(--beige-deep)',text:`+${pts} pts`}
    : {bg:'rgba(163,152,130,0.12)',color:'var(--text-faint)',text:'+0 pts'}
  return <span style={{...cfg,fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:6,fontFamily:'JetBrains Mono',background:cfg.bg,color:cfg.color}}>{cfg.text}</span>
}

function filterGames(games: Game[], filter: string): Game[] {
  if (filter === 'all') return games
  if (filter === 'group') return games.filter(g => !isKnockout(g.group_stage))
  if (filter === 'knockout') return games.filter(g => isKnockout(g.group_stage))
  return games.filter(g => g.group_stage === filter)
}

export default function GamesPage() {
  const supabase = createBrowserClient()
  const [tz, setTz] = useState(1)
  const [stageFilter, setStageFilter] = useState('all')
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

  const filtered = filterGames(games, stageFilter)

  // Group by date
  const grouped: Record<string,Game[]> = {}
  filtered.forEach(g=>{
    const {date}=fmtDT(g.kickoff,tz)
    if (!grouped[date]) grouped[date]=[]
    grouped[date].push(g)
  })

  const groupStageCount = games.filter(g=>!isKnockout(g.group_stage)).length
  const knockoutCount = games.filter(g=>isKnockout(g.group_stage)).length
  const tippedCount = Object.keys(tips).length

  return (
    <div style={{background:'var(--bg)',minHeight:'100vh'}}>
      {toast&&<div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',zIndex:200,background:'var(--text)',color:'var(--bg)',padding:'12px 20px',borderRadius:100,fontSize:13,fontWeight:600,boxShadow:'0 8px 24px rgba(26,24,20,0.2)',whiteSpace:'nowrap'}}>{toast}</div>}

      <Navbar userEmail={userEmail} displayName={displayName}/>

      <div className="page-wrap">
        {/* Header */}
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
          <div>
            <h1 style={{fontFamily:'Bebas Neue',fontSize:'clamp(48px,8vw,88px)',lineHeight:0.9,color:'var(--text)'}}>
              All <span style={{color:'var(--beige-deep)'}}>matches</span>
            </h1>
            <div style={{fontSize:13,color:'var(--text-dim)',marginTop:8}}>
              {groupStageCount} group stage · {knockoutCount} knockout · {tippedCount} tipped
              {!isActive && <span style={{color:'var(--warn)',fontWeight:600,marginLeft:8}}>· activate account to tip</span>}
            </div>
          </div>
          {/* TZ select */}
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span style={{fontSize:11,fontWeight:600,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.08em'}}>TZ</span>
            <select value={tz} onChange={e=>setTz(Number(e.target.value))}
              style={{fontSize:12,border:'1px solid var(--border)',borderRadius:100,padding:'7px 14px',background:'transparent',color:'var(--text-dim)',cursor:'pointer',fontFamily:'Inter Tight',fontWeight:500}}>
              {TZ_OPTIONS.map(o=><option key={o.offset} value={o.offset}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Points reminder strip */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden',marginBottom:24}}>
          {[{n:'5',l:'Correct winner'},{n:'3',l:'Goal diff.'},{n:'1',l:'Goals/team'},{n:'10',l:'Max per game',dark:true}].map((c,i)=>(
            <div key={i} style={{padding:'14px 16px',borderRight:i<3?'1px solid var(--border)':'none',background:c.dark?'var(--text)':'transparent',textAlign:'center'}}>
              <div style={{fontFamily:'Bebas Neue',fontSize:36,lineHeight:1,color:c.dark?'var(--highlight)':'var(--text)',marginBottom:2}}>{c.n}</div>
              <div style={{fontSize:11,color:c.dark?'var(--text-faint)':'var(--text-dim)',fontWeight:500}}>{c.l}</div>
            </div>
          ))}
        </div>

        {/* Stage filter */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:28}}>
          {STAGE_FILTERS.map(f=>(
            <button key={f.value} onClick={()=>setStageFilter(f.value)}
              style={{fontSize:12,fontWeight:600,padding:'7px 14px',borderRadius:100,border:'1px solid var(--border)',background:stageFilter===f.value?'var(--text)':'transparent',color:stageFilter===f.value?'var(--bg)':'var(--text-dim)',cursor:'pointer',transition:'all 0.15s',whiteSpace:'nowrap'}}>
              {f.label}
            </button>
          ))}
        </div>

        {!isActive && (
          <div style={{background:'#fffbf0',border:'2px solid #f0dfa0',borderRadius:14,padding:'14px 20px',fontSize:13,color:'#92730a',marginBottom:24}}>
            <strong>⏳ Account pending</strong> — send CHF 20 via Twint to <strong>+41 79 425 64 77</strong> · message: <code style={{fontFamily:'JetBrains Mono',fontWeight:700,background:'#fef3c7',padding:'1px 5px',borderRadius:4}}>WC2026</code>
          </div>
        )}

        {/* Games grouped by date */}
        {Object.keys(grouped).length === 0 && (
          <div style={{textAlign:'center',padding:64,color:'var(--text-faint)',fontSize:14}}>
            No matches found for this filter.
          </div>
        )}

        {Object.entries(grouped).map(([date, dayGames])=>(
          <div key={date} style={{marginBottom:36}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:14,display:'flex',alignItems:'center',gap:12}}>
              {date}<div style={{flex:1,height:1,background:'var(--border)'}}/>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {dayGames.map(game=>{
                const tip=tips[game.id]
                const inp=tipInputs[game.id]??{h:'',a:''}
                const isClosed=game.status!=='scheduled'
                const isLive=game.status==='live'
                const isKO=isKnockout(game.group_stage)
                const koBadge=isKO?KNOCKOUT_BADGE[game.group_stage]:null
                const {time}=fmtDT(game.kickoff,tz)

                return (
                  <div key={game.id} style={{background:'var(--bg-card)',border:`1px solid ${isLive?'rgba(154,74,42,0.4)':isKO?'rgba(139,92,246,0.2)':'var(--border)'}`,borderRadius:14,padding:'16px 20px'}}>
                    {/* Top row */}
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:6}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                        {isKO && koBadge ? (
                          <span style={{background:koBadge.bg,color:koBadge.color,fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:6,textTransform:'uppercase',letterSpacing:'0.08em'}}>
                            {koBadge.label}
                          </span>
                        ) : (
                          <span style={{background:'var(--bg-elev)',padding:'3px 8px',borderRadius:5,fontSize:11,fontWeight:600,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{game.group_stage}</span>
                        )}
                        {isLive && <span style={{display:'inline-flex',alignItems:'center',gap:5,color:'var(--warn)',fontWeight:700,fontSize:11}}><span style={{width:6,height:6,background:'var(--warn)',borderRadius:'50%',animation:'pulsewarn 1.5s infinite',display:'inline-block'}}/>LIVE {game.minute}'</span>}
                        {game.status==='finished' && <span style={{fontSize:11,color:'var(--text-faint)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'}}>Full time</span>}
                        {game.status==='scheduled' && <span style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:11,color:'var(--text-dim)'}}>{time}</span>}
                      </div>
                      {game.venue && <span style={{fontSize:11,color:'var(--text-faint)'}} className="hide-mobile">{game.venue}</span>}
                    </div>

                    {/* Teams */}
                    <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:14}}>
                      <div style={{flex:1,display:'flex',alignItems:'center',gap:12,justifyContent:'flex-end'}}>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontWeight:700,fontSize:15,color:'var(--text)'}}>{game.home_team}</div>
                        </div>
                        <span style={{fontSize:30}}>{game.home_flag}</span>
                      </div>
                      <div style={{minWidth:68,textAlign:'center'}}>
                        {isClosed
                          ? <div style={{fontFamily:'Bebas Neue',fontSize:26,color:isLive?'var(--warn)':'var(--text)',background:isLive?'rgba(154,74,42,0.1)':'var(--bg-elev)',padding:'4px 12px',borderRadius:10}}>{game.home_score??0}:{game.away_score??0}</div>
                          : <div style={{fontFamily:'Bebas Neue',fontSize:16,color:'var(--text-faint)'}}>VS</div>
                        }
                      </div>
                      <div style={{flex:1,display:'flex',alignItems:'center',gap:12}}>
                        <span style={{fontSize:30}}>{game.away_flag}</span>
                        <div style={{fontWeight:700,fontSize:15,color:'var(--text)'}}>{game.away_team}</div>
                      </div>
                    </div>

                    {/* Tip row */}
                    <div style={{borderTop:'1px solid var(--border)',paddingTop:14,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                      <span style={{fontSize:11,fontWeight:600,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.08em',flex:1}}>Your prediction</span>
                      {isClosed ? (
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:16,color:tip?'var(--text)':'var(--text-faint)'}}>{tip?`${tip.tip_home}:${tip.tip_away}`:'—'}</span>
                          {tip&&tip.points!=null&&<PtsBadge pts={tip.points}/>}
                          {!tip&&<span style={{fontSize:12,color:'var(--text-faint)'}}>No tip entered</span>}
                        </div>
                      ) : (
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <input type="number" min={0} max={20} value={inp.h} placeholder="0" disabled={!isActive}
                            onChange={e=>setTipInputs(t=>({...t,[game.id]:{...inp,h:e.target.value}}))}
                            style={{width:52,height:50,background:'var(--bg-card-2)',border:'1px solid var(--border)',borderRadius:10,fontFamily:'Bebas Neue',fontSize:28,textAlign:'center',color:'var(--text)',outline:'none',opacity:!isActive?0.4:1}}/>
                          <span style={{fontFamily:'Bebas Neue',fontSize:22,color:'var(--text-faint)'}}>—</span>
                          <input type="number" min={0} max={20} value={inp.a} placeholder="0" disabled={!isActive}
                            onChange={e=>setTipInputs(t=>({...t,[game.id]:{...inp,a:e.target.value}}))}
                            style={{width:52,height:50,background:'var(--bg-card-2)',border:'1px solid var(--border)',borderRadius:10,fontFamily:'Bebas Neue',fontSize:28,textAlign:'center',color:'var(--text)',outline:'none',opacity:!isActive?0.4:1}}/>
                          {isActive && (
                            <button onClick={()=>saveTip(game.id)} disabled={saving[game.id]}
                              style={{padding:'10px 18px',background:saved[game.id]?'transparent':'var(--text)',color:saved[game.id]?'var(--text)':'var(--bg)',border:saved[game.id]?'1px solid var(--text)':'none',borderRadius:10,fontWeight:700,fontSize:12,textTransform:'uppercase',letterSpacing:'0.08em',cursor:'pointer',transition:'all 0.2s'}}>
                              {saving[game.id]?'…':saved[game.id]?'✓ Saved':tip?'Update':'Save'}
                            </button>
                          )}
                          {tip&&!saved[game.id]&&<span style={{fontSize:11,color:'var(--text-faint)',fontFamily:'JetBrains Mono'}}>Current: {tip.tip_home}:{tip.tip_away}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes pulsewarn{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(154,74,42,0.5)}50%{opacity:0.9;box-shadow:0 0 0 8px transparent}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.85)}}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        @media(max-width:768px){.hide-mobile{display:none!important}.show-mobile{display:block!important}}
        @media(min-width:769px){.show-mobile{display:none!important}}
      `}</style>
    </div>
  )
}
