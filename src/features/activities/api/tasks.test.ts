import { describe, expect, it } from 'vitest'
import { jsonResponse, sentBody, stubFetch } from '@/test/helpers'
import { createTask, deleteTask, listPlanTasks, listTasks, updateTask } from './tasks'

const TASK = {
  id: 6,
  activityId: 3,
  title: 'Solve exercises',
  details: '',
  dueDate: null,
  estimatedMinutes: null,
  done: false,
  doneBy: null,
}
const EXPECTED = { ...TASK, id: '6', activityId: '3', dueDate: '' }

const urlOf = (fetchMock: ReturnType<typeof stubFetch>, call: number) =>
  String(fetchMock.mock.calls[call]![0]).replace(/^https?:\/\/[^/]+/, '')

describe('tasks', () => {
  it('lists the tasks of an activity and of a whole plan', async () => {
    const fetchMock = stubFetch(
      jsonResponse([TASK]),
      jsonResponse([{ ...TASK, dueDate: '2026-12-01', estimatedMinutes: 45 }]),
    )

    expect(await listTasks('3')).toEqual([EXPECTED])
    const planTasks = await listPlanTasks('1')

    expect(urlOf(fetchMock, 0)).toBe('/activities/3/tasks')
    expect(urlOf(fetchMock, 1)).toBe('/plans/1/tasks')
    expect(planTasks[0]).toMatchObject({ dueDate: '2026-12-01', estimatedMinutes: 45 })
  })

  it('creates a task, sending no deadline as null', async () => {
    const fetchMock = stubFetch(jsonResponse(TASK, 201))

    await createTask('3', { title: ' Solve exercises ', details: ' ', dueDate: '', estimatedMinutes: 30 })

    expect(sentBody(fetchMock)).toEqual({ title: 'Solve exercises', details: '', dueDate: null, estimatedMinutes: 30 })
  })

  it('sends only the fields that changed', async () => {
    const fetchMock = stubFetch(jsonResponse({ ...TASK, done: true, doneBy: 2 }), jsonResponse(TASK))

    const done = await updateTask('6', { done: true })
    await updateTask('6', { dueDate: '', estimatedMinutes: null })

    expect(fetchMock.mock.calls[0]![1].method).toBe('PATCH')
    expect(sentBody(fetchMock, 0)).toEqual({ done: true })
    expect(done.doneBy).toBe('2')
    // clearing a deadline and an estimate is a null, which is different from leaving them out
    expect(sentBody(fetchMock, 1)).toEqual({ dueDate: null, estimatedMinutes: null })
  })

  it('deletes a task', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 204 }))

    await deleteTask('6')

    expect(fetchMock.mock.calls[0]![1].method).toBe('DELETE')
    expect(urlOf(fetchMock, 0)).toBe('/tasks/6')
  })
})
