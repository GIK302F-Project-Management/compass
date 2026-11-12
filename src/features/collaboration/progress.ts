import type { ActivityProgress, Member } from './api/sharing'

// The little this needs from a task (the activities feature passes its own tasks in).
type SharedTask = { assigneeId: string | null; done: boolean }

// How the tasks of a shared activity are shared out, worked out from what the page already has, so it follows
// every change at once. The same numbers as GET /activities/<id>/progress on the backend.
export function progressOf(tasks: SharedTask[], members: Member[]): ActivityProgress {
  const done = tasks.filter((task) => task.done).length
  return {
    tasksTotal: tasks.length,
    tasksDone: done,
    tasksUnassigned: tasks.filter((task) => task.assigneeId === null).length,
    percent: tasks.length === 0 ? 0 : Math.round((100 * done) / tasks.length),
    members: members.map((member) => {
      const theirs = tasks.filter((task) => task.assigneeId === member.userId)
      return {
        userId: member.userId,
        name: member.name,
        tasksAssigned: theirs.length,
        tasksDone: theirs.filter((task) => task.done).length,
      }
    }),
  }
}
