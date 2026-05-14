'use client'
import { useEffect, useState, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import { createBrowserClient } from '@/lib/supabase'
import type { Game, Tip } from '@/lib/types'
import { format, parseISO } from 'date-fns'

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtKickoff(iso: string, tz: number) {
  const utcMs = new Date(iso).getTime()
  const d = new Date(utcMs + tz * 3_600_000)
  const time = `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`
  const date = `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
  return { time, date }
}

function PointsBadge({ pts }: { pts: number }) {
  if (pts === 10) return <span className="text-xs bg-green-50 border border-green-200 text-green-600 px-2 py-0.5 rounded-full font-bold">+10 perfect ⭐</span>
  if (pts >= 5)  return <span className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-600 px-2 py-0.5 rounded-full font-bold">+{pts} pts</span>
  if (pts > 0)   return <span className="text-xs bg-blue-50 border border-blue-200 text-blue-500 px-2 py-0.5 rounded-full font-bold">+{pts} pts</span>
  return              <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-bold">+0 pts</span>
}

const TZ_OPTIONS = [
  { label:'🇺🇸 Los Angeles (UTC−7)', offset:-7 },
  { label:'🇲🇽 Mexico City (UTC−6)', offset:-6 },
  { label:'🇺🇸 New York (UTC−5)',    offset:-5 },
  { label:'🇧🇷 São Paulo (UTC−4)',   offset:-4 },
  { label:'🇬🇧 London (UTC+0)',      offset: 0 },
  { label:'🇨🇭 Zurich (UTC+1)',      offset: 1 },
  { label:'🇬🇷 Athens (UTC+2)',      offset: 2 },
  { label:'🇸🇦 Riyadh (UTC+3)',      offset: 3 },
  { label:'🇨🇳 Beijing (UTC+8)',     offset: 8 },
  { label:'🇯🇵 Tokyo (UTC+9)',       offset: 9 },
]

export default function GamesPage() {
  const supabase = createBrowserClient()
  const [games, setGames] = useState<Game[]>([])
  const [tips, setTips] = useState<Record<string, Tip>>({})
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [tipInputs, setTipInputs] = useState<Record<string, { h: string; a: string }>>({})
  const [tz, setTz] = useState(1)

  const load = useCallback(async (uid: string) => {
    const [{ data: gData }, { data: tData }] = await Promise.all([
      supabase.from('games').select('*').order('kickoff', { ascending: true }),
      supabase.from('tips').select('*').eq('user_id', uid),
    ])
    setGames(gData ?? [])
    const tipMap: Record<string, Tip> = {}
    const inputMap: Record<string, { h: string; a: string }> = {}
    for (const t of (tData ?? [])) {
      tipMap[t.game_id] = t
      inputMap[t.game_id] = { h: String(t.tip_home), a: String(t.tip_away) }
    }
    setTips(tipMap)
    setTipInputs(inputMap)
  }, [supabase])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null
      setUserId(uid)
      setUserEmail(data.user?.email ?? null)
      if (uid) {
        load(uid)
        const { data: prof } = await supabase.from('profiles').select('status').eq('id', uid).single()
        setIsActive(prof?.status === 'active')
      }
    })
  }, [load, supabase])

  async function saveTip(gameId: string) {
    if (!userId || !isActive) return
    const inp = tipInputs[gameId]
    if (!inp || inp.h === '' || inp.a === '') return
    const tipHome = parseInt(inp.h)
    const tipAway = parseInt(inp.a)
    if (isNaN(tipHome) || isNaN(tipAway)) return

    setSaving(s => ({ ...s, [gameId]: true }))
    const existing = tips[gameId]
    if (existing) {
      await supabase.from('tips').update({ tip_home: tipHome, tip_away: tipAway }).eq('id', existing.id)
    } else {
      await supabase.from('tips').insert({ user_id: userId, game_id: gameId, tip_home: tipHome, tip_away: tipAway })
    }
    setSaving(s => ({ ...s, [gameId]: false }))
    setSaved(s => ({ ...s, [gameId]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [gameId]: false })), 2500)
    if (userId) load(userId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={userEmail} />
      <div className="max-w-3xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Games</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {isActive ? 'Enter your prediction before each kickoff' : '⏳ Activate your account to predict'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Timezone</span>
            <select value={tz} onChange={e => setTz(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400">
              {TZ_OPTIONS.map(o => <option key={o.offset} value={o.offset}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Points reminder */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { pts:'5', label:'Correct outcome',     color:'text-yellow-500' },
            { pts:'3', label:'Goal difference',      color:'text-orange-500' },
            { pts:'1', label:'Goals per team',       color:'text-blue-500'   },
            { pts:'10',label:'Max per game',         color:'text-green-600'  },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={`text-lg font-black ${s.color}`}>{s.pts} pts</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Not active warning */}
        {!isActive && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 text-sm text-yellow-700">
            <strong>⏳ Account pending</strong> — predictions are locked until micci confirms your Twint payment.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {games.map(game => {
            const tip = tips[game.id]
            const inp = tipInputs[game.id] ?? { h: '', a: '' }
            const isClosed = game.status !== 'scheduled'
            const pts = tip?.points
            const { time, date } = fmtKickoff(game.kickoff, tz)

            return (
              <div key={game.id} className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${game.status === 'live' ? 'border-red-200' : 'border-gray-100'}`}>
                {/* Top row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">{game.group_stage}</span>
                    {game.status === 'live' && (
                      <span className="inline-flex items-center gap-1 bg-red-50 text-red-500 text-xs font-bold px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block"></span>
                        LIVE {game.minute}'
                      </span>
                    )}
                    {game.status === 'finished' && <span className="text-xs bg-gray-100 text-gray-400 font-semibold px-2.5 py-1 rounded-full">Full time</span>}
                    {game.status === 'scheduled' && (
                      <span className="text-xs bg-blue-50 text-blue-500 font-bold px-2.5 py-1 rounded-full">{date} · {time}</span>
                    )}
                  </div>
                  {game.venue && <span className="text-xs text-gray-300 hidden sm:block truncate max-w-[200px]">📍 {game.venue}</span>}
                </div>

                {/* Teams + Score */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 text-right">
                    <div className="text-2xl mb-1">{game.home_flag}</div>
                    <div className="font-bold text-gray-900 text-sm">{game.home_team}</div>
                  </div>
                  <div className="text-center min-w-[72px]">
                    {game.status === 'scheduled' ? (
                      <div className="text-gray-200 text-lg font-light">vs</div>
                    ) : (
                      <div className={`text-2xl font-black rounded-xl px-3 py-1 ${game.status === 'live' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-700'}`}>
                        {game.home_score ?? 0}:{game.away_score ?? 0}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl mb-1">{game.away_flag}</div>
                    <div className="font-bold text-gray-900 text-sm">{game.away_team}</div>
                  </div>
                </div>

                {/* Tip row */}
                <div className="border-t border-gray-50 pt-4 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400 flex-1">Your prediction:</span>
                  {isClosed ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-gray-700">
                        {tip ? `${tip.tip_home} : ${tip.tip_away}` : '—'}
                      </span>
                      {tip && pts !== null && pts !== undefined && <PointsBadge pts={pts} />}
                      {!tip && <span className="text-xs text-gray-300">No prediction entered</span>}
                    </div>
                  ) : (
                    <>
                      <input
                        type="number" min={0} max={20} value={inp.h} placeholder="0"
                        onChange={e => setTipInputs(t => ({ ...t, [game.id]: { ...inp, h: e.target.value } }))}
                        disabled={!isActive}
                        className="w-10 h-9 border border-gray-200 rounded-xl text-center text-sm font-bold text-gray-900 bg-gray-50 focus:outline-none focus:border-yellow-400 disabled:opacity-40"
                      />
                      <span className="text-gray-300 font-light">:</span>
                      <input
                        type="number" min={0} max={20} value={inp.a} placeholder="0"
                        onChange={e => setTipInputs(t => ({ ...t, [game.id]: { ...inp, a: e.target.value } }))}
                        disabled={!isActive}
                        className="w-10 h-9 border border-gray-200 rounded-xl text-center text-sm font-bold text-gray-900 bg-gray-50 focus:outline-none focus:border-yellow-400 disabled:opacity-40"
                      />
                      {isActive && (
                        <button
                          onClick={() => saveTip(game.id)}
                          disabled={saving[game.id]}
                          className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                          {saving[game.id] ? '…' : saved[game.id] ? '✓ Saved!' : tip ? 'Update' : 'Save'}
                        </button>
                      )}
                      {tip && !saved[game.id] && (
                        <span className="text-xs text-gray-400 font-mono">Current: {tip.tip_home}:{tip.tip_away}</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}

          {games.length === 0 && (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
              Games will appear here once the schedule is loaded.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
