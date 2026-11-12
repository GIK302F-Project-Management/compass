import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as activitiesApi from './activities'
import * as tasksApi from './tasks'
import { countLegacyActivities, discardLegacyActivities, importLegacyActivities } from './legacyData'

vi.mock('./activities', () => ({ createActivity: vi.fn(), setActivityDone: vi.fn(), deleteActivity: vi.fn() }))
vi.mock('./tasks', () => ({ createTask: vi.fn(), updateTask: vi.fn() }))

const createActivity = vi.mocked(activitiesApi.createActivity)
const setActivityDone = vi.mocked(activitiesApi.setActivityDone)
const deleteActivity = vi.mocked(activitiesApi.deleteActivity)
const createTask = vi.mocked(tasksApi.createTask)
const updateTask = vi.mocked(tasksApi.updateTask)

const ANA = 'ana@alumni.mondragon.edu'
const BRUNO = 'bruno@alumni.mondragon.edu'

function store() {
  localStorage.setItem(
    'compass.mockActivities',
    JSON.stringify([
      { id: 'a1', title: 'Read chapter 4', subject: 'Physics', dueDate: '2026-12-01', ownerEmail: ANA, done: true },
      { id: 'a2', title: 'Essay', subject: 'History', dueDate: '2026-12-05', ownerEmail: ANA, done: false },
      { id: 'b1', title: 'Bruno only', subject: '', dueDate: '2026-12-09', ownerEmail: BRUNO, done: false },
    ]),
  )
  localStorage.setItem(
    'compass.mockTasks',
    JSON.stringify([
      { id: 't1', activityId: 'a1', title: 'Summary', details: 'Short', dueDate: '', estimatedMinutes: 30, done: true },
      { id: 't2', activityId: 'a2', title: 'Outline', details: '', dueDate: '2026-12-02', done: false },
      { id: 't3', activityId: 'b1', title: 'Not Ana', details: '', dueDate: '', done: false },
    ]),
  )
  localStorage.setItem(`compass.route.v2.${ANA}`, '{}')
}

const stored = (key: string) => JSON.parse(localStorage.getItem(key) ?? '[]') as { id: string }[]

beforeEach(() => {
  vi.resetAllMocks()
  deleteActivity.mockResolvedValue(undefined)
  createActivity.mockImplementation(async (changes) => ({
    id: `new-${changes.title}`,
    ownerId: '1',
    role: 'OWNER' as const,
    memberCount: 1,
    ...changes,
    done: false,
    doneBy: null,
  }))
  createTask.mockImplementation(async (activityId, input) => ({
    id: `new-${input.title}`,
    activityId,
    ...input,
    assigneeId: '1',
    done: false,
    doneBy: null,
  }))
})

describe('countLegacyActivities', () => {
  it('counts only the account activities', () => {
    store()

    expect(countLegacyActivities(ANA)).toBe(2)
    expect(countLegacyActivities(BRUNO)).toBe(1)
    expect(countLegacyActivities('nobody@alumni.mondragon.edu')).toBe(0)
  })

  it('copes with missing or broken data', () => {
    expect(countLegacyActivities(ANA)).toBe(0)
    localStorage.setItem('compass.mockActivities', '{not json')
    expect(countLegacyActivities(ANA)).toBe(0)
    localStorage.setItem('compass.mockActivities', '{"a":1}')
    expect(countLegacyActivities(ANA)).toBe(0)
  })
})

describe('importLegacyActivities', () => {
  it('moves the activities and their tasks into the atlas', async () => {
    store()

    expect(await importLegacyActivities(ANA)).toEqual({ imported: 2, failed: 0 })

    expect(createActivity).toHaveBeenCalledWith({
      title: 'Read chapter 4',
      subject: 'Physics',
      dueDate: '2026-12-01',
    })
    expect(createTask).toHaveBeenCalledWith('new-Read chapter 4', {
      title: 'Summary',
      details: 'Short',
      dueDate: '',
      estimatedMinutes: 30,
    })
    expect(createTask).toHaveBeenCalledWith('new-Essay', {
      title: 'Outline',
      details: '',
      dueDate: '2026-12-02',
      estimatedMinutes: null,
    })
  })

  it('keeps done tasks and activities done', async () => {
    store()

    await importLegacyActivities(ANA)

    expect(updateTask).toHaveBeenCalledTimes(1)
    expect(updateTask).toHaveBeenCalledWith('new-Summary', { done: true })
    expect(setActivityDone).toHaveBeenCalledTimes(1)
    expect(setActivityDone).toHaveBeenCalledWith('new-Read chapter 4', true)
  })

  it('does not complete an activity that still has open tasks', async () => {
    store()
    const activities = stored('compass.mockActivities') as Record<string, unknown>[]
    activities[1]!.done = true // "Essay" was marked done, but its task is open
    localStorage.setItem('compass.mockActivities', JSON.stringify(activities))

    await importLegacyActivities(ANA)

    expect(setActivityDone).not.toHaveBeenCalledWith('new-Essay', true)
  })

  it('removes what it moved and leaves other accounts alone', async () => {
    store()

    await importLegacyActivities(ANA)

    expect(stored('compass.mockActivities').map((item) => item.id)).toEqual(['b1'])
    expect(stored('compass.mockTasks').map((item) => item.id)).toEqual(['t3'])
    expect(localStorage.getItem(`compass.route.v2.${ANA}`)).toBeNull()
  })

  it('keeps an activity the backend refuses, and does not leave half of it behind', async () => {
    store()
    createTask.mockRejectedValueOnce(new Error('refused')) // the first task of the first activity

    expect(await importLegacyActivities(ANA)).toEqual({ imported: 1, failed: 1 })

    expect(deleteActivity).toHaveBeenCalledWith('new-Read chapter 4')
    expect(stored('compass.mockActivities').map((item) => item.id)).toEqual(['a1', 'b1'])
    expect(localStorage.getItem(`compass.route.v2.${ANA}`)).not.toBeNull() // still not all moved
  })
})

describe('discardLegacyActivities', () => {
  it('throws away the account data only', () => {
    store()

    discardLegacyActivities(ANA)

    expect(countLegacyActivities(ANA)).toBe(0)
    expect(stored('compass.mockActivities').map((item) => item.id)).toEqual(['b1'])
    expect(stored('compass.mockTasks').map((item) => item.id)).toEqual(['t3'])
    expect(localStorage.getItem(`compass.route.v2.${ANA}`)).toBeNull()
  })
})
