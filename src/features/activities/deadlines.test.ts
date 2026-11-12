import { describe, expect, it } from 'vitest'
import type { Activity } from './api/activities'
import type { Task } from './api/tasks'
import { deadlineStatuses, mostUrgent, workOf } from './deadlines'

const TODAY = '2026-11-12'
const ME = '1'

function activity(id: string, dueDate: string, done = false): Activity {
  return { id, ownerId: ME, role: 'OWNER', memberCount: 1, title: `A${id}`, subject: '', dueDate, done, doneBy: null }
}

function task(
  id: string,
  activityId: string,
  minutes: number | null,
  assigneeId: string | null = ME,
  done = false,
): Task {
  return {
    id,
    activityId,
    title: `T${id}`,
    details: '',
    dueDate: '',
    estimatedMinutes: minutes,
    assigneeId,
    done,
    doneBy: null,
  }
}

const statusOf = (activities: Activity[], tasks: Task[], daily = 60) =>
  deadlineStatuses(activities, tasks, ME, daily, TODAY)

describe('deadlineStatuses', () => {
  it('is on track while the work fits comfortably in the time left', () => {
    // due in 4 days: 5 study days of 60 minutes = 300; 2 hours of work
    const status = statusOf([activity('a', '2026-11-16')], [task('1', 'a', 120)]).get('a')!

    expect(status).toMatchObject({ level: 'good', label: 'On track', remainingMinutes: 120, capacityMinutes: 300 })
  })

  it('is tight from 80% of the time on, and at risk when the work does not fit', () => {
    const tight = statusOf([activity('a', '2026-11-16')], [task('1', 'a', 270)]).get('a')!
    const risk = statusOf([activity('a', '2026-11-16')], [task('1', 'a', 360)]).get('a')!

    expect(tight).toMatchObject({ level: 'tight', label: 'Tight' })
    expect(risk).toMatchObject({ level: 'bad', label: 'At risk' })
  })

  it('adds up the work of earlier deadlines, since those days are spent on them too', () => {
    const activities = [activity('later', '2026-11-16'), activity('sooner', '2026-11-13')]
    // sooner: 100 of 120 minutes (tight); later: 100 + 150 = 250 of 300 (tight, though 150 alone would be fine)
    const statuses = statusOf(activities, [task('1', 'sooner', 100), task('2', 'later', 150)])

    expect(statuses.get('sooner')).toMatchObject({ level: 'tight', loadMinutes: 100 })
    expect(statuses.get('later')).toMatchObject({ level: 'tight', remainingMinutes: 150, loadMinutes: 250 })
  })

  it('only counts the student’s own open tasks, and lists the ones without an estimate', () => {
    const tasks = [
      task('1', 'a', 60),
      task('2', 'a', 600, '2'), // a classmate's
      task('3', 'a', 600, ME, true), // done
      task('4', 'a', null), // no estimate
    ]
    const status = statusOf([activity('a', '2026-11-16')], tasks).get('a')!

    expect(status).toMatchObject({ level: 'good', remainingMinutes: 60, missingEstimates: 1 })
  })

  it('names the cases with nothing to measure', () => {
    const activities = [
      activity('empty', '2026-11-20'),
      activity('theirs', '2026-11-20'),
      activity('noEstimate', '2026-11-20'),
      activity('finished', '2026-11-20', true),
      activity('late', '2026-11-10'),
    ]
    const tasks = [task('1', 'theirs', 60, '2'), task('2', 'noEstimate', null), task('3', 'late', 30)]
    const statuses = statusOf(activities, tasks)

    expect(statuses.get('empty')).toMatchObject({ level: 'none', label: 'No tasks yet' })
    expect(statuses.get('theirs')).toMatchObject({ level: 'good', label: 'Your part is done' })
    expect(statuses.get('noEstimate')).toMatchObject({ level: 'none', label: 'No estimate' })
    expect(statuses.get('finished')).toMatchObject({ level: 'none', label: 'Done' })
    expect(statuses.get('late')).toMatchObject({ level: 'bad', label: 'Overdue', daysLeft: -2 })
  })

  it('lists the worst first, then the soonest', () => {
    const activities = [activity('ok', '2026-11-13'), activity('risk', '2026-11-20'), activity('tight', '2026-11-14')]
    const statuses = new Map([
      ['ok', { level: 'good' } as never],
      ['risk', { level: 'bad' } as never],
      ['tight', { level: 'tight' } as never],
    ])

    expect(mostUrgent(activities, statuses).map(({ activity }) => activity.id)).toEqual(['risk', 'tight', 'ok'])
  })
})

describe('workOf', () => {
  it('weighs tasks by their estimates and counts the ones without', () => {
    expect(workOf([task('1', 'a', 300, ME, true), task('2', 'a', 60), task('3', 'a', null)])).toEqual({
      totalMinutes: 360,
      doneMinutes: 300,
      unestimated: 1,
    })
  })
})
