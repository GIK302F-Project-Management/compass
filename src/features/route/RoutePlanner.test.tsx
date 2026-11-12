import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveSession } from '@/shared/session/session'
import { makeSession } from '@/test/helpers'
import * as activitiesApi from '@/features/activities/api/activities'
import * as tasksApi from '@/features/activities/api/tasks'
import type { Activity } from '@/features/activities/api/activities'
import type { Task } from '@/features/activities/api/tasks'
import { RoutePlanner } from './RoutePlanner'

vi.mock('@/features/activities/api/activities', () => ({ listActivities: vi.fn() }))
vi.mock('@/features/activities/api/tasks', async (importOriginal) => ({
  ...(await importOriginal<typeof tasksApi>()),
  listAtlasTasks: vi.fn(),
  updateTask: vi.fn(),
}))

const listActivities = vi.mocked(activitiesApi.listActivities)
const listAtlasTasks = vi.mocked(tasksApi.listAtlasTasks)
const updateTask = vi.mocked(tasksApi.updateTask)

// A month from today: ahead of the start date and within the year the planner looks at, so every task can be planned.
const SOON = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)

function activity(id: string, title: string, memberCount: number): Activity {
  return {
    id,
    ownerId: '1',
    role: 'OWNER',
    memberCount,
    title,
    subject: 'Physics',
    dueDate: SOON,
    done: false,
    doneBy: null,
  }
}

function task(id: string, activityId: string, title: string, assigneeId: string | null): Task {
  return {
    id,
    activityId,
    title,
    details: '',
    dueDate: '',
    estimatedMinutes: 60,
    assigneeId,
    done: false,
    doneBy: null,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  saveSession(makeSession({ userId: '1' }))
  listActivities.mockResolvedValue([activity('5', 'Group project', 3), activity('6', 'Essay', 1)])
  listAtlasTasks.mockResolvedValue([
    task('10', '5', 'Write intro', '1'),
    task('11', '5', 'Draw charts', '2'),
    task('12', '5', 'Print it', null),
    task('13', '6', 'Pick a topic', '1'),
  ])
})

function renderPlanner() {
  render(
    <MemoryRouter initialEntries={['/planner']}>
      <RoutePlanner />
    </MemoryRouter>,
  )
}

describe('RoutePlanner', () => {
  it('offers only the student’s own tasks, from every activity in the atlas', async () => {
    renderPlanner()

    expect(await screen.findByRole('checkbox', { name: /Write intro/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Pick a topic/ })).toBeChecked()
    expect(screen.queryByRole('checkbox', { name: /Draw charts/ })).not.toBeInTheDocument()
    expect(screen.getByText('Tasks to plan · 2 selected')).toBeInTheDocument()
  })

  it('lets the student take a task nobody took, which joins their route', async () => {
    updateTask.mockResolvedValue(task('12', '5', 'Print it', '1'))
    renderPlanner()

    const untaken = await screen.findByRole('list', { name: 'Tasks of Group project that nobody took yet' })
    await userEvent.click(within(untaken).getByRole('button', { name: 'Take it' }))

    expect(updateTask).toHaveBeenCalledWith('12', { assigneeId: '1' })
    expect(await screen.findByRole('checkbox', { name: /Print it/ })).toBeChecked()
    expect(screen.getByText('Tasks to plan · 3 selected')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /nobody took yet/ })).not.toBeInTheDocument()
  })
})
