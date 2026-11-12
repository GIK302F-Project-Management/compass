import { describe, expect, it } from 'vitest'
import { jsonResponse, sentBody, stubFetch } from '@/test/helpers'
import { assignedTo, createTask, deleteTask, listAtlasTasks, listTasks, updateTask } from './tasks'

const TASK = {
  id: 6,
  activityId: 3,
  title: 'Solve exercises',
  details: '',
  dueDate: null,
  estimatedMinutes: null,
  assigneeId: 1,
  done: false,
  doneBy: null,
}
const EXPECTED = { ...TASK, id: '6', activityId: '3', assigneeId: '1', dueDate: '' }

const urlOf = (fetchMock: ReturnType<typeof stubFetch>, call: number) =>
  String(fetchMock.mock.calls[call]![0]).replace(/^https?:\/\/[^/]+/, '')

describe('tasks', () => {
  it('lists the tasks of an activity and of the whole atlas', async () => {
    const fetchMock = stubFetch(
      jsonResponse([TASK]),
      jsonResponse([{ ...TASK, dueDate: '2026-12-01', estimatedMinutes: 45 }]),
    )

    expect(await listTasks('3')).toEqual([EXPECTED])
    const atlasTasks = await listAtlasTasks()

    expect(urlOf(fetchMock, 0)).toBe('/activities/3/tasks')
    expect(urlOf(fetchMock, 1)).toBe('/tasks')
    expect(atlasTasks[0]).toMatchObject({ dueDate: '2026-12-01', estimatedMinutes: 45 })
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

  it('hands a task to a member, or to nobody, sending the id as a number', async () => {
    const fetchMock = stubFetch(jsonResponse({ ...TASK, assigneeId: 2 }), jsonResponse({ ...TASK, assigneeId: null }))

    expect((await updateTask('6', { assigneeId: '2' })).assigneeId).toBe('2')
    expect((await updateTask('6', { assigneeId: null })).assigneeId).toBeNull()

    expect(sentBody(fetchMock, 0)).toEqual({ assigneeId: 2 })
    expect(sentBody(fetchMock, 1)).toEqual({ assigneeId: null })
  })

  it('keeps the tasks of one student', () => {
    const mine = { ...EXPECTED, assigneeId: '1' }
    const theirs = { ...EXPECTED, id: '7', assigneeId: '2' }
    const nobody = { ...EXPECTED, id: '8', assigneeId: null }

    expect(assignedTo([mine, theirs, nobody], '1')).toEqual([mine])
  })

  it('deletes a task', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 204 }))

    await deleteTask('6')

    expect(fetchMock.mock.calls[0]![1].method).toBe('DELETE')
    expect(urlOf(fetchMock, 0)).toBe('/tasks/6')
  })
})
