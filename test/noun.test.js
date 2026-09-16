import { describe, expect, test } from 'bun:test'
import { create } from '../src/core.js'

const fixed = (value) => () => value

// cumulative freq: 60, 80, 90, 100
const { noun, nouns } = create(['가\t60\n나\t20', '다\t10\n라\t10'])

describe('top', () => {
  test.each([0, -1, 1.1, Number.NaN])('rejects top=%p', (top) => {
    expect(() => noun({ top })).toThrow(RangeError)
  })

  test('even picks within top prefix of the set', () => {
    expect(noun({ random: fixed(0) })).toBe('가')
    expect(noun({ random: fixed(0.999) })).toBe('라')
    expect(noun({ top: 0.5, random: fixed(0.999) })).toBe('나')
    expect(noun({ top: 0.1, random: fixed(0.999) })).toBe('가')
  })

  test.each([
    [0, '가'],
    [0.599, '가'],
    [0.6, '나'],
    [0.85, '다'],
    [0.999, '라'],
  ])('weighted random=%p → %s', (value, word) => {
    expect(noun({ even: false, random: fixed(value) })).toBe(word)
  })

  test('weights only within top prefix', () => {
    expect(noun({ top: 0.5, even: false, random: fixed(0.76) })).toBe('나')
  })
})

describe('length options', () => {
  // ranks: 가(50) 나무(20) 다리미(15) 라(10) 마당(5)
  const { noun: byLength } = create(['가\t50\n나무\t20\n다리미\t15\n라\t10\n마당\t5'])

  test('exact length, even', () => {
    expect(byLength({ length: 2, random: fixed(0) })).toBe('나무')
    expect(byLength({ length: 2, random: fixed(0.999) })).toBe('마당')
    expect(byLength({ length: 3, random: fixed(0.999) })).toBe('다리미')
  })

  test('top cuts the rank range before length filtering', () => {
    expect(byLength({ top: 0.4, length: 2, random: fixed(0.999) })).toBe('나무')
    expect(() => byLength({ top: 0.2, length: 2 })).toThrow(RangeError)
  })

  test('length range, even', () => {
    expect(byLength({ minLength: 2, maxLength: 3, random: fixed(0.5) })).toBe('마당')
    expect(byLength({ minLength: 2, maxLength: 3, random: fixed(0.999) })).toBe('다리미')
    expect(byLength({ maxLength: 1, random: fixed(0.999) })).toBe('라')
    expect(byLength({ minLength: 3, random: fixed(0.999) })).toBe('다리미')
  })

  test('length options, weighted', () => {
    expect(byLength({ length: 2, even: false, random: fixed(0.79) })).toBe('나무')
    expect(byLength({ length: 2, even: false, random: fixed(0.8) })).toBe('마당')
    expect(byLength({ maxLength: 2, even: false, random: fixed(0.7) })).toBe('라')
    expect(byLength({ maxLength: 2, even: false, random: fixed(0.71) })).toBe('나무')
  })

  test('rejects invalid or unmatched options', () => {
    expect(() => byLength({ length: 5 })).toThrow(RangeError)
    expect(() => byLength({ length: 0 })).toThrow(RangeError)
    expect(() => byLength({ length: 1.5 })).toThrow(RangeError)
    expect(() => byLength({ minLength: 3, maxLength: 2 })).toThrow(RangeError)
    expect(() => byLength({ length: 2, minLength: 1 })).toThrow(TypeError)
  })
})

describe('text options', () => {
  // ranks: 가방(50, 받침) 가위(20) 나비(15) 사람(10, 받침) 가(5)
  const { noun: byText, nouns: manyByText } = create(['가방\t50\n가위\t20\n나비\t15\n사람\t10\n가\t5'])

  test('startsWith / endsWith', () => {
    expect(byText({ startsWith: '가', random: fixed(0) })).toBe('가방')
    expect(byText({ startsWith: '가', random: fixed(0.999) })).toBe('가')
    expect(byText({ endsWith: '람', random: fixed(0.5) })).toBe('사람')
    expect(byText({ startsWith: '가', endsWith: '위', random: fixed(0.5) })).toBe('가위')
    expect(byText({ startsWith: '가', length: 2, random: fixed(0.999) })).toBe('가위')
  })

  test('batchim', () => {
    expect(byText({ batchim: true, random: fixed(0.999) })).toBe('사람')
    expect(byText({ batchim: false, random: fixed(0) })).toBe('가위')
    expect(byText({ batchim: false, startsWith: '가', random: fixed(0.999) })).toBe('가')
  })

  test('weighted within text filters', () => {
    expect(byText({ startsWith: '가', even: false, random: fixed(0.9) })).toBe('가위')
    expect(byText({ startsWith: '가', even: false, random: fixed(0.99) })).toBe('가')
    expect(manyByText(2, { startsWith: '가', even: false, random: fixed(0.5) })).toEqual(['가방', '가위'])
  })

  test('top cuts before text filters', () => {
    expect(() => byText({ top: 0.2, startsWith: '나' })).toThrow(RangeError)
  })

  test('rejects invalid text options', () => {
    expect(() => byText({ startsWith: 1 })).toThrow(TypeError)
    expect(() => byText({ endsWith: '' })).toThrow(RangeError)
    expect(() => byText({ startsWith: 'ㄱ' })).toThrow(RangeError)
    expect(() => byText({ startsWith: '력' })).toThrow(RangeError)
    expect(() => byText({ batchim: 'yes' })).toThrow(TypeError)
  })
})

describe('option validation', () => {
  test('unknown keys and wrong types', () => {
    expect(() => noun({ lenght: 3 })).toThrow(TypeError)
    expect(() => nouns(1, { startWith: '가' })).toThrow(TypeError)
    expect(() => noun({ even: 'no' })).toThrow(TypeError)
  })

  test('random', () => {
    expect(() => noun({ random: 0.5 })).toThrow(TypeError)
    expect(() => noun({ random: fixed(1) })).toThrow(RangeError)
    expect(() => noun({ random: fixed(Number.NaN) })).toThrow(RangeError)
    expect(() => noun({ random: fixed('0.5') })).toThrow(RangeError)
    expect(() => nouns(2, { even: false, random: fixed(-0.1) })).toThrow(RangeError)
  })
})

describe('nouns', () => {
  test('count validation', () => {
    expect(nouns(0)).toEqual([])
    expect(() => nouns(-1)).toThrow(RangeError)
    expect(() => nouns(1.5)).toThrow(RangeError)
    expect(() => nouns(5)).toThrow(RangeError)
    expect(() => nouns(3, { top: 0.5 })).toThrow(RangeError)
  })

  test('even is a partial Fisher–Yates over the range', () => {
    expect(nouns(2, { random: fixed(0) })).toEqual(['가', '나'])
    expect(nouns(2, { random: fixed(0.999) })).toEqual(['라', '가'])
    expect(new Set(nouns(4)).size).toBe(4)
  })

  test('weighted picks highest frequency first for equal draws', () => {
    expect(nouns(2, { even: false, random: fixed(0.5) })).toEqual(['가', '나'])
    expect(new Set(nouns(4, { even: false })).size).toBe(4)
  })

  test('weighted first pick follows frequency', () => {
    let hits = 0
    const trials = 20_000
    for (let i = 0; i < trials; i++) if (nouns(1, { even: false })[0] === '가') hits++
    expect(hits / trials).toBeGreaterThan(0.57)
    expect(hits / trials).toBeLessThan(0.63)
  })
})
