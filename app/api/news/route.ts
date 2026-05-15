import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RSS_FEEDS = [
  'https://www.fifa.com/en/tournament-news/rss',
  'https://feeds.bbci.co.uk/sport/football/rss.xml',
  'https://www.skysports.com/rss/12040',
]

const CACHE_TTL_MS = 2 * 60 * 60 * 1000

interface NewsItem {
  title: string
  link: string
  tag: string
  time: string
  pubDate: number
}

function parseRSS(xml: string, tag: string): NewsItem[] {
  const items: NewsItem[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/) || [])[1] || ''
    const link  = (block.match(/<link>(https?:[^<]+)<\/link>/) || block.match(/<guid>(https?:[^<]+)<\/guid>/) || [])[1] || 'https://www.fifa.com'
    const pub   = (block.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || ''
    const pubMs = pub ? new Date(pub).getTime() : Date.now()
    const ageH  = Math.round((Date.now() - pubMs) / 3_600_000)
    const timeStr = ageH < 1 ? 'Just now' : ageH < 24 ? `${ageH}h ago` : `${Math.round(ageH / 24)}d ago`
    if (title.trim()) items.push({ title: title.trim(), link: link.trim(), tag, time: timeStr, pubDate: pubMs })
  }
  return items.slice(0, 8)
}

function fallback(): NewsItem[] {
  return [
    { title: 'World Cup 2026 — the biggest tournament in history kicks off June 11 in Mexico City', link: 'https://www.fifa.com', tag: 'Preview', time: 'Coming soon', pubDate: Date.now() },
    { title: 'Record 5.8 million tickets sold for World Cup 2026 across USA, Canada and Mexico', link: 'https://www.fifa.com', tag: 'Official', time: '2d ago', pubDate: Date.now() },
    { title: 'All 48 nations confirmed for the expanded 2026 World Cup group stage', link: 'https://www.fifa.com', tag: 'Teams', time: '3d ago', pubDate: Date.now() },
    { title: 'A guide to all 16 World Cup venues — from MetLife to Estadio Azteca', link: 'https://www.fifa.com', tag: 'Venues', time: '5d ago', pubDate: Date.now() },
  ]
}

export async function GET() {
  // Create client inside handler so env vars are available at runtime
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Check cache
    const { data: cached } = await supabase
      .from('settings').select('value, updated_at').eq('key', 'news_cache').single()

    if (cached?.value && cached?.updated_at) {
      const age = Date.now() - new Date(cached.updated_at).getTime()
      if (age < CACHE_TTL_MS) return NextResponse.json(JSON.parse(cached.value))
    }

    // Fetch fresh
    let articles: NewsItem[] = []
    for (const url of RSS_FEEDS) {
      try {
        const res = await fetch(url, { headers: {'User-Agent':'WC2026/1.0'}, signal: AbortSignal.timeout(5000) })
        if (!res.ok) continue
        const xml = await res.text()
        const tag = url.includes('fifa') ? 'FIFA' : url.includes('bbc') ? 'BBC Sport' : 'Sky Sports'
        articles.push(...parseRSS(xml, tag))
        if (articles.length >= 6) break
      } catch { /* try next */ }
    }

    const wc = ['world cup','2026','wc26','fifa','tournament','qualifier','group stage','mbappe','ronaldo','messi']
    const filtered = articles
      .filter(a => wc.some(kw => a.title.toLowerCase().includes(kw)))
      .sort((a, b) => b.pubDate - a.pubDate)
      .slice(0, 4)

    const result = filtered.length >= 2 ? filtered : articles.sort((a,b) => b.pubDate - a.pubDate).slice(0, 4)

    if (result.length > 0) {
      await supabase.from('settings').upsert({ key: 'news_cache', value: JSON.stringify(result) })
    }

    return NextResponse.json(result.length > 0 ? result : fallback())
  } catch {
    return NextResponse.json(fallback())
  }
}
