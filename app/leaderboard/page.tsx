'use client'
import { useEffect, useState, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import { createBrowserClient } from '@/lib/supabase'

const SPLITS = [0.60, 0.25, 0.15]

export default function LeaderboardPage() {
  const supabase = createBrowserClient()
  const [entries, setEntries] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState<string|null>(null)
  const [userEmail, setUserEmail] = useState<string|null>(null)
  const [displayName, setDisplayName] = useState<string|null>(null)
  const [liveCount, setLiveCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date|null>(null)
  const [participantCount, setParticipantCount] = useState(0)

  const loadLeaderboard = useCallback(async () => {
    const [{ data }, { count }] = await Promise.all([
      supabase.rpc('get_leaderboard'),
      supabase.from('profiles').select('*',{count:'exact',head:true}).eq('status','active'),
    ])
    setEntries(data ?? [])
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
  const ordinals: Record<number,string> = {1:'gold',2:'silver',3:'bronze'}

  return (
    <div style={{background:'var(--bg)',minHeight:'100vh'}}>
      <Navbar userEmail={userEmail} displayName={displayName}/>

      <div className="page-wrap">
        {/* Header */}
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:32,flexWrap:'wrap',gap:16}}>
          <div>
            <h1 style={{fontFamily:'Bebas Neue',fontSize:'clamp(56px,7vw,96px)',lineHeight:0.9,color:'var(--text)'}}>
              The <span style={{color:'var(--beige-deep)'}}>standings</span>
            </h1>
            <div style={{fontSize:14,color:'var(--text-dim)',marginTop:8,display:'flex',alignItems:'center',gap:12}}>
              {participantCount} participants
              {liveCount>0 && <span style={{display:'inline-flex',alignItems:'center',gap:6,color:'var(--warn)',fontWeight:700,fontSize:12,textTransform:'uppercase',letterSpacing:'0.08em'}}><span style={{width:6,height:6,background:'var(--warn)',borderRadius:'50%',animation:'pulsewarn 1.5s infinite',display:'inline-block'}}/>{liveCount} live</span>}
              {lastUpdate && <span style={{color:'var(--text-faint)',fontSize:12}}>· Updated {lastUpdate.toLocaleTimeString()}</span>}
            </div>
          </div>
        </div>

        {/* Prize pool */}
        <div style={{background:'var(--text)',borderRadius:20,padding:'24px 20px',marginBottom:32,display:'flex',flexWrap:'wrap',gap:32,alignItems:'center',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:'-80px',right:'-80px',width:320,height:320,background:'radial-gradient(circle,rgba(212,193,154,0.15) 0%,transparent 60%)',pointerEvents:'none'}}/>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:8}}>💰 Prize Pool</div>
            <div style={{fontFamily:'Bebas Neue',fontSize:56,lineHeight:0.9,background:'linear-gradient(180deg,#f5f0e6 0%,#b8a47e 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>CHF {pool}</div>
            <div style={{fontSize:13,color:'var(--text-faint)',marginTop:6}}>{participantCount} players × CHF 20 · paid via Twint · distributed July 19</div>
          </div>
          <div style={{display:'flex',gap:12}}>
            {prizes.map((p,i)=>(
              <div key={i} style={{background:'rgba(245,240,230,0.06)',border:'1px solid rgba(245,240,230,0.12)',borderRadius:14,padding:'20px 24px',textAlign:'center',minWidth:80}}>
                <div style={{fontFamily:'Bebas Neue',fontSize:24,marginBottom:4,color:i===0?'var(--bg)':i===1?'var(--highlight)':'var(--beige-mid)'}}>{['1ST','2ND','3RD'][i]}</div>
                <div style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:18,color:'var(--bg)',marginBottom:2}}>CHF {p}</div>
                <div style={{fontSize:11,color:'var(--text-faint)'}}>{Math.round(SPLITS[i]*100)}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scoring legend */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:32}}>
          {[
            {pts:'3 pts',label:'Exact score',color:'var(--text)'},
            {pts:'1 pt',label:'Correct winner',color:'var(--beige-deep)'},
            {pts:'Live',label:'Auto-updated',color:'var(--warn)'},
          ].map(s=>(
            <div key={s.label} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:14,padding:'16px 20px',textAlign:'center'}}>
              <div style={{fontFamily:'Bebas Neue',fontSize:28,color:s.color,marginBottom:4}}>{s.pts}</div>
              <div style={{fontSize:12,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'44px 1fr 80px 80px',gap:16,padding:'16px 28px',borderBottom:'1px solid var(--border)',fontSize:11,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-faint)',fontWeight:600,background:'var(--bg-card-2)'}}>
            <div>#</div><div>Player</div><div>Pts</div><div style={{textAlign:'right'}}>Prize</div>
          </div>
          {entries.map((e,i)=>{
            const rank=Number(e.rank)
            const isMe=e.id===currentUserId
            const prize=rank<=3?prizes[rank-1]:null
            const rankColor=rank===1?'var(--text)':rank===2?'var(--beige-deep)':rank===3?'var(--beige-mid)':'var(--text-faint)'
            const prizeColor=rank===1?'var(--text)':rank===2?'var(--beige-deep)':rank===3?'var(--beige-mid)':'var(--text-faint)'
            return (
              <div key={e.id} style={{display:'grid',gridTemplateColumns:'44px 1fr 80px 80px',gap:16,padding:'20px 28px',alignItems:'center',borderBottom:'1px solid var(--border)',background:isMe?'linear-gradient(90deg,rgba(26,24,20,0.04) 0%,transparent 100%)':'transparent',position:'relative',transition:'background 0.2s'}}>
                {isMe && <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:'var(--text)'}}/>}
                <div style={{fontFamily:'Bebas Neue',fontSize:32,color:rankColor}}>{String(rank).padStart(2,'0')}</div>
                <div style={{display:'flex',alignItems:'center',gap:14}}>
                  <div style={{width:40,height:40,borderRadius:'50%',background:isMe?'var(--text)':'var(--bg-elev)',border:`1px solid ${isMe?'var(--text)':'var(--border)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,color:isMe?'var(--bg)':'var(--text-dim)',flexShrink:0}}>
                    {e.display_name.substring(0,2).toUpperCase()}
                  </div>
                  <div style={{fontWeight:600,fontSize:15,color:'var(--text)',display:'flex',alignItems:'center',gap:8}}>
                    {e.display_name}
                    {isMe && <span style={{fontSize:10,background:'var(--text)',color:'var(--bg)',padding:'2px 6px',borderRadius:4,fontWeight:700,letterSpacing:'0.05em'}}>YOU</span>}
                  </div>
                </div>
                <div style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:18,color:'var(--text)'}}>{e.total_points}</div>
                
                
                <div style={{textAlign:'right',fontWeight:700,fontSize:15,color:prizeColor}}>{prize!=null?`CHF ${prize}`:'—'}</div>
              </div>
            )
          })}
          {entries.length===0 && <div style={{padding:'48px',textAlign:'center',color:'var(--text-faint)',fontSize:14}}>No active participants yet</div>}
        </div>
        <div style={{fontSize:12,color:'var(--text-faint)',textAlign:'center',marginTop:16}}>Prize pool paid out via Twint after the Final on July 19, 2026</div>
      </div>
      <style>{`
        @keyframes pulsewarn{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(154,74,42,0.5)}50%{opacity:0.9;box-shadow:0 0 0 8px transparent}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.85)}}
      `}</style>
    </div>
  )
}
