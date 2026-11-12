import { useEffect, useMemo, useState } from 'react'
import { isSessionDone, toggleSession } from './api/routeProgress'
import { loadRoute, type RouteScope } from './api/savedRoute'
import { listAtlasTasks, type Task } from '@/features/activities/api/tasks'

// Where the home page stands with the route:
// none    -> no route saved yet
// loading -> a route is saved and its tasks are being fetched
// failed  -> the tasks could not be fetched (the page offers to try again)
// ready   -> the route and its tasks are there
export type RouteStatus = 'none' | 'loading' | 'failed' | 'ready'

// The saved route plus the tasks it schedules, for pages that show the route's progress
// (the home page trail and card). Ticking a session here updates both the route and the task;
// `onTaskChanged` hears about the task, so the rest of the page can follow.
export function useRouteProgress(scope: RouteScope, onTaskChanged?: (task: Task) => void) {
  const [route, setRoute] = useState(() => (scope.ownerEmail ? loadRoute(scope) : null))
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [problem, setProblem] = useState<string | null>(null)

  useEffect(() => {
    if (!route) return
    listAtlasTasks()
      .then(setTasks)
      .catch(() => setLoadFailed(true))
    // Fetch again when a new route is plotted (new createdAt) or the student asks to try again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.createdAt, attempt])

  function retry() {
    setLoadFailed(false)
    setAttempt((current) => current + 1)
  }

  const taskById = useMemo(() => new Map((tasks ?? []).map((task) => [task.id, task])), [tasks])

  async function toggle(index: number) {
    if (!route) return
    try {
      const result = await toggleSession(scope, route, index, taskById)
      setRoute(result.route)
      const updated = result.task
      if (updated) {
        setTasks((current) => current?.map((task) => (task.id === updated.id ? updated : task)) ?? null)
        onTaskChanged?.(updated)
      }
      setProblem(null)
    } catch {
      setProblem('Could not save that change. Please try again.')
    }
  }

  const isDone = (index: number) => !!route && isSessionDone(route, index, taskById)

  let status: RouteStatus
  if (!route) status = 'none'
  else if (tasks !== null) status = 'ready'
  else if (loadFailed) status = 'failed'
  else status = 'loading'

  return { route, status, ready: status === 'ready', taskById, isDone, toggle, retry, problem }
}
