import { useCallback, useEffect, useState } from 'react'
import { listActivities, type Activity } from './api/activities'
import { listAtlasTasks, type Task } from './api/tasks'

// The student's atlas: their activities and every task in them. The home page loads it once and shares it
// between the atlas and the progress cards, so both always agree.
export function useAtlas() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [problem, setProblem] = useState<string | null>(null)

  const reload = useCallback(() => {
    return Promise.all([listActivities(), listAtlasTasks()])
      .then(([foundActivities, foundTasks]) => {
        setActivities(foundActivities)
        setTasks(foundTasks)
        setProblem(null)
      })
      .catch(() => setProblem('Could not load the activities. Refresh the page to try again.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  // A task changed somewhere else on the page (ticked on the route).
  const replaceTask = useCallback((updated: Task) => {
    setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)))
  }, [])

  return { activities, setActivities, tasks, loading, problem, setProblem, reload, replaceTask }
}

export type AtlasState = ReturnType<typeof useAtlas>
