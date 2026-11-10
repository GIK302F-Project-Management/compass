import { describe, expect, it } from 'vitest'
import {
  asList,
  asObject,
  readBoolean,
  readId,
  readNumber,
  readOptionalId,
  readOptionalNumber,
  readOptionalString,
  readString,
} from './decode'

describe('asObject', () => {
  it('accepts an object and refuses everything else', () => {
    expect(asObject({ a: 1 }, 'thing')).toEqual({ a: 1 })
    expect(() => asObject(null, 'thing')).toThrow(/thing is not an object/)
    expect(() => asObject([], 'thing')).toThrow(/thing is not an object/)
    expect(() => asObject('x', 'thing')).toThrow(/thing is not an object/)
  })
})

describe('asList', () => {
  it('decodes every item', () => {
    expect(asList([1, 2], 'numbers', (item) => Number(item) * 2)).toEqual([2, 4])
  })

  it('refuses what is not a list', () => {
    expect(() => asList({}, 'numbers', Number)).toThrow(/numbers is not a list/)
  })
})

describe('required fields', () => {
  it('reads a field of the right type', () => {
    expect(readString({ a: 'x' }, 'a')).toBe('x')
    expect(readNumber({ a: 3 }, 'a')).toBe(3)
    expect(readBoolean({ a: false }, 'a')).toBe(false)
    expect(readId({ id: 12 }, 'id')).toBe('12')
  })

  it('throws when the field is missing or has another type', () => {
    expect(() => readString({}, 'a')).toThrow(/a is not text/)
    expect(() => readNumber({ a: '3' }, 'a')).toThrow(/a is not a number/)
    expect(() => readBoolean({ a: 'true' }, 'a')).toThrow(/a is not true or false/)
    expect(() => readId({ id: 'abc' }, 'id')).toThrow(/id is not a number/)
  })
})

describe('optional fields', () => {
  it('give null when the field is missing or null', () => {
    expect(readOptionalString({}, 'a')).toBeNull()
    expect(readOptionalString({ a: null }, 'a')).toBeNull()
    expect(readOptionalNumber({}, 'a')).toBeNull()
    expect(readOptionalNumber({ a: null }, 'a')).toBeNull()
    expect(readOptionalId({ a: null }, 'a')).toBeNull()
  })

  it('read the value when there is one', () => {
    expect(readOptionalString({ a: 'x' }, 'a')).toBe('x')
    expect(readOptionalNumber({ a: 0 }, 'a')).toBe(0)
    expect(readOptionalId({ a: 5 }, 'a')).toBe('5')
  })

  it('still refuse a value of the wrong type', () => {
    expect(() => readOptionalNumber({ a: 'x' }, 'a')).toThrow(/not a number/)
    expect(() => readOptionalString({ a: 4 }, 'a')).toThrow(/not text/)
  })
})
