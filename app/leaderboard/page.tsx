'use client'
import { useEffect, useState, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import { createBrowserClient } from '@/lib/supabase'
import type { LeaderboardEntry } from '@/lib/types'

const ENTRY_FEE = 20
const SPLITS = [0.60, 0.25, 0.15]

function medal(rank: number) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return rank
}
function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}
const AVATAR_BG = ['#fef3c7','#f0fdf4','#eff6ff','#fdf4ff','#fff1f2']
const AVATAR_FG = ['#d97706','#16a34a','#2563eb','#9333ea','#e11d48']

export default function LeaderboardPage() {
  const supabase = createBrowserClient()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [liveCount, setLiveCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [participantCount, setParticipantCount] = useState(0)

  const loadLeaderboard = useCallback(async () => {
    const [{ data }, { count }] = await Promise.all([
      supabase.rpc('get_leaderboard'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    ])
    setEntries(data ?? [])
    setParticipantCount(count ?? 0)
    setLastUpdate(new Date())
  }, [supabase])

  const loadLiveCount = useCallback(async () => {
    const { count } = await supabase.from('games').select('*', { count: 'exact', head: true }).eq('status', 'live')
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tips' }, () => loadLeaderboard())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games' }, () => { loadLeaderboard(); loadLiveCount() })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => loadLeaderboard())
      .subscribe()

    const interval = setInterval(() => { loadLeaderboard(); loadLiveCount() }, 30_000)
    return () => { supabase.removeChannel(channel); clearInterval(interval) }
  }, [loadLeaderboard, loadLiveCount, supabase])

  const pool = participantCount * ENTRY_FEE
  const prizes = [Math.round(pool * SPLITS[0]), Math.round(pool * SPLITS[1]), Math.round(pool * SPLITS[2])]
  const prizeColors = ['text-yellow-600', 'text-slate-400', 'text-amber-700']
  const prizeLabels = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar userEmail={userEmail} />
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leaderboard</h1>
            <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-2">
              {participantCount} participants
              {liveCount > 0 && (
                <span className="inline-flex items-center gap-1 bg-red-50 text-red-500 text-xs font-bold px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block"></span>
                  {liveCount} live
                </span>
              )}
            </p>
          </div>
          {lastUpdate && <span className="text-slate-300 text-xs">Updated {lastUpdate.toLocaleTimeString()}</span>}
        </div>

        {/* Prize pool banner */}
        <div className="bg-slate-900 rounded-2xl p-5 mb-6 flex flex-wrap gap-5 items-center">
          <div className="flex-1 min-w-[160px]">
            <div className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-1">💰 Prize Pool</div>
            <div className="text-2xl font-black text-white">CHF {pool}</div>
            <div className="text-slate-400 text-xs mt-1">{participantCount} × CHF {ENTRY_FEE} entry · paid via Twint</div>
          </div>
          <div className="flex gap-3">
            {prizes.map((p, i) => (
              <div key={i} className="bg-white/10 rounded-xl px-4 py-3 text-center min-w-[72px]">
                <div className="text-lg mb-0.5">{prizeLabels[i]}</div>
                <div className="text-white font-bold text-sm">CHF {p}</div>
                <div className="text-slate-400 text-xs">{Math.round(SPLITS[i]*100)}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scoring legend */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
            <div className="text-yellow-600 font-bold text-lg">3 pts</div>
            <div className="text-slate-400 text-xs mt-0.5">Exact score</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
            <div className="text-slate-700 font-bold text-lg">1 pt</div>
            <div className="text-slate-400 text-xs mt-0.5">Correct winner</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
            <div className="text-red-400 font-bold text-lg">Live</div>
            <div className="text-slate-400 text-xs mt-0.5">Auto-updated</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wide">
                <th className="py-3 px-4 text-left w-10">#</th>
                <th className="py-3 px-4 text-left">Player</th>
                <th className="py-3 px-4 text-center">Pts</th>
                <th className="py-3 px-4 text-center hidden sm:table-cell">Exact</th>
                <th className="py-3 px-4 text-center hidden sm:table-cell">Δ Live</th>
                <th className="py-3 px-4 text-right">Prize</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, idx) => {
                const rank = Number(e.rank)
                const isMe = e.id === currentUserId
                const prize = rank <= 3 ? prizes[rank - 1] : null
                const bg = AVATAR_BG[idx % 5]
                const fg = AVATAR_FG[idx % 5]
                const rowBg = isMe ? 'bg-yellow-50' : rank === 1 ? 'bg-yellow-50/50' : rank === 2 ? 'bg-slate-50/50' : rank === 3 ? 'bg-amber-50/30' : ''
                return (
                  <tr key={e.id} className={`border-b border-slate-50 last:border-0 ${rowBg} hover:bg-slate-50/80 transition-colors`}>
                    <td className="py-3 px-4 text-center text-base">{medal(rank)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div style={{ background: bg, color: fg }} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {initials(e.display_name)}
                        </div>
                        <span className={isMe ? 'font-bold text-yellow-700' : 'text-slate-800 font-medium'}>
                          {e.display_name}{isMe && <span className="text-yellow-500 text-xs font-bold ml-1.5 uppercase tracking-wide">you</span>}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-yellow-50 text-yellow-700 font-bold rounded-lg px-2 py-0.5 text-xs border border-yellow-200">
                        {e.total_points}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400 hidden sm:table-cell text-xs">{e.exact_count}</td>
                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      {e.delta > 0
                        ? <span className="text-green-500 font-bold text-xs">+{e.delta}</span>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {prize != null ? (
                        <div>
                          <div className={`font-bold text-sm ${prizeColors[rank-1]}`}>CHF {prize}</div>
                          <div className="text-slate-300 text-xs">{Math.round(SPLITS[rank-1]*100)}%</div>
                        </div>
                      ) : <span className="text-slate-200 text-xs">—</span>}
                    </td>
                  </tr>
                )
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">No active participants yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-300 text-center mt-4">
          Prize pool paid out via Twint after the Final on July 19, 2026
        </p>
      </div>
    </div>
  )
}
