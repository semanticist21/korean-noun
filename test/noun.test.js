import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { create } from '../src/core.js'

// cumulative freq: 60, 80, 90, 100
const noun = create(['가\t60\n나\t20', '다\t10\n라\t10'])

const withRandom = (value, fn) => {
  spyOn(Math, 'random').mockReturnValue(value)
  return fn()
}

afterEach(() => mock.restore())

test.each([0, -1, 1.1, Number.NaN])('rejects top=%p', (top) => {
  expect(() => noun({ top })).toThrow(RangeError)
})

describe('even', () => {
  test('picks within top prefix of the set', () => {
    expect(withRandom(0, () => noun())).toBe('가')
    expect(withRandom(0.999, () => noun())).toBe('라')
    expect(withRandom(0.999, () => noun({ top: 0.5 }))).toBe('나')
    expect(withRandom(0.999, () => noun({ top: 0.1 }))).toBe('가')
  })
})

describe('weighted', () => {
  test.each([
    [0, '가'],
    [0.599, '가'],
    [0.6, '나'],
    [0.85, '다'],
    [0.999, '라'],
  ])('random=%p → %s', (value, word) => {
    expect(withRandom(value, () => noun({ even: false }))).toBe(word)
  })

  test('weights only within top prefix', () => {
    expect(withRandom(0.76, () => noun({ top: 0.5, even: false }))).toBe('나')
  })
})

describe('length options', () => {
  // ranks: 가(50) 나무(20) 다리미(15) 라(10) 마당(5)
  const byLength = create(['가\t50\n나무\t20\n다리미\t15\n라\t10\n마당\t5'])

  test('exact length, even', () => {
    expect(withRandom(0, () => byLength({ length: 2 }))).toBe('나무')
    expect(withRandom(0.999, () => byLength({ length: 2 }))).toBe('마당')
    expect(withRandom(0.999, () => byLength({ length: 3 }))).toBe('다리미')
  })

  test('top cuts the rank range before length filtering', () => {
    expect(withRandom(0.999, () => byLength({ top: 0.4, length: 2 }))).toBe('나무')
    expect(() => byLength({ top: 0.2, length: 2 })).toThrow(RangeError)
  })

  test('length range, even', () => {
    expect(withRandom(0.5, () => byLength({ minLength: 2, maxLength: 3 }))).toBe('마당')
    expect(withRandom(0.999, () => byLength({ minLength: 2, maxLength: 3 }))).toBe('다리미')
    expect(withRandom(0.999, () => byLength({ maxLength: 1 }))).toBe('라')
    expect(withRandom(0.999, () => byLength({ minLength: 3 }))).toBe('다리미')
  })

  test('length options, weighted', () => {
    expect(withRandom(0.79, () => byLength({ length: 2, even: false }))).toBe('나무')
    expect(withRandom(0.8, () => byLength({ length: 2, even: false }))).toBe('마당')
    expect(withRandom(0.7, () => byLength({ maxLength: 2, even: false }))).toBe('라')
    expect(withRandom(0.71, () => byLength({ maxLength: 2, even: false }))).toBe('나무')
  })

  test('rejects invalid or unmatched options', () => {
    expect(() => byLength({ length: 5 })).toThrow(RangeError)
    expect(() => byLength({ length: 0 })).toThrow(RangeError)
    expect(() => byLength({ length: 1.5 })).toThrow(RangeError)
    expect(() => byLength({ minLength: 3, maxLength: 2 })).toThrow(RangeError)
    expect(() => byLength({ length: 2, minLength: 1 })).toThrow(TypeError)
  })
})
