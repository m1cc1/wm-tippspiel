'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

interface User { id:string; display_name:string; invite_code:string; created_at:string; status:string }

export default function AdminPage() {
  const supabase = createBrowserClient()
  const [users, setUsers] = useState<User[]>([])
  const [userEmail, setUserEmail] = useState<string|null>(null)
  const [displayName, setDisplayName] = useState<string|null>(null)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState<string|null>(null)
  const [stats, setStats] = useState({total:0,active:0,pending:0,pool:0})

  async function load() {
    setLoading(true)
    const {data}=await supabase.from('profiles').select('*').order('created_at',{ascending:false})
    const list=data??[]
    setUsers(list)
    const active=list.filter(u=>u.status==='active').length
    setStats({total:list.length,active,pending:list.filter(u=>u.status==='pending').length,pool:active*20})
    setLoading(false)
  }

  useEffect(()=>{
    supabase.auth.getUser().then(async({data})=>{
      setUserEmail(data.user?.email??null)
      if (data.user?.id) {
        const {data:prof}=await supabase.from('profiles').select('display_name').eq('id',data.user.id).single()
        setDisplayName(prof?.display_name??null)
      }
    })
    load()
    const channel=supabase.channel('admin-profiles')
      .on('postgres_changes',{event:'*',schema:'public',table:'profiles'},()=>load())
      .subscribe()
    return ()=>{supabase.removeChannel(channel)}
  },[])

  async function activate(id:string){setActivating(id);await supabase.from('profiles').update({status:'active'}).eq('id',id);setActivating(null);load()}
  async function deactivate(id:string){setActivating(id);await supabase.from('profiles').update({status:'pending'}).eq('id',id);setActivating(null);load()}

  const pending=users.filter(u=>u.status==='pending')
  const active=users.filter(u=>u.status==='active')
  const prizes=[Math.round(stats.pool*0.6),Math.round(stats.pool*0.25),Math.round(stats.pool*0.15)]

  return (
    <div style={{background:'var(--bg)',minHeight:'100vh'}}>
      <Navbar userEmail={userEmail} displayName={displayName}/>
      <div className="page-wrap">

        <div style={{marginBottom:40}}>
          <h1 style={{fontFamily:'Bebas Neue',fontSize:'clamp(56px,7vw,96px)',lineHeight:0.9,color:'var(--text)'}}>
            Admin <span style={{color:'var(--beige-deep)'}}>panel</span>
          </h1>
          <div style={{fontSize:14,color:'var(--text-dim)',marginTop:8}}>Activate participants after receiving Twint payment of CHF 20.</div>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:40}}>
          {[
            {label:'Total registered',val:stats.total,color:'var(--text)'},
            {label:'Active (paid)',val:stats.active,color:'#4a7a3a'},
            {label:'Pending payment',val:stats.pending,color:'var(--warn)'},
            {label:'Prize pool',val:`CHF ${stats.pool}`,color:'var(--beige-deep)'},
          ].map(s=>(
            <div key={s.label} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'20px 24px',textAlign:'center'}}>
              <div style={{fontFamily:'Bebas Neue',fontSize:48,lineHeight:0.9,color:s.color,marginBottom:6}}>{s.val}</div>
              <div style={{fontSize:12,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Prize breakdown */}
        <div style={{background:'var(--text)',borderRadius:20,padding:'24px 20px',marginBottom:40,display:'flex',flexWrap:'wrap',gap:24,alignItems:'center',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:'-60px',right:'-60px',width:280,height:280,background:'radial-gradient(circle,rgba(212,193,154,0.15) 0%,transparent 60%)',pointerEvents:'none'}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:6}}>Current Prize Pool</div>
            <div style={{fontFamily:'Bebas Neue',fontSize:56,lineHeight:0.9,color:'var(--highlight)'}}>CHF {stats.pool}</div>
            <div style={{fontSize:13,color:'var(--text-faint)',marginTop:4}}>{stats.active} paid × CHF 20</div>
          </div>
          {prizes.map((p,i)=>(
            <div key={i} style={{background:'rgba(245,240,230,0.06)',border:'1px solid rgba(245,240,230,0.12)',borderRadius:14,padding:'18px 24px',textAlign:'center'}}>
              <div style={{fontFamily:'Bebas Neue',fontSize:24,marginBottom:4,color:i===0?'var(--bg)':i===1?'var(--highlight)':'var(--beige-mid)'}}>{['1ST','2ND','3RD'][i]}</div>
              <div style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:18,color:'var(--bg)'}}>CHF {p}</div>
              <div style={{fontSize:11,color:'var(--text-faint)',marginTop:2}}>{[60,25,15][i]}%</div>
            </div>
          ))}
        </div>

        {/* Pending */}
        <div style={{marginBottom:40}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:16,display:'flex',alignItems:'center',gap:12}}>
            <span style={{width:8,height:8,background:'var(--warn)',borderRadius:'50%',display:'inline-block'}}/>
            Pending payment ({pending.length})
            <div style={{flex:1,height:1,background:'var(--border)'}}/>
          </div>
          {loading ? (
            <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:32,textAlign:'center',color:'var(--text-faint)',fontFamily:'Bebas Neue',fontSize:24}}>Loading…</div>
          ) : pending.length===0 ? (
            <div style={{background:'rgba(74,122,58,0.08)',border:'1px solid rgba(74,122,58,0.25)',borderRadius:16,padding:'16px 24px',fontSize:13,color:'#4a7a3a',fontWeight:600}}>✓ No pending payments — everyone is activated!</div>
          ) : (
            <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden'}}>
              {pending.map((u,i)=>(
                <div key={u.id} style={{display:'flex',alignItems:'center',gap:16,padding:'16px 24px',borderBottom:i<pending.length-1?'1px solid var(--border)':'none'}}>
                  <div style={{width:40,height:40,borderRadius:'50%',background:'rgba(154,74,42,0.1)',border:'1px solid rgba(154,74,42,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,color:'var(--warn)',flexShrink:0}}>
                    {u.display_name.substring(0,2).toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:15,color:'var(--text)'}}>{u.display_name}</div>
                    <div style={{fontSize:12,color:'var(--text-faint)',marginTop:2}}>Registered {new Date(u.created_at).toLocaleDateString('en-CH',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color:'var(--warn)',background:'rgba(154,74,42,0.1)',border:'1px solid rgba(154,74,42,0.25)',padding:'4px 12px',borderRadius:100,textTransform:'uppercase',letterSpacing:'0.08em',flexShrink:0}}>⏳ Pending</span>
                  <button onClick={()=>activate(u.id)} disabled={activating===u.id}
                    style={{background:'#4a7a3a',color:'white',border:'none',padding:'10px 20px',borderRadius:100,fontWeight:700,fontSize:12,textTransform:'uppercase',letterSpacing:'0.08em',cursor:'pointer',flexShrink:0,transition:'opacity 0.2s',opacity:activating===u.id?0.6:1}}>
                    {activating===u.id?'…':'✓ Activate'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active */}
        <div>
          <div style={{fontSize:11,fontWeight:700,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:16,display:'flex',alignItems:'center',gap:12}}>
            <span style={{width:8,height:8,background:'#4a7a3a',borderRadius:'50%',display:'inline-block'}}/>
            Active participants ({active.length})
            <div style={{flex:1,height:1,background:'var(--border)'}}/>
          </div>
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden'}}>
            {active.length===0 ? (
              <div style={{padding:32,textAlign:'center',color:'var(--text-faint)',fontSize:14}}>No active participants yet</div>
            ) : active.map((u,i)=>(
              <div key={u.id} style={{display:'flex',alignItems:'center',gap:16,padding:'16px 24px',borderBottom:i<active.length-1?'1px solid var(--border)':'none'}}>
                <div style={{width:40,height:40,borderRadius:'50%',background:'rgba(74,122,58,0.1)',border:'1px solid rgba(74,122,58,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,color:'#4a7a3a',flexShrink:0}}>
                  {u.display_name.substring(0,2).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:15,color:'var(--text)'}}>{u.display_name}</div>
                  <div style={{fontSize:12,color:'var(--text-faint)',marginTop:2}}>Joined {new Date(u.created_at).toLocaleDateString('en-CH',{day:'numeric',month:'short'})}</div>
                </div>
                <span style={{fontSize:11,fontWeight:700,color:'#4a7a3a',background:'rgba(74,122,58,0.1)',border:'1px solid rgba(74,122,58,0.25)',padding:'4px 12px',borderRadius:100,textTransform:'uppercase',letterSpacing:'0.08em',flexShrink:0}}>✓ Active</span>
                <button onClick={()=>deactivate(u.id)} disabled={activating===u.id}
                  style={{background:'transparent',color:'var(--text-faint)',border:'1px solid var(--border)',padding:'8px 16px',borderRadius:100,fontWeight:600,fontSize:12,cursor:'pointer',flexShrink:0,transition:'all 0.2s'}}>
                  {activating===u.id?'…':'Deactivate'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.85)}}`}</style>
    </div>
  )
}
