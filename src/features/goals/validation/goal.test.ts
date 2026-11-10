import { describe, expect, it } from 'vitest'
import { MAX_GOAL_DESCRIPTION_LENGTH, MAX_GOAL_TITLE_LENGTH, validateGoal } from './goal'

describe('validateGoal', () => {
  it('accepts a title with a description', () => {
    expect(validateGoal({ title: 'Pass the Java exam', description: 'Review the lectures' })).toEqual({})
  })

  it('accepts a title without a description', () => {
    expect(validateGoal({ title: 'Learn SQL', description: '' })).toEqual({})
  })

  it('asks for a title', () => {
    expect(validateGoal({ title: '', description: 'x' }).title).toBe('Please give the goal a title.')
  })

  it('treats a title of only spaces as empty', () => {
    expect(validateGoal({ title: '   ', description: '' }).title).toBe('Please give the goal a title.')
  })

  it('accepts the longest title and description', () => {
    const values = { title: 't'.repeat(MAX_GOAL_TITLE_LENGTH), description: 'd'.repeat(MAX_GOAL_DESCRIPTION_LENGTH) }

    expect(validateGoal(values)).toEqual({})
  })

  it('rejects a title or description that is too long', () => {
    const errors = validateGoal({
      title: 't'.repeat(MAX_GOAL_TITLE_LENGTH + 1),
      description: 'd'.repeat(MAX_GOAL_DESCRIPTION_LENGTH + 1),
    })

    expect(errors.title).toMatch(/at most 100/)
    expect(errors.description).toMatch(/at most 1000/)
  })

  it('does not count the spaces around the text', () => {
    expect(validateGoal({ title: `  ${'t'.repeat(MAX_GOAL_TITLE_LENGTH)}  `, description: '' })).toEqual({})
  })
})
