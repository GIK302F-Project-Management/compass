import { useEffect, useMemo, useState } from 'react'
import { isSessionDone, toggleSession } from '../api/routeProgress'
import { loadRoute } from '../api/studyPlans'
import { listTasks, type Task } from '../api/tasks'

// The saved route plus the tasks it schedules, for pages that show the route's progress
// (the home page trail and card). Ticking a session here updates both the route and the task.
export function useRouteProgress(ownerEmail: string) {
  const [route, setRoute] = useState(() => (ownerEmail ? loadRoute(ownerEmail) : null))
  const [tasks, setTasks] = useState<Task[] | null>(null)

  useEffect(() => {
    if (!route) return
    const activityIds = [...new Set(Object.values(route.goals).map((info) => info.activityId))]
    Promise.all(activityIds.map((id) => listTasks(id))).then((lists) => setTasks(lists.flat()))
    // The route's activities only change when a new route is plotted (new createdAt).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.createdAt])

  const taskById = useMemo(() => new Map((tasks ?? []).map((task) => [task.id, task])), [tasks])

  async function toggle(index: number) {
    if (!route) return
    const result = await toggleSession(ownerEmail, route, index, taskById)
    setRoute(result.route)
    const updated = result.task
    if (updated) setTasks((current) => current?.map((task) => (task.id === updated.id ? updated : task)) ?? null)
  }

  const isDone = (index: number) => !!route && isSessionDone(route, index, taskById)

  return { route, ready: !!route && tasks !== null, taskById, isDone, toggle }
}
