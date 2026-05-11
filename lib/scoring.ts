export type Outcome = 'home' | 'draw' | 'away'

export function getOutcome(home: number, away: number): Outcome {
  if (home > away) return 'home'
  if (home < away) return 'away'
  return 'draw'
}

export function calcPoints(
  tipHome: number, tipAway: number,
  realHome: number, realAway: number
): number {
  if (tipHome === realHome && tipAway === realAway) return 3   // exact
  if (getOutcome(tipHome, tipAway) === getOutcome(realHome, realAway)) return 1 // tendency
  return 0
}
