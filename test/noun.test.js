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
