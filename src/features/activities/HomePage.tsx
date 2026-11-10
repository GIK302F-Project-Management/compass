import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { deleteActivity, listActivities, type Activity } from './api/activities'
import { useSession } from '@/shared/session/useSession'
import { ActivityForm } from './ActivityForm'
import { AppHeader } from '@/shared/layout/AppHeader'
import { PencilIcon, TrashIcon } from '@/shared/ui/Icons'
import { SheetMap } from './SheetMap'
import { Main } from '@/shared/layout/Main'
import { RouteTrail } from '@/features/route/RouteTrail'
import { TodayCard } from '@/features/route/TodayCard'
import { useRouteProgress } from '@/features/route/useRouteProgress'
import { formatDueDate, parseDueDate } from '@/shared/utils/dates'
import './HomePage.css'

const DUE_SOON_DAYS = 3

// Flags the sheets that need attention first, since the atlas has no fixed order.
function dueBadge(activity: Activity) {
  if (activity.done) return 'Done'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysLeft = Math.round((parseDueDate(activity.dueDate).getTime() - today.getTime()) / 86_400_000)
  if (daysLeft < 0) return 'Overdue'
  if (daysLeft <= DUE_SOON_DAYS) return 'Due soon'
  return null
}

// An activity matches when the search text is part of its name or subject, ignoring case.
function matchesSearch(activity: Activity, query: string): boolean {
  const text = query.trim().toLowerCase()
  if (text === '') return true
  return `${activity.title} ${activity.subject}`.toLowerCase().includes(text)
}

export function HomePage() {
  const session = useSession()
  const ownerEmail = session?.email ?? ''
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const progress = useRouteProgress(ownerEmail)
  const route = progress.route

  useEffect(() => {
    listActivities(ownerEmail)
      .then(setActivities)
      .finally(() => setLoading(false))
  }, [ownerEmail])

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
    if (!window.confirm(`Delete "${activity.title}"?`)) return
    await deleteActivity(activity.id)
    setActivities(activities.filter((item) => item.id !== activity.id))
  }

  // The sheet numbers stay the same while searching, so "Sheet 03" is always the same activity.
  const numbered = activities.map((activity, index) => ({ activity, number: index + 1 }))
  const searching = query.trim() !== ''
  const visible = numbered.filter(({ activity }) => matchesSearch(activity, query))

  return (
    <>
      <AppHeader title="Your atlas" />
      <Main>
        <div className={route ? 'home-layout with-trail' : 'home-layout'}>
          <div className="home-main">
            {route && progress.ready && (
              <TodayCard
                route={route}
                taskById={progress.taskById}
                isDone={progress.isDone}
                onToggle={progress.toggle}
              />
            )}
            <form className="search-form" role="search" onSubmit={(event) => event.preventDefault()}>
              <input
                type="search"
                className="search-input"
                name="activity"
                placeholder="Search by name or subject"
                aria-label="Search activities"
                autoComplete="off"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </form>

            <div className="atlas">
              <p className="kicker atlas-count">
                This semester ·{' '}
                {searching
                  ? `${visible.length} of ${activities.length} ${activities.length === 1 ? 'sheet' : 'sheets'}`
                  : `${activities.length} ${activities.length === 1 ? 'sheet' : 'sheets'}`}
              </p>
              {loading && <p role="status">Loading your activities...</p>}
              {!loading && activities.length === 0 && !formOpen && (
                <p className="atlas-empty">No activities yet. Add your first one to start mapping your semester.</p>
              )}
              {!loading && searching && visible.length === 0 && (
                <p className="atlas-empty">No activity matches "{query.trim()}".</p>
              )}
              {visible.map(({ activity, number }) => {
                if (activity.id === editingId) {
                  return (
                    <ActivityForm
                      key={activity.id}
                      ownerEmail={ownerEmail}
                      activity={activity}
                      onSaved={handleUpdated}
                      onCancel={() => setEditingId(null)}
                    />
                  )
                }
                const badge = dueBadge(activity)
                const urgent = badge === 'Due soon' || badge === 'Overdue'
                return (
                  <article
                    key={activity.id}
                    className={`sheet${urgent ? ' due-soon' : ''}${activity.done ? ' done' : ''}`}
                  >
                    <header className="sheet-header">
                      <span>
                        Sheet {String(number).padStart(2, '0')}
                        {activity.subject && ` · ${activity.subject}`}
                      </span>
                      {badge && <span className="sheet-badge">{badge}</span>}
                    </header>
                    <SheetMap seed={activity.id} />
                    <div className="sheet-body">
                      <h2>{activity.title}</h2>
                      <p className="sheet-due">Due {formatDueDate(activity.dueDate)}</p>
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
                      <button
                        className="button button-small button-icon button-danger"
                        onClick={() => handleDelete(activity)}
                        aria-label={`Delete ${activity.title}`}
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </article>
                )
              })}
              {formOpen ? (
                <ActivityForm ownerEmail={ownerEmail} onSaved={handleCreated} onCancel={() => setFormOpen(false)} />
              ) : (
                <button className="sheet sheet-blank" onClick={openNewForm}>
                  + New activity
                </button>
              )}
            </div>
          </div>
          {route && progress.ready && (
            <RouteTrail
              route={route}
              taskById={progress.taskById}
              isDone={progress.isDone}
              onToggle={progress.toggle}
            />
          )}
        </div>
      </Main>
    </>
  )
}
