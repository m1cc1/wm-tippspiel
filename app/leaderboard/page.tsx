'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import Navbar from '@/components/Navbar'
import { createBrowserClient } from '@/lib/supabase'

const SPLITS = [0.60, 0.25, 0.15]

export default function LeaderboardPage() {
  const supabase = createBrowserClient()
  const [entries, setEntries] = useState<any[]>([])
  const [prevRanks, setPrevRanks] = useState<Record<string, number>>({})
  const [currentUserId, setCurrentUserId] = useState<string|null>(null)
  const [userEmail, setUserEmail] = useState<string|null>(null)
  const [displayName, setDisplayName] = useState<string|null>(null)
  const [liveCount, setLiveCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date|null>(null)
  const [participantCount, setParticipantCount] = useState(0)
  const prevEntriesRef = useRef<any[]>([])

  const loadLeaderboard = useCallback(async () => {
    const [{ data }, { count }] = await Promise.all([
      supabase.rpc('get_leaderboard'),
      supabase.from('profiles').select('*',{count:'exact',head:true}).eq('status','active'),
    ])
    const newEntries = data ?? []

    // Store previous ranks before updating
    if (prevEntriesRef.current.length > 0) {
      const prev: Record<string, number> = {}
      prevEntriesRef.current.forEach(e => { prev[e.id] = Number(e.rank) })
      setPrevRanks(prev)
    }
    prevEntriesRef.current = newEntries
    setEntries(newEntries)
    setParticipantCount(count ?? 0)
    setLastUpdate(new Date())
  }, [supabase])

  const loadLiveCount = useCallback(async () => {
    const { count } = await supabase.from('games').select('*',{count:'exact',head:true}).eq('status','live')
    setLiveCount(count ?? 0)
  }, [supabase])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null)
      setUserEmail(data.user?.email ?? null)
    })
    loadLeaderboard()
    loadLiveCount()
    const channel = supabase.channel('lb-updates')
      .on('postgres_changes',{event:'*',schema:'public',table:'tips'},()=>loadLeaderboard())
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'games'},()=>{loadLeaderboard();loadLiveCount()})
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'profiles'},()=>loadLeaderboard())
      .subscribe()
    const interval = setInterval(()=>{loadLeaderboard();loadLiveCount()},30_000)
    return ()=>{supabase.removeChannel(channel);clearInterval(interval)}
  },[loadLeaderboard,loadLiveCount,supabase])

  useEffect(()=>{
    const me = entries.find(e=>e.id===currentUserId)
    if (me) setDisplayName(me.display_name)
  },[entries,currentUserId])

  const pool = participantCount * 20
  const prizes = [Math.round(pool*SPLITS[0]),Math.round(pool*SPLITS[1]),Math.round(pool*SPLITS[2])]
  const activeEntries = entries.filter(e => e.status === 'active')
  const pendingEntries = entries.filter(e => e.status === 'pending')

  function getRankChange(e: any) {
    const curr = Number(e.rank)
    const prev = prevRanks[e.id]
    if (!prev || prev === curr) return null
    return prev - curr // positive = moved up, negative = moved down
  }

  return (
    <div style={{background:'var(--bg)',minHeight:'100vh'}}>
      <Navbar userEmail={userEmail} displayName={displayName}/>

      <div className="page-wrap">

        {/* Header */}
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:32,flexWrap:'wrap',gap:16}}>
          <div>
            <h1 style={{fontFamily:'Bebas Neue',fontSize:'clamp(48px,8vw,88px)',lineHeight:0.9,color:'var(--text)'}}>
              The <span style={{color:'var(--beige-deep)'}}>standings</span>
            </h1>
            <div style={{fontSize:13,color:'var(--text-dim)',marginTop:8,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
              <span>{participantCount} active players</span>
              {liveCount>0 && (
                <span style={{display:'inline-flex',alignItems:'center',gap:5,color:'var(--warn)',fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:'0.08em'}}>
                  <span style={{width:6,height:6,background:'var(--warn)',borderRadius:'50%',animation:'pulsewarn 1.5s infinite',display:'inline-block'}}/>
                  {liveCount} game{liveCount>1?'s':''} live now
                </span>
              )}
              {lastUpdate && <span style={{color:'var(--text-faint)',fontSize:11}}>· Updated {lastUpdate.toLocaleTimeString()}</span>}
            </div>
          </div>
        </div>

        {/* Prize pool banner */}
        <div style={{background:'var(--text)',borderRadius:20,padding:'24px 28px',marginBottom:32,display:'flex',flexWrap:'wrap',gap:20,alignItems:'center',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:'-60px',right:'-60px',width:240,height:240,background:'radial-gradient(circle,rgba(212,193,154,0.15) 0%,transparent 60%)',pointerEvents:'none'}}/>
          <div style={{flex:1,minWidth:160}}>
            <div style={{fontSize:10,fontWeight:700,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:6}}>💰 Prize Pool</div>
            <div style={{fontFamily:'Bebas Neue',fontSize:'clamp(40px,8vw,64px)',lineHeight:0.9,background:'linear-gradient(180deg,#f5f0e6 0%,#b8a47e 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>CHF {pool}</div>
            <div style={{fontSize:12,color:'var(--text-faint)',marginTop:4}}>{participantCount} players × CHF 20 · via Twint · July 19</div>
          </div>
          <div style={{display:'flex',gap:10}}>
            {prizes.map((p,i)=>(
              <div key={i} style={{background:'rgba(245,240,230,0.06)',border:'1px solid rgba(245,240,230,0.12)',borderRadius:12,padding:'14px 18px',textAlign:'center',minWidth:72}}>
                <div style={{fontFamily:'Bebas Neue',fontSize:20,marginBottom:2,color:i===0?'var(--bg)':i===1?'var(--highlight)':'var(--beige-mid)'}}>{['1ST','2ND','3RD'][i]}</div>
                <div style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:16,color:'var(--bg)',marginBottom:1}}>CHF {p}</div>
                <div style={{fontSize:10,color:'var(--text-faint)'}}>{Math.round(SPLITS[i]*100)}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,overflow:'hidden',marginBottom:16}}>

          {/* Column headers */}
          <div style={{display:'grid',gridTemplateColumns:'44px 1fr 80px 80px 56px',gap:8,padding:'12px 20px',borderBottom:'1px solid var(--border)',fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-faint)',fontWeight:700,background:'var(--bg-card-2)'}}>
            <div>#</div>
            <div>Player</div>
            <div style={{textAlign:'right'}}>Pts</div>
            <div style={{textAlign:'right'}} className="hide-mobile">Live Δ</div>
            <div style={{textAlign:'center'}} className="hide-mobile">Move</div>
            
          </div>

          {/* Active players */}
          {activeEntries.map((e)=>{
            const rank = Number(e.rank)
            const isMe = e.id === currentUserId
            const rankChange = getRankChange(e)
            const rankColor = rank===1?'var(--text)':rank===2?'var(--beige-deep)':rank===3?'var(--beige-mid)':'var(--text-faint)'
            const prize = rank<=3 ? prizes[rank-1] : null
            const prizeColor = rank===1?'var(--text)':rank===2?'var(--beige-deep)':rank===3?'var(--beige-mid)':'var(--text-faint)'
            const isLiveGaining = e.delta > 0 && liveCount > 0

            return (
              <div key={e.id} style={{display:'grid',gridTemplateColumns:'44px 1fr 80px 80px 56px',gap:8,padding:'16px 20px',alignItems:'center',borderBottom:'1px solid var(--border)',background:isMe?'linear-gradient(90deg,rgba(26,24,20,0.04) 0%,transparent 100%)':'transparent',position:'relative',transition:'background 0.3s'}}>
                {isMe && <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:'var(--text)'}}/>}

                {/* Rank */}
                <div style={{fontFamily:'Bebas Neue',fontSize:26,color:rankColor,lineHeight:1}}>{String(rank).padStart(2,'0')}</div>

                {/* Player */}
                <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                  <div style={{width:34,height:34,borderRadius:'50%',background:isMe?'var(--text)':'var(--bg-elev)',border:`1px solid ${isMe?'var(--text)':'var(--border)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12,color:isMe?'var(--bg)':'var(--text-dim)',flexShrink:0,position:'relative'}}>
                    {e.display_name.substring(0,2).toUpperCase()}
                    {/* Live dot on avatar */}
                    {isLiveGaining && <span style={{position:'absolute',top:-2,right:-2,width:8,height:8,background:'var(--warn)',borderRadius:'50%',border:'1.5px solid var(--bg-card)',animation:'pulsewarn 1.5s infinite'}}/>}
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:14,color:'var(--text)',display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
                      <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.display_name}</span>
                      {isMe && <span style={{fontSize:9,background:'var(--text)',color:'var(--bg)',padding:'1px 5px',borderRadius:4,fontWeight:700,flexShrink:0,letterSpacing:'0.05em'}}>YOU</span>}
                    </div>
                    {/* Mobile: show pts + live inline */}
                    <div style={{fontSize:11,color:'var(--text-faint)',marginTop:1}} className="show-mobile">
                      {e.total_points} pts{e.delta>0?` · +${e.delta} live`:''}
                    </div>
                  </div>
                </div>

                {/* Points */}
                <div style={{textAlign:'right',fontFamily:'JetBrains Mono',fontWeight:700,fontSize:15,color:'var(--text)'}} className="hide-mobile">{e.total_points}</div>

                {/* Live delta */}
                <div style={{textAlign:'right',fontFamily:'JetBrains Mono',fontSize:12,fontWeight:700,color:e.delta>0?'var(--warn)':'var(--text-faint)'}} className="hide-mobile">
                  {e.delta>0 ? `+${e.delta}` : '—'}
                </div>

                {/* Rank change */}
                <div style={{textAlign:'center'}} className="hide-mobile">
                  {rankChange === null ? (
                    <span style={{fontSize:11,color:'var(--text-faint)'}}>—</span>
                  ) : rankChange > 0 ? (
                    <span style={{fontSize:11,fontWeight:700,color:'#4a7a3a'}}>▲{rankChange}</span>
                  ) : (
                    <span style={{fontSize:11,fontWeight:700,color:'var(--warn)'}}>▼{Math.abs(rankChange)}</span>
                  )}
                </div>


              </div>
            )
          })}

          {/* Pending players — greyed out at bottom */}
          {pendingEntries.length > 0 && (
            <>
              <div style={{padding:'8px 20px',background:'var(--bg-card-2)',borderBottom:'1px solid var(--border)',borderTop:'1px solid var(--border)'}}>
                <span style={{fontSize:10,fontWeight:700,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.12em'}}>⏳ Pending activation</span>
              </div>
              {pendingEntries.map(e => {
                const isMe = e.id === currentUserId
                return (
                  <div key={e.id} style={{display:'grid',gridTemplateColumns:'44px 1fr 80px 80px 56px',gap:8,padding:'14px 20px',alignItems:'center',borderBottom:'1px solid var(--border)',background:isMe?'linear-gradient(90deg,rgba(26,24,20,0.03) 0%,transparent 100%)':'var(--bg-card-2)',opacity:0.5,position:'relative'}}>
                    {isMe && <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:'var(--text-faint)'}}/>}
                    <div style={{fontFamily:'Bebas Neue',fontSize:22,color:'var(--text-faint)'}}>—</div>
                    <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                      <div style={{width:32,height:32,borderRadius:'50%',background:'var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12,color:'var(--text-faint)',flexShrink:0}}>
                        {e.display_name.substring(0,2).toUpperCase()}
                      </div>
                      <div style={{fontWeight:500,fontSize:13,color:'var(--text-dim)',display:'flex',alignItems:'center',gap:5}}>
                        {e.display_name}
                        {isMe && <span style={{fontSize:9,background:'var(--text-faint)',color:'var(--bg)',padding:'1px 5px',borderRadius:4,fontWeight:700,flexShrink:0}}>YOU</span>}
                      </div>
                    </div>
                    <div style={{textAlign:'right',fontSize:12,color:'var(--text-faint)',fontFamily:'JetBrains Mono'}} className="hide-mobile">—</div>
                    <div className="hide-mobile"/>
                    <div className="hide-mobile"/>
  
                  </div>
                )
              })}
            </>
          )}

          {entries.length === 0 && (
            <div style={{padding:48,textAlign:'center',color:'var(--text-faint)',fontSize:14}}>No participants yet</div>
          )}
        </div>

        {/* Stats legend */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:8}}>
          {[
            {icon:'▲▼',label:'Move',desc:'Rank change after last finished game'},
            {icon:'+Δ',label:'Live',desc:'Points gained from currently live games'},
            {icon:'●',label:'Live dot',desc:'Player is gaining points right now'},
          ].map(s=>(
            <div key={s.label} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12,padding:'12px 14px'}}>
              <div style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:13,color:'var(--text)',marginBottom:3}}>{s.icon} {s.label}</div>
              <div style={{fontSize:11,color:'var(--text-faint)',lineHeight:1.4}}>{s.desc}</div>
            </div>
          ))}
        </div>

        <div style={{fontSize:11,color:'var(--text-faint)',textAlign:'center',marginTop:12}}>
          Prize pool paid out via Twint after the Final · July 19, 2026
        </div>
      </div>

      <style>{`
        @keyframes pulsewarn{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(154,74,42,0.5)}50%{opacity:0.9;box-shadow:0 0 0 6px transparent}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.85)}}
        @media(max-width:768px){.hide-mobile{display:none!important}.show-mobile{display:block!important}}
        @media(min-width:769px){.show-mobile{display:none!important}}
      `}</style>
    </div>
  )
}
