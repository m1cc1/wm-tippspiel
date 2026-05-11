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
  let pts = 0

  // +1 per correct team goals
  if (tipHome === realHome) pts += 1
  if (tipAway === realAway) pts += 1

  // +3 correct goal difference
  if ((tipHome - tipAway) === (realHome - realAway)) pts += 3

  // +5 correct winner/draw
  if (getOutcome(tipHome, tipAway) === getOutcome(realHome, realAway)) pts += 5

  // Max 10 pts total (exact score = 1+1+3+5 = 10)
  return pts
}

export const BONUS_POINTS = 20  // tournament winner + top scorer nationality
