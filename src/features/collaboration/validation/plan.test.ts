import { describe, expect, it } from 'vitest'
import { MAX_PLAN_NAME_LENGTH, parseInvitationToken, validatePlanName } from './plan'

describe('validatePlanName', () => {
  it('accepts a normal name', () => {
    expect(validatePlanName('Exam week')).toBeNull()
  })

  it('asks for a name when it is empty or only spaces', () => {
    expect(validatePlanName('')).toBe('Please give the plan a name.')
    expect(validatePlanName('   ')).toBe('Please give the plan a name.')
  })

  it('refuses a name that is too long, counting without the outer spaces', () => {
    expect(validatePlanName(` ${'a'.repeat(MAX_PLAN_NAME_LENGTH)} `)).toBeNull()
    expect(validatePlanName('a'.repeat(MAX_PLAN_NAME_LENGTH + 1))).toMatch(/under 100 characters/)
  })
})

describe('parseInvitationToken', () => {
  it('reads the token from a full link', () => {
    expect(parseInvitationToken('https://compass.example/join/abc_DEF-123')).toBe('abc_DEF-123')
    expect(parseInvitationToken('  http://localhost:5173/join/abc123?utm=x  ')).toBe('abc123')
  })

  it('accepts the bare token', () => {
    expect(parseInvitationToken('abc_DEF-123')).toBe('abc_DEF-123')
  })

  it('refuses anything else', () => {
    expect(parseInvitationToken('')).toBeNull()
    expect(parseInvitationToken('not a token')).toBeNull()
    expect(parseInvitationToken('https://compass.example/home')).toBeNull()
    expect(parseInvitationToken('../../etc')).toBeNull()
  })
})
