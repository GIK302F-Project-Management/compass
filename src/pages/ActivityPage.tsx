import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getActivity, type Activity as ActivitySheet } from '../api/activities'
import { deleteTask, listTasks, updateTask, type Task } from '../api/tasks'
import { PencilIcon, TrashIcon } from '../components/Icons'
import { TaskForm } from '../components/TaskForm'
import { TopBar } from '../components/TopBar'
import { formatDueDate } from '../utils/dates'

export function Activity(){
    const { id = '' } = useParams()
    const [activity, setActivity] = useState<ActivitySheet | null>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [formOpen, setFormOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const doneCount = tasks.filter((task) => task.done).length

    useEffect(() => {
        Promise.all([getActivity(id), listTasks(id)])
            .then(([foundActivity, foundTasks]) => {
                setActivity(foundActivity)
                setTasks(foundTasks)
            })
            .finally(() => setLoading(false))
    }, [id])

    function replaceTask(updated: Task) {
        setTasks(tasks.map((task) => (task.id === updated.id ? updated : task)))
    }

    async function toggleTask(task: Task) {
        replaceTask(await updateTask(task.id, { done: !task.done }))
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
        setFormOpen(false)
    }

    function handleUpdated(task: Task) {
        replaceTask(task)
        setEditingId(null)
    }

    async function handleDelete(task: Task) {
        if (!window.confirm(`Delete "${task.title}"?`)) return
        await deleteTask(task.id)
        setTasks(tasks.filter((item) => item.id !== task.id))
    }

    const topBar = <TopBar title="Activity" actions={<Link to="/home" className="text-link">Back to atlas</Link>} />

    if (loading) return topBar

    if (!activity) {
        return <>
        {topBar}
        <main className="activity-page">
            <p>This activity could not be found. It may have been deleted.</p>
        </main>
        </>
    }

    return <>
    {topBar}

    <main className="activity-page">
        <header className="activity-header">
            <p className="kicker">
                {activity.subject ? `${activity.subject} · ` : ''}Due {formatDueDate(activity.dueDate)}
            </p>
            <h2>{activity.title}</h2>
            {tasks.length > 0 ? (
                <>
                <p className="activity-progress">
                    <em>{doneCount}</em> of {tasks.length} tasks done
                </p>
                <div
                    className="progress-track"
                    role="progressbar"
                    aria-label="Tasks done"
                    aria-valuemin={0}
                    aria-valuemax={tasks.length}
                    aria-valuenow={doneCount}
                >
                    <span style={{ width: `${(doneCount / tasks.length) * 100}%` }} />
                </div>
                </>
            ) : (
                <p className="activity-progress">No tasks yet. Add the first step of this route.</p>
            )}
        </header>

        <ol id="curr-activities-holder" className="task-list">
            {tasks.map((task, index) => {
                if (task.id === editingId) {
                    return (
                        <li key={task.id} className="Task task-draft">
                            <span className="task-marker" aria-hidden="true" />
                            <TaskForm activityId={id} task={task} onSaved={handleUpdated} onCancel={() => setEditingId(null)} />
                        </li>
                    )
                }
                return (
                    <li key={task.id} className={task.done ? 'Task done' : 'Task'}>
                        <input
                            type="checkbox"
                            id={`task-${task.id}`}
                            checked={task.done}
                            onChange={() => toggleTask(task)}
                        />
                        <label htmlFor={`task-${task.id}`}>
                            <span className="kicker">
                                Task {String(index + 1).padStart(2, '0')}
                                {task.dueDate && ` · Due ${formatDueDate(task.dueDate)}`}
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
                        {task.details && <p className="task-details">{task.details}</p>}
                    </li>
                )
            })}
            {formOpen ? (
                <li className="Task task-draft">
                    <span className="task-marker" aria-hidden="true" />
                    <TaskForm activityId={id} onSaved={handleCreated} onCancel={() => setFormOpen(false)} />
                </li>
            ) : (
                <li className="Task task-add">
                    <span className="task-marker" aria-hidden="true" />
                    <button className="button button-small" onClick={openNewForm}>
                        + Add task
                    </button>
                </li>
            )}
        </ol>
    </main>
    </>
}
