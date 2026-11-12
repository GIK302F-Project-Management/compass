import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Member } from './api/sharing'
import { progressOf } from './progress'
import { ProgressPanel } from './ProgressPanel'

const MEMBERS: Member[] = [
  { userId: '1', name: 'Ana', owner: true, you: true, joinedAt: '2026-11-03T10:00:00Z' },
  { userId: '2', name: 'Bruno', owner: false, you: false, joinedAt: '2026-11-04T10:00:00Z' },
]

const TASKS = [
  { assigneeId: '1', done: true },
  { assigneeId: '1', done: false },
  { assigneeId: '2', done: true },
  { assigneeId: null, done: false },
]

describe('progressOf', () => {
  it('counts what each member took and finished, and what nobody took', () => {
    expect(progressOf(TASKS, MEMBERS)).toEqual({
      tasksTotal: 4,
      tasksDone: 2,
      tasksUnassigned: 1,
      percent: 50,
      members: [
        { userId: '1', name: 'Ana', tasksAssigned: 2, tasksDone: 1 },
        { userId: '2', name: 'Bruno', tasksAssigned: 1, tasksDone: 1 },
      ],
    })
  })
})

describe('ProgressPanel', () => {
  it('shows who does what in a shared activity', () => {
    render(<ProgressPanel progress={progressOf(TASKS, MEMBERS)} members={MEMBERS} />)

    expect(screen.getByText(/2 of 4 tasks done · 1 task has nobody yet/)).toBeInTheDocument()
    const bruno = screen.getByRole('row', { name: /Bruno/ })
    expect(
      within(bruno)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['1', '1'])
  })

  it('says there is nothing to share out without tasks', () => {
    render(<ProgressPanel progress={progressOf([], MEMBERS)} members={MEMBERS} />)

    expect(screen.getByText(/No tasks yet/)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
