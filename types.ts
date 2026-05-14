export interface Game {
  id: string
  home_team: string
  away_team: string
  home_flag: string
  away_flag: string
  kickoff: string
  group_stage: string
  venue: string
  status: 'scheduled' | 'live' | 'finished'
  home_score: number | null
  away_score: number | null
  minute: number | null
  external_id: number | null
}

export interface Tip {
  id: string
  user_id: string
  game_id: string
  tip_home: number
  tip_away: number
  points: number | null
}

export interface Profile {
  id: string
  display_name: string
  status: string
  total_points: number
  exact_count: number
  tendency_count: number
}

export interface LeaderboardEntry extends Profile {
  rank: number
  delta: number
}
