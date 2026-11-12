import type { SavedRoute } from './api/savedRoute'

// How the student is doing against their route: the sessions planned before today are what they should have
// done by now, and every ticked session is what they did (ticking tomorrow's session early puts them ahead).

export type PaceLevel = 'good' | 'tight' | 'bad'

export type Pace = {
  level: PaceLevel
  label: string // "On track", "Ahead", "Slightly behind", "Behind"
  totalMinutes: number // the whole route
  doneMinutes: number
  expectedMinutes: number // what the route planned before today
  behindMinutes: number // planned before today and not done
  aheadMinutes: number // done although planned for today or later
  missedSessions: number
}

export function routePace(route: SavedRoute, isDone: (index: number) => boolean, today: string): Pace {
  let total = 0
  let done = 0
  let expected = 0
  let behind = 0
  let ahead = 0
  let missed = 0
  route.sessions.forEach((session, index) => {
    const minutes = session.durationMinutes
    const past = session.date < today
    total += minutes
    if (past) expected += minutes
    if (isDone(index)) {
      done += minutes
      if (!past) ahead += minutes
    } else if (past) {
      behind += minutes
      missed += 1
    }
  })

  // Behind by up to one study day can be caught up on the next one; more than that needs a new route.
  const oneDay = route.request.dailyAvailableMinutes
  let level: PaceLevel
  let label: string
  if (behind === 0) [level, label] = ['good', ahead > 0 ? 'Ahead' : 'On track']
  else if (behind <= oneDay) [level, label] = ['tight', 'Slightly behind']
  else [level, label] = ['bad', 'Behind']

  return {
    level,
    label,
    totalMinutes: total,
    doneMinutes: done,
    expectedMinutes: expected,
    behindMinutes: behind,
    aheadMinutes: ahead,
    missedSessions: missed,
  }
}
