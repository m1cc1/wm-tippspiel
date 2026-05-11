export interface Game {
  id: string
  home_team: string
  away_team: string
  home_flag: string
  away_flag: string
  kickoff: string          // ISO datetime
  group_stage: string      // e.g. "Group A", "Round of 16"
  status: 'scheduled' | 'live' | 'finished'
  home_score: number | null
  away_score: number | null
  minute: number | null
  external_id: number | null  // football-data.org match ID
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
  total_points: number
  exact_count: number
  tendency_count: number
}

export interface LeaderboardEntry extends Profile {
  rank: number
  delta: number   // live points change from ongoing games
}
