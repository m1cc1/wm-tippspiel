import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calcPoints } from '@/lib/scoring'

// This endpoint is called by a cron job (e.g. Vercel Cron) every 60 seconds.
// Protect it with a secret header to prevent public abuse.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const FD_API = 'https://api.football-data.org/v4'
const FD_KEY = process.env.FOOTBALL_DATA_API_KEY!

// FIFA World Cup 2026 competition ID on football-data.org (update when live)
const WC_ID = 2000

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch matches from football-data.org
    const res = await fetch(`${FD_API}/competitions/${WC_ID}/matches`, {
      headers: { 'X-Auth-Token': FD_KEY },
      next: { revalidate: 0 },
    })
    if (!res.ok) throw new Error(`football-data.org error: ${res.status}`)
    const json = await res.json()
    const matches = json.matches ?? []

    for (const match of matches) {
      const extId: number = match.id
      const status: 'scheduled' | 'live' | 'finished' =
        match.status === 'FINISHED' ? 'finished'
        : ['IN_PLAY', 'PAUSED'].includes(match.status) ? 'live'
        : 'scheduled'
      const homeScore: number | null = match.score?.fullTime?.home ?? null
      const awayScore: number | null = match.score?.fullTime?.away ?? null
      const minute: number | null = match.minute ?? null

      // Update the game row
      const { data: updated } = await supabase
        .from('games')
        .update({ status, home_score: homeScore, away_score: awayScore, minute })
        .eq('external_id', extId)
        .select('id')
        .single()

      if (!updated) continue

      // Recalculate points for all tips on this game if finished
      if (status === 'finished' && homeScore !== null && awayScore !== null) {
        const { data: gameTips } = await supabase
          .from('tips')
          .select('id, tip_home, tip_away')
          .eq('game_id', updated.id)

        for (const t of (gameTips ?? [])) {
          const pts = calcPoints(t.tip_home, t.tip_away, homeScore, awayScore)
          await supabase.from('tips').update({ points: pts }).eq('id', t.id)
        }

        // Refresh aggregate points in profiles
        await supabase.rpc('refresh_profile_points')
      }
    }

    return NextResponse.json({ ok: true, synced: matches.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
