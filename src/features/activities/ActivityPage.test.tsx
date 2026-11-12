import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveSession } from '@/shared/session/session'
import { makeSession } from '@/test/helpers'
import * as sharingApi from '@/features/collaboration/api/sharing'
import * as activitiesApi from './api/activities'
import * as tasksApi from './api/tasks'
import type { Activity } from './api/activities'
import type { Task } from './api/tasks'
import { ActivityPage } from './ActivityPage'

vi.mock('./api/activities', () => ({ getActivity: vi.fn(), setActivityDone: vi.fn() }))
vi.mock('./api/tasks', () => ({ listTasks: vi.fn(), updateTask: vi.fn(), deleteTask: vi.fn() }))
vi.mock('@/features/collaboration/api/sharing', () => ({
  listMembers: vi.fn(),
  removeMember: vi.fn(),
  listInvitations: vi.fn(),
  createInvitation: vi.fn(),
  revokeInvitation: vi.fn(),
  invitationLink: (token: string) => `http://app/join/${token}`,
}))

const getActivity = vi.mocked(activitiesApi.getActivity)
const listTasks = vi.mocked(tasksApi.listTasks)
const updateTask = vi.mocked(tasksApi.updateTask)
const listMembers = vi.mocked(sharingApi.listMembers)
const removeMember = vi.mocked(sharingApi.removeMember)
const listInvitations = vi.mocked(sharingApi.listInvitations)

const ACTIVITY: Activity = {
  id: '5',
  ownerId: '2',
  role: 'MEMBER',
  memberCount: 2,
  title: 'Group project',
  subject: 'Physics',
  dueDate: '2026-12-01',
  done: false,
  doneBy: null,
}

const ANA = { userId: '1', name: 'Ana', owner: false, you: true, joinedAt: '2026-11-04T10:00:00Z' }
const BRUNO = { userId: '2', name: 'Bruno', owner: true, you: false, joinedAt: '2026-11-03T10:00:00Z' }

function task(id: string, title: string, assigneeId: string | null): Task {
  return {
    id,
    activityId: '5',
    title,
    details: '',
    dueDate: '',
    estimatedMinutes: null,
    assigneeId,
    done: false,
    doneBy: null,
  }
}

const TASKS = [task('10', 'Write intro', '1'), task('11', 'Draw charts', '2'), task('12', 'Print it', null)]

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/activity/5']}>
      <Routes>
        <Route path="/activity/:id" element={<ActivityPage />} />
        <Route path="/home" element={<p>The atlas</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  saveSession(makeSession({ userId: '1' }))
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  listInvitations.mockResolvedValue([])
})

describe('ActivityPage', () => {
  it('on a sheet of one’s own, does not ask who does each task, and lets the owner invite classmates', async () => {
    getActivity.mockResolvedValue({ ...ACTIVITY, ownerId: '1', role: 'OWNER', memberCount: 1 })
    listTasks.mockResolvedValue([task('10', 'Write intro', '1')])
    listMembers.mockResolvedValue([{ ...ANA, owner: true }])
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Group project' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Invite students' })).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /Who does/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Who does what' })).not.toBeInTheDocument()
  })

  it('on a shared sheet, says who does each task and lets the student take one nobody took', async () => {
    getActivity.mockResolvedValue(ACTIVITY)
    listTasks.mockResolvedValue(TASKS)
    listMembers.mockResolvedValue([BRUNO, ANA])
    updateTask.mockResolvedValue({ ...TASKS[2]!, assigneeId: '1' })
    renderPage()

    expect(await screen.findByRole('combobox', { name: 'Who does Draw charts' })).toHaveValue('2')
    expect(screen.getByText(/Shared with 1 classmate/)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Who does Print it' })).toHaveValue('')
    // the student's own task stands out, in their color; a classmate's and an untaken one look different
    const rowOf = (title: string) => screen.getByText(title).closest('li')!
    expect(rowOf('Write intro')).toHaveClass('mine', 'you')
    expect(rowOf('Draw charts')).toHaveClass('theirs', 'tone-1')
    expect(rowOf('Print it')).toHaveClass('nobody')
    expect(within(rowOf('Write intro')).getByText('Yours')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Take it' }))

    expect(updateTask).toHaveBeenCalledWith('12', { assigneeId: '1' })
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Who does Print it' })).toHaveValue('1'))
    // only the owner manages the links
    expect(screen.queryByRole('heading', { name: 'Invite students' })).not.toBeInTheDocument()
  })

  it('hands a task to another member', async () => {
    getActivity.mockResolvedValue(ACTIVITY)
    listTasks.mockResolvedValue(TASKS)
    listMembers.mockResolvedValue([BRUNO, ANA])
    updateTask.mockResolvedValue({ ...TASKS[0]!, assigneeId: '2' })
    renderPage()

    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Who does Write intro' }), 'Bruno')

    expect(updateTask).toHaveBeenCalledWith('10', { assigneeId: '2' })
  })

  it('can show only the student’s own tasks', async () => {
    getActivity.mockResolvedValue(ACTIVITY)
    listTasks.mockResolvedValue(TASKS)
    listMembers.mockResolvedValue([BRUNO, ANA])
    renderPage()

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Show only my tasks' }))

    const list = screen.getByRole('list', { name: 'Tasks' })
    expect(within(list).getByText('Write intro')).toBeInTheDocument()
    expect(within(list).queryByText('Draw charts')).not.toBeInTheDocument()
  })

  it('lets a member leave the activity, which takes it out of their atlas', async () => {
    getActivity.mockResolvedValue(ACTIVITY)
    listTasks.mockResolvedValue(TASKS)
    listMembers.mockResolvedValue([BRUNO, ANA])
    removeMember.mockResolvedValue(undefined)
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Leave activity' }))

    expect(removeMember).toHaveBeenCalledWith('5', '1')
    expect(await screen.findByText('The atlas')).toBeInTheDocument()
  })
})
