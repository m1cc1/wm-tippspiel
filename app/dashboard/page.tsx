'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { createBrowserClient } from '@/lib/supabase'
import Link from 'next/link'

export default function DashboardPage() {
  const supabase = createBrowserClient()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ total: 0, exact: 0, tendency: 0, missed: 0, pending: 0 })
  const [rank, setRank] = useState<number | null>(null)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      setUserEmail(data.user.email ?? null)

      const [{ data: prof }, { data: tips }, { data: lb }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', data.user.id).single(),
        supabase.from('tips').select('*, games(status)').eq('user_id', data.user.id),
        supabase.rpc('get_leaderboard'),
      ])

      setProfile(prof)

      const finishedTips = (tips ?? []).filter((t: any) => t.games?.status === 'finished')
      const exact = finishedTips.filter((t: any) => t.points === 3).length
      const tendency = finishedTips.filter((t: any) => t.points === 1).length
      const missed = finishedTips.filter((t: any) => t.points === 0).length
      const pending = (tips ?? []).filter((t: any) => t.games?.status !== 'finished').length
      setStats({ total: finishedTips.length, exact, tendency, missed, pending })

      if (lb) {
        setTotalPlayers(lb.length)
        const myEntry = lb.find((e: any) => e.id === data.user!.id)
        setRank(myEntry?.rank ?? null)
      }
    })
  }, [supabase])

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar userEmail={userEmail} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-gold-500/20 flex items-center justify-center text-2xl">
            ⚽
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {profile?.display_name ?? 'Loading…'}
            </h1>
            <p className="text-slate-400 text-sm">{userEmail}</p>
          </div>
          {rank && (
            <div className="ml-auto text-right">
              <div className="text-2xl font-bold text-gold-500">#{rank}</div>
              <div className="text-slate-500 text-xs">of {totalPlayers}</div>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-gold-500">{profile?.total_points ?? 0}</div>
            <div className="text-slate-400 text-xs mt-1">Total points</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.exact}</div>
            <div className="text-slate-400 text-xs mt-1">Exact (×3 pts)</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.tendency}</div>
            <div className="text-slate-400 text-xs mt-1">Tendency (×1 pt)</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-slate-400">{stats.pending}</div>
            <div className="text-slate-400 text-xs mt-1">Tips pending</div>
          </div>
        </div>

        {/* Accuracy bar */}
        {stats.total > 0 && (
          <div className="card p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Accuracy</span>
              <span className="text-sm font-semibold text-white">
                {Math.round(((stats.exact + stats.tendency) / stats.total) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-green-500 h-full transition-all"
                style={{ width: `${(stats.exact / stats.total) * 100}%` }}
              />
              <div
                className="bg-yellow-500 h-full transition-all"
                style={{ width: `${(stats.tendency / stats.total) * 100}%` }}
              />
            </div>
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>Exact</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500 rounded-full inline-block"></span>Tendency</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-slate-700 rounded-full inline-block"></span>Missed</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/games" className="btn-primary flex-1 text-center py-2.5">
            Enter predictions →
          </Link>
          <Link href="/leaderboard" className="btn-secondary flex-1 text-center py-2.5">
            View leaderboard
          </Link>
        </div>
      </div>
    </div>
  )
}
