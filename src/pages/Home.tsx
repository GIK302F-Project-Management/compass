import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { deleteActivity, listActivities, type Activity } from '../api/activities'
import { useSession } from '../hooks/useSession'
import { ActivityForm } from '../components/ActivityForm'
import { RouteTrail } from '../components/RouteTrail'
import { TodayCard } from '../components/TodayCard'
import { useRouteProgress } from '../hooks/useRouteProgress'
import { PencilIcon, TrashIcon } from '../components/Icons'
import { SheetMap } from '../components/SheetMap'
import { TopBar } from '../components/TopBar'
import { UserMenu } from '../components/UserMenu'
import { formatDueDate, parseDueDate } from '../utils/dates'

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

export function Home(){
    const session = useSession()
    const ownerEmail = session?.email ?? ''
    const [activities, setActivities] = useState<Activity[]>([])
    const [loading, setLoading] = useState(true)
    const [formOpen, setFormOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
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

    return <>
    <TopBar
        title="Your atlas"
        actions={
            <>
                <Link to="/route" className="button button-small button-route">
                    {route ? 'My route' : 'Plot my route'}
                </Link>
                <Link to="/plan" className="button button-small">
                    Study plan
                </Link>
                <UserMenu />
            </>
        }
    />
    <div className={route ? 'home-layout with-trail' : 'home-layout'}>
    <div className="home-main">
    {route && progress.ready && (
        <TodayCard route={route} taskById={progress.taskById} isDone={progress.isDone} onToggle={progress.toggle} />
    )}
    <form id="search-form">
    <input
        type="search"
        id="activity-search"
        name="activity"
        placeholder="Search activity"
        aria-label="Search activity"
    />
    <button id="submit-btn" className="button" type="submit">Search</button>
    </form>

    <div id="curr-activities-holder" className="atlas">
        <p className="kicker atlas-count">
            This semester · {activities.length} {activities.length === 1 ? 'sheet' : 'sheets'}
        </p>
        {!loading && activities.length === 0 && !formOpen && (
            <p className="atlas-empty">No activities yet. Add your first one to start mapping your semester.</p>
        )}
        {activities.map((activity, index) => {
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
                            Sheet {String(index + 1).padStart(2, '0')}
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
            <button id="new-activity-btn" className="sheet sheet-blank" onClick={openNewForm}>
                + New activity
            </button>
        )}
    </div>
    </div>
    {route && progress.ready && (
        <RouteTrail route={route} taskById={progress.taskById} isDone={progress.isDone} onToggle={progress.toggle} />
    )}
    </div>
    </>
}
