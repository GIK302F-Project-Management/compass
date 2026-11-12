import { useState } from 'react'
import { Link } from 'react-router'
import { deleteActivity, isShared, type Activity } from './api/activities'
import type { DeadlineStatus } from './deadlines'
import type { AtlasState } from './useAtlas'
import { ActivityForm } from './ActivityForm'
import { LegacyImportBanner } from './LegacyImportBanner'
import { PencilIcon, TrashIcon, UsersIcon } from '@/shared/ui/Icons'
import { SheetMap } from './SheetMap'
import { formatDueDate } from '@/shared/utils/dates'
import { formatMinutes } from '@/shared/utils/duration'
import './Atlas.css'

// The line under the due date: how much of the student's work is left and how long until the deadline.
function workLine(status: DeadlineStatus) {
  if (status.remainingMinutes === 0) return null
  const days =
    status.daysLeft < 0
      ? 'past the deadline'
      : status.daysLeft === 0
        ? 'due today'
        : `${status.daysLeft} ${status.daysLeft === 1 ? 'day' : 'days'} left`
  return `${formatMinutes(status.remainingMinutes)} of work · ${days}`
}

// Who else is on a shared sheet, in a few words.
function sharedLabel(activity: Activity) {
  const others = activity.memberCount - 1
  return `Shared with ${others} ${others === 1 ? 'classmate' : 'classmates'}`
}

type AtlasProps = {
  atlas: AtlasState // loaded by the home page, which also shows the progress cards
  statuses: Map<string, DeadlineStatus> // whether each deadline can still be made (see deadlines.ts)
}

// The student's one atlas of map sheets: their own activities and the ones classmates shared with them.
// Each sheet says in color whether its deadline is on track. Add, edit and delete (deleting is for the owner;
// a shared sheet is left from its own page).
export function Atlas({ atlas, statuses }: AtlasProps) {
  const { activities, setActivities, loading, problem, setProblem, reload } = atlas
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  function openNewForm() {
    setEditingId(null)
    setFormOpen(true)
  }

  function openEditForm(id: string) {
    setFormOpen(false)
    setEditingId(id)
  }

  function handleCreated(activity: Activity) {
    setActivities([...activities, activity])
    setFormOpen(false)
  }

  function handleUpdated(updated: Activity) {
    setActivities(activities.map((activity) => (activity.id === updated.id ? updated : activity)))
    setEditingId(null)
  }

  async function handleDelete(activity: Activity) {
    const forEveryone = isShared(activity) ? ' It is deleted for every member.' : ''
    if (!window.confirm(`Delete "${activity.title}"?${forEveryone}`)) return
    try {
      await deleteActivity(activity.id)
      setActivities(activities.filter((item) => item.id !== activity.id))
      setProblem(null)
    } catch {
      setProblem(`Could not delete "${activity.title}". Please try again.`)
    }
  }

  return (
    <>
      <div className="atlas">
        <LegacyImportBanner onImported={() => void reload()} />
        <p className="kicker atlas-count">
          {activities.length} {activities.length === 1 ? 'sheet' : 'sheets'}
        </p>
        {loading && <p role="status">Loading your activities...</p>}
        {problem && <p role="alert">{problem}</p>}
        {!loading && activities.length === 0 && !formOpen && (
          <p className="atlas-empty">No activities yet. Add your first one to start mapping your semester.</p>
        )}
        {activities.map((activity) => {
          if (activity.id === editingId) {
            return (
              <ActivityForm
                key={activity.id}
                activity={activity}
                onSaved={handleUpdated}
                onCancel={() => setEditingId(null)}
              />
            )
          }
          const status = statuses.get(activity.id)
          const work = status && workLine(status)
          return (
            <article
              key={activity.id}
              className={`sheet level-${status?.level ?? 'none'}${activity.done ? ' done' : ''}`}
            >
              <header className="sheet-header">
                <span>{activity.subject}</span>
                {status && status.level !== 'none' && (
                  <span className={`status-badge level-${status.level}`}>{status.label}</span>
                )}
                {activity.done && <span className="sheet-badge">Done</span>}
              </header>
              <SheetMap seed={activity.id} />
              <div className="sheet-body">
                <h2>{activity.title}</h2>
                <p className="sheet-due">Due {formatDueDate(activity.dueDate)}</p>
                {work && <p className={`sheet-work level-${status.level}`}>{work}</p>}
                {status && status.missingEstimates > 0 && (
                  <p className="sheet-hint">
                    {status.missingEstimates} {status.missingEstimates === 1 ? 'task has' : 'tasks have'} no estimate
                  </p>
                )}
                {isShared(activity) && (
                  <p className="sheet-shared">
                    <UsersIcon /> {sharedLabel(activity)}
                  </p>
                )}
              </div>
              <div className="sheet-actions">
                <Link to={`/activity/${activity.id}`} className="button button-small">
                  Open
                </Link>
                <button
                  className="button button-small button-icon"
                  onClick={() => openEditForm(activity.id)}
                  aria-label={`Edit ${activity.title}`}
                  title="Edit"
                >
                  <PencilIcon />
                </button>
                {activity.role === 'OWNER' && (
                  <button
                    className="button button-small button-icon button-danger"
                    onClick={() => handleDelete(activity)}
                    aria-label={`Delete ${activity.title}`}
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            </article>
          )
        })}
        {formOpen ? (
          <ActivityForm onSaved={handleCreated} onCancel={() => setFormOpen(false)} />
        ) : (
          <button className="sheet sheet-blank" onClick={openNewForm}>
            + New activity
          </button>
        )}
      </div>
    </>
  )
}
