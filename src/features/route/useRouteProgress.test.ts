import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as tasksApi from '@/features/activities/api/tasks'
import { saveRoute, type SavedRoute } from './api/savedRoute'
import { useRouteProgress } from './useRouteProgress'

vi.mock('@/features/activities/api/tasks', () => ({ listAtlasTasks: vi.fn(), updateTask: vi.fn() }))

const listAtlasTasks = vi.mocked(tasksApi.listAtlasTasks)
const SCOPE = { ownerEmail: 'ana@alumni.mondragon.edu' }

const ROUTE: SavedRoute = {
  source: 'llm',
  status: 'ready',
  sessions: [{ goalId: 't1', title: 'Read chapter 1', date: '2026-11-12', durationMinutes: 60 }],
  warnings: [],
  request: {
    startDate: '2026-11-12',
    dailyAvailableMinutes: 120,
    goals: [{ id: 't1', title: 'Read', deadline: '2026-11-13', estimatedMinutes: 60 }],
  },
  goals: { t1: { activityId: 'a1', taskTitle: 'Read', activityTitle: 'Physics', subject: '' } },
  checked: [],
  createdAt: '2026-11-12T09:00:00Z',
}

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
})

describe('useRouteProgress', () => {
  it('reports that there is no route when none was saved', () => {
    const { result } = renderHook(() => useRouteProgress(SCOPE))

    expect(result.current.status).toBe('none')
    expect(listAtlasTasks).not.toHaveBeenCalled()
  })

  it('reports a failed load instead of hiding the route, and loads it again on retry', async () => {
    saveRoute(SCOPE, ROUTE)
    listAtlasTasks.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([])

    const { result } = renderHook(() => useRouteProgress(SCOPE))
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('failed'))

    act(() => result.current.retry())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(listAtlasTasks).toHaveBeenCalledTimes(2)
  })
})
