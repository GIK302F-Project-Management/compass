import { useEffect, useState } from 'react'
import { deleteGoal, listGoals, type Goal } from './api/goals'
import { AppHeader } from '@/shared/layout/AppHeader'
import { GoalForm } from './GoalForm'
import { PencilIcon, TrashIcon } from '@/shared/ui/Icons'
import { Main } from '@/shared/layout/Main'
import './GoalsPage.css'

export function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reloadCount, setReloadCount] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteFailed, setDeleteFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    listGoals()
      .then((loaded) => {
        if (cancelled) return
        setGoals(loaded)
        setLoadFailed(false)
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadCount])

  function retry() {
    setLoading(true)
    setReloadCount((count) => count + 1)
  }

  function openNewForm() {
    setEditingId(null)
    setFormOpen(true)
  }

  function openEditForm(id: number) {
    setFormOpen(false)
    setEditingId(id)
  }

  function handleCreated(goal: Goal) {
    setGoals([...goals, goal])
    setFormOpen(false)
  }

  function handleUpdated(updated: Goal) {
    setGoals(goals.map((goal) => (goal.id === updated.id ? updated : goal)))
    setEditingId(null)
  }

  function handleGone(id: number) {
    setGoals(goals.filter((goal) => goal.id !== id))
    setEditingId(null)
  }

  async function handleDelete(goal: Goal) {
    if (!window.confirm(`Delete "${goal.title}"?`)) return
    setDeleteFailed(false)
    try {
      await deleteGoal(goal.id)
      setGoals((current) => current.filter((item) => item.id !== goal.id))
    } catch {
      setDeleteFailed(true)
    }
  }

  return (
    <>
      <AppHeader title="Learning goals" />
      <Main className="goals-page">
        <header className="page-intro">
          <p className="kicker">Set your bearing</p>
          <h2>What do you want to achieve?</h2>
          <p>Write down your learning goals. They are saved in your account, and only you can see them.</p>
        </header>

        {loading && <p role="status">Loading your goals...</p>}

        {!loading && loadFailed && (
          <p className="form-error" role="alert">
            Could not load your goals.{' '}
            <button type="button" className="text-link button-link" onClick={retry}>
              Try again
            </button>
          </p>
        )}

        {deleteFailed && (
          <p className="form-error" role="alert">
            Could not delete the goal. Please try again.
          </p>
        )}

        {!loading && !loadFailed && (
          <div className="goal-list">
            <p className="kicker goal-count">
              {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
            </p>
            {goals.length === 0 && !formOpen && (
              <p className="goal-empty">No goals yet. Add your first one to define what you want to achieve.</p>
            )}
            {goals.map((goal, index) => {
              if (goal.id === editingId) {
                return (
                  <GoalForm
                    key={goal.id}
                    goal={goal}
                    onSaved={handleUpdated}
                    onGone={() => handleGone(goal.id)}
                    onCancel={() => setEditingId(null)}
                  />
                )
              }
              return (
                <article key={goal.id} className="sheet goal">
                  <header className="sheet-header">
                    <span>Goal {String(index + 1).padStart(2, '0')}</span>
                  </header>
                  <div className="sheet-body">
                    <h3>{goal.title}</h3>
                    {goal.description && <p className="goal-description">{goal.description}</p>}
                  </div>
                  <div className="sheet-actions">
                    <button
                      className="button button-small button-icon"
                      onClick={() => openEditForm(goal.id)}
                      aria-label={`Edit ${goal.title}`}
                      title="Edit"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      className="button button-small button-icon button-danger"
                      onClick={() => handleDelete(goal)}
                      aria-label={`Delete ${goal.title}`}
                      title="Delete"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </article>
              )
            })}
            {formOpen ? (
              <GoalForm onSaved={handleCreated} onGone={() => setFormOpen(false)} onCancel={() => setFormOpen(false)} />
            ) : (
              <button type="button" className="sheet sheet-blank" onClick={openNewForm}>
                + New goal
              </button>
            )}
          </div>
        )}
      </Main>
    </>
  )
}
