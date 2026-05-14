'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { createBrowserClient } from '@/lib/supabase'
import Link from 'next/link'

export default function DashboardPage() {
  const supabase = createBrowserClient()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ total: 0, exact: 0, tendency: 0, pending: 0 })
  const [rank, setRank] = useState<number | null>(null)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [pool, setPool] = useState(0)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      setUserEmail(data.user.email ?? null)

      const [{ data: prof }, { data: tips }, { data: lb }, { count }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', data.user.id).single(),
        supabase.from('tips').select('*, games(status)').eq('user_id', data.user.id),
        supabase.rpc('get_leaderboard'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ])

      setProfile(prof)
      setIsPending(prof?.status === 'pending')
      setProfileLoaded(true)
      setPool((count ?? 0) * 20)

      const finishedTips = (tips ?? []).filter((t: any) => t.games?.status === 'finished')
      const exact = finishedTips.filter((t: any) => t.points === 10).length
      const tendency = finishedTips.filter((t: any) => t.points !== null && t.points > 0 && t.points < 10).length
      const pending = (tips ?? []).filter((t: any) => t.games?.status !== 'finished').length
      setStats({ total: finishedTips.length, exact, tendency, pending })

      if (lb) {
        setTotalPlayers(lb.length)
        const myEntry = lb.find((e: any) => e.id === data.user!.id)
        setRank(myEntry?.rank ?? null)
      }
    })
  }, [supabase])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={userEmail} />
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Pending banner */}
        {isPending && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <div className="text-2xl">⏳</div>
            <div>
              <div className="font-bold text-yellow-800 text-sm">Payment pending activation</div>
              <div className="text-yellow-700 text-xs mt-1 leading-relaxed">
                Send CHF 20 via Twint to <strong>+41 79 425 64 77</strong> with message <strong>WC2026</strong>. Your account will be activated within 24h.
              </div>
            </div>
          </div>
        )}

        {/* Profile header */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center text-xl font-black text-yellow-600 flex-shrink-0">
            {profileLoaded ? (profile?.display_name?.charAt(0) ?? '?') : '…'}
          </div>
          <div className="flex-1">
            <div className="text-xl font-bold text-gray-900">
              {profileLoaded ? (profile?.display_name ?? 'Unknown') : '…'}
            </div>
            <div className="text-sm text-gray-400">{userEmail}</div>
            <div className={`inline-flex items-center gap-1.5 mt-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${isPending ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
              {!profileLoaded ? '…' : isPending ? '⏳ Pending activation' : '✓ Active'}
            </div>
          </div>
          {rank && !isPending && (
            <div className="text-right flex-shrink-0">
              <div className="text-3xl font-black text-yellow-500">#{rank}</div>
              <div className="text-xs text-gray-400">of {totalPlayers}</div>
            </div>
          )}
        </div>

        {/* Prize pool */}
        {!isPending && profileLoaded && (
          <div className="bg-gray-900 rounded-2xl p-5 mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex-1">
              <div className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-1">💰 Current Prize Pool</div>
              <div className="text-2xl font-black text-white">CHF {pool}</div>
              <div className="text-gray-500 text-xs mt-1">60% · 25% · 15% for top 3</div>
            </div>
            {[['🥇','60%',Math.round(pool*0.6)],['🥈','25%',Math.round(pool*0.25)],['🥉','15%',Math.round(pool*0.15)]].map(([m,p,a]) => (
              <div key={String(m)} className="bg-white/10 rounded-xl px-4 py-2.5 text-center">
                <div className="text-base mb-0.5">{m}</div>
                <div className="text-white font-bold text-sm">CHF {a}</div>
                <div className="text-gray-500 text-xs">{p}</div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {!isPending && profileLoaded && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { val: profile?.total_points ?? 0, label:'Total points',   color:'text-yellow-500' },
                { val: stats.exact,                 label:'Exact scores',   color:'text-green-500'  },
                { val: stats.tendency,              label:'Partial points', color:'text-blue-500'   },
                { val: stats.pending,               label:'Tips pending',   color:'text-gray-400'   },
              ].map(s => (
                <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Points system */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm">
              <div className="text-sm font-bold text-gray-900 mb-3">🎯 Points per game (max 10)</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { pts:'5 pts', label:'Correct winner / draw',  color:'text-yellow-500' },
                  { pts:'3 pts', label:'Correct goal difference', color:'text-orange-500' },
                  { pts:'1 pt',  label:'Right goals home team',  color:'text-blue-500'   },
                  { pts:'1 pt',  label:'Right goals away team',  color:'text-blue-500'   },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className={`font-bold text-sm min-w-[44px] ${s.color}`}>{s.pts}</span>
                    <span className="text-gray-400 text-xs">{s.label}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-50 mt-3 pt-3 flex items-center gap-2">
                <span className="font-bold text-sm text-green-600 min-w-[44px]">20 pts</span>
                <span className="text-gray-400 text-xs">Each bonus question (tournament winner + top scorer)</span>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3">
          <Link href="/games" className="btn-primary flex-1 text-center py-3 rounded-xl">
            {isPending ? 'Browse games →' : 'Enter predictions →'}
          </Link>
          <Link href="/leaderboard" className="btn-secondary flex-1 text-center py-3 rounded-xl">
            View leaderboard
          </Link>
        </div>
      </div>
    </div>
  )
}
