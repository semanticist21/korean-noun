import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { create } from '../src/core.js'

// cumulative freq: 60, 80, 90, 100
const chunks = ['가\t60\n나\t20', '다\t10\n라\t10']
const full = create(chunks, 1, 4)
const half = create([chunks[0]], 0.5, 4)

const withRandom = (value, fn) => {
  spyOn(Math, 'random').mockReturnValue(value)
  return fn()
}

afterEach(() => mock.restore())

describe('top validation', () => {
  test.each([0, -1, 1.1, Number.NaN])('rejects top=%p', (top) => {
    expect(() => full({ top })).toThrow(RangeError)
  })

  test('rejects top above entry max', () => {
    expect(() => half({ top: 0.75 })).toThrow(RangeError)
  })
})

describe('even', () => {
  test('picks within top prefix', () => {
    expect(withRandom(0, () => full())).toBe('가')
    expect(withRandom(0.999, () => full())).toBe('라')
    expect(withRandom(0.999, () => full({ top: 0.5 }))).toBe('나')
    expect(withRandom(0.999, () => full({ top: 0.1 }))).toBe('가')
  })

  test('tier entry defaults top to its max', () => {
    expect(withRandom(0.999, () => half())).toBe('나')
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
    expect(withRandom(value, () => full({ even: false }))).toBe(word)
  })

  test('weights only within top prefix', () => {
    expect(withRandom(0.76, () => full({ top: 0.5, even: false }))).toBe('나')
    expect(withRandom(0.76, () => half({ even: false }))).toBe('나')
  })
})
