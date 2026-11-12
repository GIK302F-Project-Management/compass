import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { getActivity, setActivityDone, type Activity as ActivitySheet } from './api/activities'
import { deleteTask, listTasks, updateTask, type Task } from './api/tasks'
import { listMembers, removeMember, type Member } from '@/features/collaboration/api/sharing'
import { progressOf } from '@/features/collaboration/progress'
import { InvitationsPanel } from '@/features/collaboration/InvitationsPanel'
import { MembersPanel } from '@/features/collaboration/MembersPanel'
import { ProgressPanel } from '@/features/collaboration/ProgressPanel'
import { MemberAvatar } from '@/features/collaboration/MemberAvatar'
import { memberTones } from '@/features/collaboration/tones'
import { AppHeader } from '@/shared/layout/AppHeader'
import { PencilIcon, TrashIcon } from '@/shared/ui/Icons'
import { TaskForm } from './TaskForm'
import { workOf } from './deadlines'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { Main } from '@/shared/layout/Main'
import { daysBetween, formatDueDate, todayIso } from '@/shared/utils/dates'
import { formatMinutes } from '@/shared/utils/duration'
import './ActivityPage.css'

const NOBODY = '' // the value of "Nobody yet" in the assignee menu

export function ActivityPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [activity, setActivity] = useState<ActivitySheet | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [onlyMine, setOnlyMine] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const doneCount = tasks.filter((task) => task.done).length

  const me = members.find((member) => member.you)
  const nameOf = (userId: string | null) => members.find((member) => member.userId === userId)?.name
  // With classmates in it, every task says who does it; alone, every task is the student's anyway.
  const shared = members.length > 1
  const isOwner = activity?.role === 'OWNER'

  useEffect(() => {
    Promise.all([getActivity(id), listTasks(id)])
      .then(([foundActivity, foundTasks]) => {
        setActivity(foundActivity)
        setTasks(foundTasks)
        // The members are a nicety for a sheet of one's own; a shared sheet shows who does what with them.
        if (foundActivity) {
          listMembers(foundActivity.id)
            .then(setMembers)
            .catch(() => undefined)
        }
      })
      .catch(() => setProblem('Could not load the activity. Refresh the page to try again.'))
      .finally(() => setLoading(false))
  }, [id])

  // Another member's change shows up on the next load; the server also reopens a completed activity
  // when a task is added to it or reopened, so the page mirrors that.
  function reopenLocally() {
    setActivity((current) => (current?.done ? { ...current, done: false, doneBy: null } : current))
  }

  async function toggleActivityDone() {
    if (!activity) return
    try {
      const updated = await setActivityDone(activity.id, !activity.done)
      setActivity(updated)
      if (updated.done) setTasks(await listTasks(updated.id)) // completing the activity completes its tasks
      setProblem(null)
    } catch {
      setProblem('Could not update the activity. Please try again.')
    }
  }

  function replaceTask(updated: Task) {
    setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)))
  }

  async function toggleTask(task: Task) {
    try {
      const updated = await updateTask(task.id, { done: !task.done })
      replaceTask(updated)
      if (!updated.done) reopenLocally()
      setProblem(null)
    } catch {
      setProblem('Could not update the task. Please try again.')
    }
  }

  async function assign(task: Task, userId: string) {
    try {
      replaceTask(await updateTask(task.id, { assigneeId: userId === NOBODY ? null : userId }))
      setProblem(null)
    } catch {
      setProblem(`Could not change who does "${task.title}". Please try again.`)
    }
  }

  function openNewForm() {
    setEditingId(null)
    setFormOpen(true)
  }

  function openEditForm(taskId: string) {
    setFormOpen(false)
    setEditingId(taskId)
  }

  function handleCreated(task: Task) {
    setTasks([...tasks, task])
    reopenLocally()
    setFormOpen(false)
  }

  function handleUpdated(task: Task) {
    replaceTask(task)
    setEditingId(null)
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return
    try {
      await deleteTask(task.id)
      setTasks(tasks.filter((item) => item.id !== task.id))
      setProblem(null)
    } catch {
      setProblem(`Could not delete "${task.title}". Please try again.`)
    }
  }

  async function handleRemove(member: Member) {
    if (!activity || !window.confirm(`Remove ${member.name} from this activity? Their tasks will have nobody.`)) return
    try {
      await removeMember(activity.id, member.userId)
      const [foundMembers, foundTasks] = await Promise.all([listMembers(activity.id), listTasks(activity.id)])
      setMembers(foundMembers)
      setTasks(foundTasks)
      setProblem(null)
    } catch {
      setProblem('Could not remove the member. Please try again.')
    }
  }

  async function handleLeave() {
    if (!activity || !me) return
    if (!window.confirm(`Leave "${activity.title}"? It leaves your atlas, and your tasks in it will have nobody.`))
      return
    try {
      await removeMember(activity.id, me.userId)
      navigate('/home')
    } catch {
      setProblem('Could not leave the activity. Please try again.')
    }
  }

  if (loading) {
    return (
      <>
        <AppHeader title="Activity" />
        <Main className="activity-page">
          <p role="status">Loading the activity...</p>
        </Main>
      </>
    )
  }

  if (!activity) {
    return (
      <>
        <AppHeader title="Activity" />
        <Main className="activity-page">
          <p>This activity could not be found. It may have been deleted, or you are no longer in it.</p>
          <p>
            <Link to="/home" className="text-link">
              Back to the atlas
            </Link>
          </p>
        </Main>
      </>
    )
  }

  const work = workOf(tasks)
  const myWork = workOf(me ? tasks.filter((task) => task.assigneeId === me.userId) : [])
  const daysLeft = daysBetween(todayIso(), activity.dueDate)
  const tones = memberTones(members)
  // On a shared sheet each task wears the color of whoever does it: the student's own stand out.
  const ownership = (task: Task) =>
    !shared ? '' : task.assigneeId === null ? ' nobody' : task.assigneeId === me?.userId ? ' mine' : ' theirs'
  const visibleTasks = onlyMine && me ? tasks.filter((task) => task.assigneeId === me.userId) : tasks
  const doneByName = nameOf(activity.doneBy)

  return (
    <>
      <AppHeader title="Activity" />

      <Main className="activity-page">
        <header className="activity-header">
          <p className="kicker">
            {activity.subject ? `${activity.subject} · ` : ''}Due {formatDueDate(activity.dueDate)}
            {shared && ` · Shared with ${members.length - 1} ${members.length === 2 ? 'classmate' : 'classmates'}`}
          </p>
          <h2>{activity.title}</h2>
          {activity.done && (
            <p className="activity-done" role="status">
              Done
              {doneByName ? ` · completed by ${doneByName}` : ''}
            </p>
          )}
          {problem && <p role="alert">{problem}</p>}
          <div className="activity-actions">
            <button type="button" className="button button-small" onClick={toggleActivityDone}>
              {activity.done ? 'Reopen activity' : 'Mark activity as done'}
            </button>
          </div>
          {tasks.length === 0 && <p className="activity-progress">No tasks yet. Add the first step of this route.</p>}
          {tasks.length > 0 && work.totalMinutes === 0 && (
            <>
              <p className="activity-progress">
                <em>{doneCount}</em> of {tasks.length} tasks done
              </p>
              <ProgressBar value={doneCount} max={tasks.length} label="Tasks done" />
            </>
          )}
          {work.totalMinutes > 0 && (
            <>
              <p className="activity-progress">
                <em>{formatMinutes(work.doneMinutes)}</em> of {formatMinutes(work.totalMinutes)} of work done
                {' · '}
                {doneCount} of {tasks.length} tasks
                {daysLeft >= 0 &&
                  !activity.done &&
                  ` · ${daysLeft === 0 ? 'due today' : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`}`}
              </p>
              <ProgressBar
                value={work.doneMinutes}
                max={work.totalMinutes}
                label="Work done"
                valueText={`${formatMinutes(work.doneMinutes)} of ${formatMinutes(work.totalMinutes)} done`}
              />
            </>
          )}
          {shared && myWork.totalMinutes > 0 && (
            <div className="activity-my-part">
              <p className="activity-progress">
                Your part: <em>{formatMinutes(myWork.doneMinutes)}</em> of {formatMinutes(myWork.totalMinutes)} done
              </p>
              <ProgressBar
                value={myWork.doneMinutes}
                max={myWork.totalMinutes}
                label="Your part done"
                level={myWork.doneMinutes === myWork.totalMinutes ? 'good' : undefined}
              />
            </div>
          )}
          {work.unestimated > 0 && (
            <p className="activity-hint">
              {work.unestimated} {work.unestimated === 1 ? 'task has' : 'tasks have'} no estimate, so the hours leave{' '}
              {work.unestimated === 1 ? 'it' : 'them'} out. Edit a task to add one.
            </p>
          )}
          {shared && tasks.length > 0 && (
            <label className="task-filter">
              <input type="checkbox" checked={onlyMine} onChange={(event) => setOnlyMine(event.target.checked)} />
              Show only my tasks
            </label>
          )}
        </header>

        <ol className="task-list" aria-label="Tasks">
          {visibleTasks.map((task) => {
            const number = tasks.indexOf(task) + 1
            if (task.id === editingId) {
              return (
                <li key={task.id} className="task task-draft">
                  <span className="task-marker" aria-hidden="true" />
                  <TaskForm activityId={id} task={task} onSaved={handleUpdated} onCancel={() => setEditingId(null)} />
                </li>
              )
            }
            return (
              <li
                key={task.id}
                className={`task${task.done ? ' done' : ''}${ownership(task)} ${(task.assigneeId && tones.get(task.assigneeId)) || ''}`}
              >
                <input type="checkbox" id={`task-${task.id}`} checked={task.done} onChange={() => toggleTask(task)} />
                <label htmlFor={`task-${task.id}`}>
                  <span className="kicker">
                    Task {String(number).padStart(2, '0')}
                    {task.dueDate && ` · Due ${formatDueDate(task.dueDate)}`}
                    {task.estimatedMinutes ? ` · ~${formatMinutes(task.estimatedMinutes)}` : ''}
                  </span>
                  <span className="task-title">{task.title}</span>
                </label>
                <div className="task-actions">
                  <button
                    className="button button-small button-icon"
                    onClick={() => openEditForm(task.id)}
                    aria-label={`Edit ${task.title}`}
                    title="Edit"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    className="button button-small button-icon button-danger"
                    onClick={() => handleDelete(task)}
                    aria-label={`Delete ${task.title}`}
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>
                {shared && (
                  <div className={`task-assignee${task.assigneeId === null ? ' nobody' : ''}`}>
                    {task.assigneeId && tones.has(task.assigneeId) && (
                      <MemberAvatar name={nameOf(task.assigneeId) ?? ''} tone={tones.get(task.assigneeId)!} />
                    )}
                    {task.assigneeId !== null && task.assigneeId === me?.userId && (
                      <span className="task-yours">Yours</span>
                    )}
                    <select
                      aria-label={`Who does ${task.title}`}
                      value={task.assigneeId ?? NOBODY}
                      onChange={(event) => assign(task, event.target.value)}
                    >
                      <option value={NOBODY}>Nobody yet</option>
                      {members.map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.you ? `${member.name} (you)` : member.name}
                        </option>
                      ))}
                    </select>
                    {task.assigneeId === null && me && (
                      <button type="button" className="text-link button-link" onClick={() => assign(task, me.userId)}>
                        Take it
                      </button>
                    )}
                  </div>
                )}
                {task.details && <p className="task-details">{task.details}</p>}
              </li>
            )
          })}
          {formOpen ? (
            <li className="task task-draft">
              <span className="task-marker" aria-hidden="true" />
              <TaskForm activityId={id} onSaved={handleCreated} onCancel={() => setFormOpen(false)} />
            </li>
          ) : (
            <li className="task task-add">
              <span className="task-marker" aria-hidden="true" />
              <button className="button button-small" onClick={openNewForm}>
                + Add task
              </button>
            </li>
          )}
        </ol>

        {(shared || isOwner) && (
          <section className="activity-sharing" aria-label="Sharing">
            {shared && <ProgressPanel progress={progressOf(tasks, members)} members={members} />}
            {shared && (
              <MembersPanel members={members} isOwner={isOwner} onRemove={handleRemove} onLeave={handleLeave} />
            )}
            {isOwner && <InvitationsPanel activityId={activity.id} />}
          </section>
        )}
      </Main>
    </>
  )
}
