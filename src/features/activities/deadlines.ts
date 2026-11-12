import type { Activity } from './api/activities'
import type { Task } from './api/tasks'
import { daysBetween } from '@/shared/utils/dates'

// Whether the student can still make each deadline, from the work they have left and the time they have.
//
// The work is the estimates of the student's own open tasks (on a shared activity, the ones assigned to them).
// The time is their study minutes per day from today up to the deadline. Deadlines are checked in order and the
// load adds up: an activity due on the 20th also has to make room for everything due before it, since those days
// are spent on that too.

export type Level = 'good' | 'tight' | 'bad' | 'none' // none: done, or nothing to measure yet

export type DeadlineStatus = {
  level: Level
  label: string // "On track", "Tight", "At risk", "Overdue", "Done", ...
  remainingMinutes: number // the student's estimated work left on this activity
  loadMinutes: number // that plus everything due before it
  capacityMinutes: number // study time from today to the deadline
  missingEstimates: number // open tasks of the student without an estimate (not counted in the work)
  daysLeft: number // 0 on the due date, negative once it has passed
}

const TIGHT_FROM = 0.8 // from 80% of the available time on, there is little room left for surprises

export function deadlineStatuses(
  activities: Activity[],
  tasks: Task[],
  userId: string,
  dailyMinutes: number,
  today: string,
): Map<string, DeadlineStatus> {
  const statuses = new Map<string, DeadlineStatus>()
  const open = activities.filter((activity) => !activity.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  let load = 0

  for (const activity of activities.filter((item) => item.done)) {
    statuses.set(activity.id, {
      ...EMPTY,
      level: 'none',
      label: 'Done',
      daysLeft: daysBetween(today, activity.dueDate),
    })
  }

  for (const activity of open) {
    const all = tasks.filter((task) => task.activityId === activity.id)
    const mine = all.filter((task) => task.assigneeId === userId && !task.done)
    const remaining = mine.reduce((sum, task) => sum + (task.estimatedMinutes ?? 0), 0)
    const missing = mine.filter((task) => !task.estimatedMinutes).length
    const daysLeft = daysBetween(today, activity.dueDate)
    load += remaining
    // The due date itself counts as a study day.
    const capacity = Math.max(0, daysLeft + 1) * dailyMinutes
    const base = {
      remainingMinutes: remaining,
      loadMinutes: load,
      capacityMinutes: capacity,
      missingEstimates: missing,
      daysLeft,
    }

    let level: Level
    let label: string
    if (all.length === 0) [level, label] = ['none', 'No tasks yet']
    else if (mine.length === 0) [level, label] = ['good', 'Your part is done']
    else if (daysLeft < 0) [level, label] = ['bad', 'Overdue']
    else if (remaining === 0) [level, label] = ['none', 'No estimate']
    else if (load > capacity) [level, label] = ['bad', 'At risk']
    else if (load > capacity * TIGHT_FROM) [level, label] = ['tight', 'Tight']
    else [level, label] = ['good', 'On track']

    statuses.set(activity.id, { ...base, level, label })
  }
  return statuses
}

const EMPTY: Omit<DeadlineStatus, 'level' | 'label' | 'daysLeft'> = {
  remainingMinutes: 0,
  loadMinutes: 0,
  capacityMinutes: 0,
  missingEstimates: 0,
}

// The order the home page lists problems in: the worst first, then the soonest.
const SEVERITY: Record<Level, number> = { bad: 0, tight: 1, good: 2, none: 3 }

export function mostUrgent(activities: Activity[], statuses: Map<string, DeadlineStatus>) {
  return activities
    .filter((activity) => !activity.done && statuses.has(activity.id))
    .map((activity) => ({ activity, status: statuses.get(activity.id)! }))
    .sort(
      (a, b) =>
        SEVERITY[a.status.level] - SEVERITY[b.status.level] || a.activity.dueDate.localeCompare(b.activity.dueDate),
    )
}

// How much of a list of tasks is done, by their estimates: a 5-hour task weighs more than a 15-minute one.
// Tasks without an estimate are only counted in `unestimated`.
export function workOf(tasks: { estimatedMinutes: number | null; done: boolean }[]) {
  const estimated = tasks.filter((task) => task.estimatedMinutes)
  const total = estimated.reduce((sum, task) => sum + task.estimatedMinutes!, 0)
  const done = estimated.filter((task) => task.done).reduce((sum, task) => sum + task.estimatedMinutes!, 0)
  return { totalMinutes: total, doneMinutes: done, unestimated: tasks.length - estimated.length }
}
