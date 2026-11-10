import { useEffect, useMemo, useState } from 'react'
import { isSessionDone, toggleSession } from './api/routeProgress'
import { loadRoute, type RouteScope } from './api/savedRoute'
import { listPlanTasks, type Task } from '@/features/activities/api/tasks'

// The saved route plus the tasks it schedules, for pages that show the route's progress
// (the home page trail and card). Ticking a session here updates both the route and the task.
export function useRouteProgress(scope: RouteScope) {
  const [route, setRoute] = useState(() => (scope.ownerEmail ? loadRoute(scope) : null))
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [problem, setProblem] = useState<string | null>(null)

  useEffect(() => {
    if (!route) return
    listPlanTasks(scope.planId)
      .then(setTasks)
      .catch(() => undefined) // without its tasks the route stays hidden (ready stays false) instead of breaking the page
    // The route's activities only change when a new route is plotted (new createdAt).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.createdAt])

  const taskById = useMemo(() => new Map((tasks ?? []).map((task) => [task.id, task])), [tasks])

  async function toggle(index: number) {
    if (!route) return
    try {
      const result = await toggleSession(scope, route, index, taskById)
      setRoute(result.route)
      const updated = result.task
      if (updated) setTasks((current) => current?.map((task) => (task.id === updated.id ? updated : task)) ?? null)
      setProblem(null)
    } catch {
      setProblem('Could not save that change. Please try again.')
    }
  }

  const isDone = (index: number) => !!route && isSessionDone(route, index, taskById)

  return { route, ready: !!route && tasks !== null, taskById, isDone, toggle, problem }
}
