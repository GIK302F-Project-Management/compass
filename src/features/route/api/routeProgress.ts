import type { StudySession } from '@/shared/api/studyPlans'
import { saveRoute, sessionAt, type SavedRoute } from './savedRoute'
import { updateTask, type Task } from '@/features/activities/api/tasks'

// Shared by the route page and the "Today on your route" card on the home page.

// A session counts as done when it was ticked off or when its whole task is done.
export function isSessionDone(route: SavedRoute, index: number, taskById: Map<string, Task>) {
  return route.checked.includes(index) || !!taskById.get(sessionAt(route, index).goalId)?.done
}

// Ticking every session of a task marks the task done; unticking one reopens it.
// Saves the route and returns it with the task when the task changed.
export async function toggleSession(
  ownerEmail: string,
  route: SavedRoute,
  index: number,
  taskById: Map<string, Task>,
): Promise<{ route: SavedRoute; task: Task | null }> {
  const taskId = sessionAt(route, index).goalId
  const task = taskById.get(taskId)
  if (!task) return { route, task: null }
  const siblings = route.sessions.flatMap((item, i) => (item.goalId === taskId ? [i] : []))

  let checked: number[]
  let done: boolean
  if (isSessionDone(route, index, taskById)) {
    // When the task was done, its sessions all looked ticked: keep the others ticked.
    const base = task.done ? [...new Set([...route.checked, ...siblings])] : route.checked
    checked = base.filter((i) => i !== index)
    done = false
  } else {
    checked = [...route.checked, index]
    done = siblings.every((i) => checked.includes(i))
  }

  const updatedRoute = { ...route, checked }
  saveRoute(ownerEmail, updatedRoute)
  const updatedTask = done !== task.done ? await updateTask(task.id, { done }) : null
  return { route: updatedRoute, task: updatedTask }
}

// What to show for a session: the AI writes its own activity name, while the rule-based planner
// reuses the goal title, so the task name is shown as the title in that case.
export function sessionLabel(route: SavedRoute, item: StudySession) {
  const info = route.goals[item.goalId]
  const goalTitle = route.request.goals.find((goal) => goal.id === item.goalId)?.title
  const aiTitle = item.title !== goalTitle
  const context = info
    ? [aiTitle ? info.taskTitle : null, info.activityTitle, info.subject].filter(Boolean).join(' · ')
    : ''
  return { title: aiTitle || !info ? item.title : info.taskTitle, context }
}
