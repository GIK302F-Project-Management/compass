import { describe, expect, it } from 'vitest'
import {
  MAX_NAME_LENGTH,
  isUniversityEmail,
  normalizeEmail,
  validateRegister,
  type RegisterValues,
} from './register'

const VALID: RegisterValues = {
  name: 'Ana',
  email: 'ana@alumni.mondragon.edu',
  password: 'secret-pass',
  confirmPassword: 'secret-pass',
}

describe('isUniversityEmail', () => {
  it.each(['ana@alumni.mondragon.edu', '  ANA@Alumni.Mondragon.edu ', 'a.b+c@alumni.mondragon.edu'])('accepts %j', (email) => {
    expect(isUniversityEmail(email)).toBe(true)
  })

  it.each(['', 'ana', 'ana@gmail.com', '@alumni.mondragon.edu', 'a b@alumni.mondragon.edu', 'a@b@alumni.mondragon.edu', 'ana@alumni.mondragon.edu.evil.com'])(
    'rejects %j',
    (email) => {
      expect(isUniversityEmail(email)).toBe(false)
    },
  )
})

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Ana@Alumni.Mondragon.edu ')).toBe('ana@alumni.mondragon.edu')
  })
})

describe('validateRegister', () => {
  it('accepts valid values', () => {
    expect(validateRegister(VALID)).toEqual({})
  })

  it('asks for every missing field', () => {
    const errors = validateRegister({ name: ' ', email: '', password: '', confirmPassword: '' })
    expect(Object.keys(errors).sort()).toEqual(['email', 'name', 'password'])
  })

  it('rejects a name longer than the backend accepts', () => {
    expect(validateRegister({ ...VALID, name: 'a'.repeat(MAX_NAME_LENGTH + 1) }).name).toBeDefined()
    expect(validateRegister({ ...VALID, name: 'a'.repeat(MAX_NAME_LENGTH) }).name).toBeUndefined()
  })

  it('rejects a short password', () => {
    const errors = validateRegister({ ...VALID, password: '1234567', confirmPassword: '1234567' })
    expect(errors.password).toMatch(/at least 8/)
  })

  it('counts password size in bytes, like BCrypt does', () => {
    const emojis = '😀'.repeat(19) // 19 characters but 76 bytes
    const errors = validateRegister({ ...VALID, password: emojis, confirmPassword: emojis })
    expect(errors.password).toMatch(/too long/)
    expect(validateRegister({ ...VALID, password: 'a'.repeat(72), confirmPassword: 'a'.repeat(72) })).toEqual({})
  })

  it('requires the two passwords to match', () => {
    expect(validateRegister({ ...VALID, confirmPassword: 'other-pass' }).confirmPassword).toBeDefined()
  })
})
