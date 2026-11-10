import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { listGoals, createGoal, updateGoal, deleteGoal, type Goal } from '../api/goals'
import { PencilIcon, TrashIcon } from '../components/Icons'
import { TopBar } from '../components/TopBar'

export function GoalsPage() {
    const [goals, setGoals] = useState<Goal[]>([])
    const [loading, setLoading] = useState(true)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [editDescription, setEditDescription] = useState('')
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.completed).length;

    const ownerEmail = "student@example.com"

    useEffect(() => {
        listGoals(ownerEmail)
            .then((data) => setGoals(data))
            .catch(() => setGoals([]))
            .finally(() => setLoading(false))
    }, [])

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim()) return

        try {
            const newGoal = await createGoal({
                title: title.trim(),
                description: description.trim(),
                ownerEmail
            })
            setGoals([...goals, newGoal])
            setTitle('')
            setDescription('')
        } catch (err) {
            alert("Failed to create goal (Waiting for backend connection).")
        }
    }

    async function handleDelete(id: string) {
        if (!window.confirm("Are you sure you want to delete this goal?")) return
        try {
            await deleteGoal(id)
            setGoals(goals.filter(g => g.id !== id))
        } catch (err) {
            alert("Failed to delete goal.")
        }
    }

    function startEdit(goal: Goal) {
        setEditingId(goal.id)
        setEditTitle(goal.title)
        setEditDescription(goal.description)
    }

    async function handleUpdate(id: string, e: React.FormEvent) {
        e.preventDefault()
        try {
            const updated = await updateGoal(id, {
                title: editTitle.trim(),
                description: editDescription.trim()
            })
            setGoals(goals.map(g => g.id === id ? updated : g))
            setEditingId(null)
        } catch (err) {
            alert("Failed to update goal.")
        }
    }

    const topBar = <TopBar title="Learning Goals" actions={<Link to="/home" className="text-link">Back to atlas</Link>} />

    if (loading) return topBar

    return <>
        {topBar}
        <main className="activity-page">
            <header className="activity-header">
                <h2>Learning Goals</h2>
                <p className="activity-progress">Manage your learning goals under US-8.</p>
            </header>

            {}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: '500' }}>
                    <span style={{ color: '#1e293b' }}>Progress</span>
                    <span style={{ color: completedGoals === totalGoals && totalGoals > 0 ? '#16a34a' : '#2563eb' }}>
                        {totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0}% Completed ({completedGoals}/{totalGoals})
                    </span>
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                    <div 
                        style={{ 
                            width: `${totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0}%`, 
                            background: completedGoals === totalGoals && totalGoals > 0 ? '#22c55e' : '#3b82f6', 
                            height: '100%', 
                            transition: 'width 0.3s ease' 
                        }} 
                    />
                </div>
            </div>

            <form onSubmit={handleCreate} style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3>Add New Goal</h3>
                <input 
                    type="text" 
                    placeholder="Goal Title (e.g. Learn Spring Boot)" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    required
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <textarea 
                    placeholder="Description..." 
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button type="submit" className="button" style={{ alignSelf: 'flex-start' }}>+ Add Goal</button>
            </form>

            <ul className="task-list" style={{ listStyle: 'none', padding: 0 }}>
                {goals.length === 0 ? (
                    <p>No goals added yet.</p>
                ) : (
                    goals.map((goal) => (
                        <li key={goal.id} className="Task" style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #eee', borderRadius: '6px' }}>
                            {editingId === goal.id ? (
                                <form onSubmit={(e) => handleUpdate(goal.id, e)} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <input 
                                        type="text" 
                                        value={editTitle} 
                                        onChange={e => setEditTitle(e.target.value)}
                                        required
                                        style={{ padding: '0.4rem' }}
                                    />
                                    <textarea 
                                        value={editDescription} 
                                        onChange={e => setEditDescription(e.target.value)}
                                        style={{ padding: '0.4rem' }}
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button type="submit" className="button button-small">Save</button>
                                        <button type="button" className="button button-small" onClick={() => setEditingId(null)}>Cancel</button>
                                    </div>
                                </form>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.5rem 0' }}>{goal.title}</h4>
                                        <p style={{ margin: 0, color: '#666' }}>{goal.description}</p>
                                    </div>
                                    <div className="task-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="button button-small button-icon" onClick={() => startEdit(goal)} title="Edit">
                                            <PencilIcon />
                                        </button>
                                        <button className="button button-small button-icon button-danger" onClick={() => handleDelete(goal.id)} title="Delete">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))
                )}
            </ul>
        </main>
    </>
}