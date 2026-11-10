import type { SavedRoute } from '../api/studyPlans'

// The route seen day by day, relative to today. Shared by the home page trail and card.

export type RouteDay = {
  date: string
  sessions: number[] // indexes in route.sessions
  deadlines: string[] // goal ids due that day
  minutes: number
}

export function routeDays(route: SavedRoute): RouteDay[] {
  const days = new Map<string, RouteDay>()
  const dayFor = (date: string) => {
    if (!days.has(date)) days.set(date, { date, sessions: [], deadlines: [], minutes: 0 })
    return days.get(date)!
  }
  route.sessions.forEach((item, index) => {
    const day = dayFor(item.date)
    day.sessions.push(index)
    day.minutes += item.durationMinutes
  })
  for (const goal of route.request.goals) dayFor(goal.deadline).deadlines.push(goal.id)
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function routeSummary(route: SavedRoute, isDone: (index: number) => boolean, today: string) {
  const indexes = route.sessions.map((_, index) => index)
  const doneCount = indexes.filter(isDone).length
  const behind = indexes.filter((index) => route.sessions[index].date < today && !isDone(index)).length
  const hasFuture = route.sessions.some((item) => item.date >= today)
  const finished = doneCount === route.sessions.length || (!hasFuture && behind === 0)
  return { doneCount, total: route.sessions.length, behind, hasFuture, finished }
}
