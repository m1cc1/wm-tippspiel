'use client'
import { useEffect, useState, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import { createBrowserClient } from '@/lib/supabase'
import type { Game, Tip } from '@/lib/types'
import { format, parseISO } from 'date-fns'

function groupByDate(games: Game[]): Record<string, Game[]> {
  return games.reduce((acc, g) => {
    const date = format(parseISO(g.kickoff), 'EEEE, MMM d')
    if (!acc[date]) acc[date] = []
    acc[date].push(g)
    return acc
  }, {} as Record<string, Game[]>)
}

function StatusBadge({ game }: { game: Game }) {
  if (game.status === 'live')
    return <span className="live-badge"><span className="live-dot"></span> {game.minute ?? 0}'</span>
  if (game.status === 'finished')
    return <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">Full time</span>
  return <span className="text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded-full">
    {format(parseISO(game.kickoff), 'HH:mm')}
  </span>
}

function PointsBadge({ pts }: { pts: number }) {
  if (pts === 3) return <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">+3 exact ✓</span>
  if (pts === 1) return <span className="text-xs bg-yellow-900/40 text-yellow-400 px-2 py-0.5 rounded-full">+1 tendency</span>
  return <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full">+0</span>
}

export default function GamesPage() {
  const supabase = createBrowserClient()
  const [games, setGames] = useState<Game[]>([])
  const [tips, setTips] = useState<Record<string, Tip>>({})
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [tipInputs, setTipInputs] = useState<Record<string, { h: string; a: string }>>({})

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
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null
      setUserId(uid)
      setUserEmail(data.user?.email ?? null)
      if (uid) load(uid)
    })
  }, [load, supabase])

  async function saveTip(gameId: string) {
    if (!userId) return
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
    setTimeout(() => setSaved(s => ({ ...s, [gameId]: false })), 2000)
    if (userId) load(userId)
  }

  const grouped = groupByDate(games)

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar userEmail={userEmail} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-1">All Games</h1>
        <p className="text-slate-400 text-sm mb-6">
          Enter your prediction before each game kicks off.
        </p>

        {Object.entries(grouped).map(([date, dayGames]) => (
          <div key={date} className="mb-8">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">{date}</div>

            <div className="flex flex-col gap-3">
              {dayGames.map(game => {
                const tip = tips[game.id]
                const inp = tipInputs[game.id] ?? { h: '', a: '' }
                const isClosed = game.status !== 'scheduled'
                const pts = tip?.points

                return (
                  <div key={game.id} className={`card p-4 ${game.status === 'live' ? 'border-red-800/60' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <StatusBadge game={game} />
                      <span className="text-xs text-slate-500">{game.group_stage}</span>
                    </div>

                    {/* Teams + Score */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex-1 text-right font-semibold text-slate-100 text-sm">
                        {game.home_flag} {game.home_team}
                      </span>
                      <span className={`score-box ${game.status === 'live' ? 'bg-red-950/50 text-red-300' : ''}`}>
                        {game.status === 'scheduled'
                          ? '–:–'
                          : `${game.home_score ?? 0}:${game.away_score ?? 0}`}
                      </span>
                      <span className="flex-1 font-semibold text-slate-100 text-sm">
                        {game.away_flag} {game.away_team}
                      </span>
                    </div>

                    {/* Tip row */}
                    <div className="border-t border-slate-800 pt-3 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500">Your tip:</span>
                      {isClosed ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-slate-300">
                            {tip ? `${tip.tip_home}:${tip.tip_away}` : '—'}
                          </span>
                          {tip && pts !== null && pts !== undefined && <PointsBadge pts={pts} />}
                          {!tip && <span className="text-xs text-slate-600">No prediction entered</span>}
                        </div>
                      ) : (
                        <>
                          <input
                            type="number" min={0} max={20}
                            value={inp.h}
                            onChange={e => setTipInputs(t => ({ ...t, [game.id]: { ...inp, h: e.target.value } }))}
                            className="w-12 input text-center py-1 px-1 text-sm"
                            placeholder="0"
                          />
                          <span className="text-slate-500">:</span>
                          <input
                            type="number" min={0} max={20}
                            value={inp.a}
                            onChange={e => setTipInputs(t => ({ ...t, [game.id]: { ...inp, a: e.target.value } }))}
                            className="w-12 input text-center py-1 px-1 text-sm"
                            placeholder="0"
                          />
                          <button
                            onClick={() => saveTip(game.id)}
                            disabled={saving[game.id]}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            {saving[game.id] ? '…' : saved[game.id] ? '✓ Saved!' : tip ? 'Update' : 'Save tip'}
                          </button>
                          {tip && !saved[game.id] && (
                            <span className="text-xs text-slate-500 font-mono">
                              Current: {tip.tip_home}:{tip.tip_away}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {games.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            Games will appear here once the schedule is loaded.
          </div>
        )}
      </div>
    </div>
  )
}
