import { describe, expect, it } from 'vitest'
import { validateLogin } from './login'

describe('validateLogin', () => {
  it('accepts a university email and a password', () => {
    expect(validateLogin({ email: 'ana@alumni.mondragon.edu', password: 'x' })).toEqual({})
  })

  it('asks for both fields when empty', () => {
    expect(Object.keys(validateLogin({ email: '', password: '' })).sort()).toEqual(['email', 'password'])
  })

  it('rejects an email outside the university', () => {
    expect(validateLogin({ email: 'ana@gmail.com', password: 'x' }).email).toMatch(/university email/)
  })
})
