'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

interface PendingUser {
  id: string
  display_name: string
  invite_code: string
  created_at: string
  status: string
}

export default function AdminPage() {
  const supabase = createBrowserClient()
  const [users, setUsers] = useState<PendingUser[]>([])
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, pool: 0 })

  async function load() {
    const { data: allUsers } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    setUsers(allUsers ?? [])
    const active = (allUsers ?? []).filter(u => u.status === 'active').length
    const pending = (allUsers ?? []).filter(u => u.status === 'pending').length
    setStats({ total: (allUsers ?? []).length, active, pending, pool: active * 20 })
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null))
    load()
  }, [])

  async function activate(userId: string) {
    setActivating(userId)
    await supabase.from('profiles').update({ status: 'active' }).eq('id', userId)
    setActivating(null)
    load()
  }

  async function deactivate(userId: string) {
    setActivating(userId)
    await supabase.from('profiles').update({ status: 'pending' }).eq('id', userId)
    setActivating(null)
    load()
  }

  const pending = users.filter(u => u.status === 'pending')
  const active = users.filter(u => u.status === 'active')

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar userEmail={userEmail} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-1">Activate participants after receiving their Twint payment.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total registered', val: stats.total, color: 'text-slate-900' },
            { label: 'Active (paid)', val: stats.active, color: 'text-green-600' },
            { label: 'Pending payment', val: stats.pending, color: 'text-yellow-600' },
            { label: 'Prize pool', val: `CHF ${stats.pool}`, color: 'text-yellow-600' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
              <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Prize breakdown */}
        <div className="bg-slate-900 rounded-2xl p-5 mb-8 flex gap-6 items-center flex-wrap">
          <div className="text-white">
            <div className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-1">Current Prize Pool</div>
            <div className="text-2xl font-black">CHF {stats.pool}</div>
            <div className="text-slate-400 text-xs mt-1">{stats.active} paid participants × CHF 20</div>
          </div>
          {[['🥇', '60%', Math.round(stats.pool * 0.60)],['🥈','25%',Math.round(stats.pool * 0.25)],['🥉','15%',Math.round(stats.pool * 0.15)]].map(([m,p,a]) => (
            <div key={String(m)} className="bg-white/10 rounded-xl px-5 py-3 text-center">
              <div className="text-xl mb-1">{m}</div>
              <div className="text-white font-bold text-sm">CHF {a}</div>
              <div className="text-slate-400 text-xs">{p}</div>
            </div>
          ))}
        </div>

        {/* Pending users */}
        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span>
              Pending payment ({pending.length})
            </h2>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {pending.map((u, i) => (
                <div key={u.id} className={`flex items-center gap-4 p-4 ${i < pending.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <div className="w-9 h-9 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center text-xs font-bold text-yellow-700 flex-shrink-0">
                    {u.display_name.substring(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 text-sm">{u.display_name}</div>
                    <div className="text-xs text-slate-400">Registered {new Date(u.created_at).toLocaleDateString('en-CH', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</div>
                  </div>
                  <div className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-700 font-semibold px-3 py-1 rounded-full">⏳ Pending</div>
                  <button
                    onClick={() => activate(u.id)}
                    disabled={activating === u.id}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                  >
                    {activating === u.id ? '…' : '✓ Activate'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {pending.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center text-green-700 text-sm font-medium mb-8">
            ✓ No pending payments — everyone is activated!
          </div>
        )}

        {/* Active users */}
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            Active participants ({active.length})
          </h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {active.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-sm">No active participants yet</div>
            )}
            {active.map((u, i) => (
              <div key={u.id} className={`flex items-center gap-4 p-4 ${i < active.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">
                  {u.display_name.substring(0,2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 text-sm">{u.display_name}</div>
                  <div className="text-xs text-slate-400">Activated · joined {new Date(u.created_at).toLocaleDateString('en-CH', { day:'numeric', month:'short' })}</div>
                </div>
                <div className="text-xs bg-green-50 border border-green-200 text-green-700 font-semibold px-3 py-1 rounded-full">✓ Active</div>
                <button
                  onClick={() => deactivate(u.id)}
                  disabled={activating === u.id}
                  className="text-xs text-slate-400 hover:text-red-500 font-medium px-3 py-2 rounded-xl transition-colors"
                >
                  {activating === u.id ? '…' : 'Deactivate'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
