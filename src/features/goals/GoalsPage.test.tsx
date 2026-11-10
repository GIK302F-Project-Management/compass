import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as goalsApi from './api/goals'
import type { Goal } from './api/goals'
import { GoalsPage } from './GoalsPage'

vi.mock('./api/goals', () => ({
  listGoals: vi.fn(),
  createGoal: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
}))

const listGoals = vi.mocked(goalsApi.listGoals)
const createGoal = vi.mocked(goalsApi.createGoal)
const updateGoal = vi.mocked(goalsApi.updateGoal)
const deleteGoal = vi.mocked(goalsApi.deleteGoal)

const JAVA: Goal = {
  id: 1,
  title: 'Pass the Java exam',
  description: 'Review the lectures',
  createdAt: '2026-11-03T10:00:00Z',
}
const SQL: Goal = { id: 2, title: 'Learn SQL', description: '', createdAt: '2026-11-03T11:00:00Z' }

function renderPage() {
  return render(
    <MemoryRouter>
      <GoalsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

describe('GoalsPage', () => {
  it('invites the student to add a first goal', async () => {
    listGoals.mockResolvedValue([])
    renderPage()

    expect(await screen.findByText(/No goals yet/)).toBeInTheDocument()
    expect(screen.getByText('0 goals')).toBeInTheDocument()
  })

  it('shows the saved goals with their descriptions', async () => {
    listGoals.mockResolvedValue([JAVA, SQL])
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Pass the Java exam' })).toBeInTheDocument()
    expect(screen.getByText('Review the lectures')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Learn SQL' })).toBeInTheDocument()
    expect(screen.getByText('2 goals')).toBeInTheDocument()
  })

  it('creates a goal and adds it to the list', async () => {
    listGoals.mockResolvedValue([JAVA])
    createGoal.mockResolvedValue({ ok: true, goal: SQL })
    renderPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '+ New goal' }))
    await user.type(screen.getByLabelText('Title'), 'Learn SQL')
    await user.click(screen.getByRole('button', { name: 'Add goal' }))

    expect(await screen.findByRole('heading', { name: 'Learn SQL' })).toBeInTheDocument()
    expect(createGoal).toHaveBeenCalledWith({ title: 'Learn SQL', description: '' })
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument() // the form closed
    expect(screen.getByText('2 goals')).toBeInTheDocument()
  })

  it('sends the description too', async () => {
    listGoals.mockResolvedValue([])
    createGoal.mockResolvedValue({ ok: true, goal: JAVA })
    renderPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '+ New goal' }))
    await user.type(screen.getByLabelText('Title'), 'Pass the Java exam')
    await user.type(screen.getByLabelText('Description'), 'Review the lectures')
    await user.click(screen.getByRole('button', { name: 'Add goal' }))

    await screen.findByRole('heading', { name: 'Pass the Java exam' })
    expect(createGoal).toHaveBeenCalledWith({ title: 'Pass the Java exam', description: 'Review the lectures' })
  })

  it('checks the form before calling the backend', async () => {
    listGoals.mockResolvedValue([])
    renderPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '+ New goal' }))
    await user.click(screen.getByRole('button', { name: 'Add goal' }))

    expect(screen.getByText('Please give the goal a title.')).toBeInTheDocument()
    expect(createGoal).not.toHaveBeenCalled()
  })

  it('shows the message the backend gives next to the field', async () => {
    listGoals.mockResolvedValue([])
    createGoal.mockResolvedValue({ ok: false, error: 'invalid', fieldErrors: { title: 'The title is not allowed.' } })
    renderPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '+ New goal' }))
    await user.type(screen.getByLabelText('Title'), 'Something')
    await user.click(screen.getByRole('button', { name: 'Add goal' }))

    expect(await screen.findByText('The title is not allowed.')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveValue('Something') // nothing the student typed is lost
  })

  it('says so when the goal could not be saved', async () => {
    listGoals.mockResolvedValue([])
    createGoal.mockRejectedValue(new TypeError('Failed to fetch'))
    renderPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '+ New goal' }))
    await user.type(screen.getByLabelText('Title'), 'Something')
    await user.click(screen.getByRole('button', { name: 'Add goal' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save the goal')
  })

  it('edits a goal', async () => {
    listGoals.mockResolvedValue([JAVA, SQL])
    updateGoal.mockResolvedValue({ ok: true, goal: { ...JAVA, title: 'Ace the Java exam' } })
    renderPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Edit Pass the Java exam' }))
    const title = screen.getByLabelText('Title')
    expect(title).toHaveValue('Pass the Java exam')
    expect(screen.getByLabelText('Description')).toHaveValue('Review the lectures')
    await user.clear(title)
    await user.type(title, 'Ace the Java exam')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('heading', { name: 'Ace the Java exam' })).toBeInTheDocument()
    expect(updateGoal).toHaveBeenCalledWith(1, { title: 'Ace the Java exam', description: 'Review the lectures' })
    expect(screen.queryByRole('heading', { name: 'Pass the Java exam' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Learn SQL' })).toBeInTheDocument()
  })

  it('leaves a goal unchanged when the student cancels', async () => {
    listGoals.mockResolvedValue([JAVA])
    renderPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Edit Pass the Java exam' }))
    await user.type(screen.getByLabelText('Title'), ' (draft)')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('heading', { name: 'Pass the Java exam' })).toBeInTheDocument()
    expect(updateGoal).not.toHaveBeenCalled()
  })

  it('removes a goal that was deleted somewhere else while it was being edited', async () => {
    listGoals.mockResolvedValue([JAVA, SQL])
    updateGoal.mockResolvedValue({ ok: false, error: 'not-found' })
    renderPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Edit Pass the Java exam' }))
    await user.type(screen.getByLabelText('Title'), '!')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: /Java/ })).not.toBeInTheDocument())
    expect(screen.getByRole('heading', { name: 'Learn SQL' })).toBeInTheDocument()
  })

  it('deletes a goal after the student confirms', async () => {
    listGoals.mockResolvedValue([JAVA, SQL])
    deleteGoal.mockResolvedValue()
    renderPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Delete Pass the Java exam' }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Pass the Java exam' })).not.toBeInTheDocument())
    expect(window.confirm).toHaveBeenCalledWith('Delete "Pass the Java exam"?')
    expect(deleteGoal).toHaveBeenCalledWith(1)
    expect(screen.getByText('1 goal')).toBeInTheDocument()
  })

  it('keeps the goal when the student does not confirm the deletion', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    listGoals.mockResolvedValue([JAVA])
    renderPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Delete Pass the Java exam' }))

    expect(deleteGoal).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Pass the Java exam' })).toBeInTheDocument()
  })

  it('keeps the goal and says so when the deletion fails', async () => {
    listGoals.mockResolvedValue([JAVA])
    deleteGoal.mockRejectedValue(new Error('Unexpected goal delete response: 500'))
    renderPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Delete Pass the Java exam' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not delete the goal')
    expect(screen.getByRole('heading', { name: 'Pass the Java exam' })).toBeInTheDocument()
  })

  it('offers a retry when the goals cannot be loaded', async () => {
    listGoals.mockRejectedValueOnce(new Error('Unexpected goals response: 500')).mockResolvedValueOnce([JAVA])
    renderPage()
    const user = userEvent.setup()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Could not load your goals')
    expect(screen.queryByRole('button', { name: '+ New goal' })).not.toBeInTheDocument()

    await user.click(within(alert).getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { name: 'Pass the Java exam' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
