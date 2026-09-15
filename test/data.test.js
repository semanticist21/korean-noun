import { afterEach, expect, mock, spyOn, test } from 'bun:test'
import { TOTAL } from '../data/meta.js'
import t10 from '../data/t10.js'
import t25 from '../data/t25.js'
import t50 from '../data/t50.js'
import t100 from '../data/t100.js'
import { noun as full } from '../src/index.js'
import { noun as top10 } from '../src/top10.js'
import { noun as top25 } from '../src/top25.js'
import { noun as top50 } from '../src/top50.js'

const bands = [t10, t25, t50, t100]
const rows = bands.join('\n').split('\n').map((line) => line.split('\t'))

afterEach(() => mock.restore())

test('TOTAL matches rows and limit', () => {
  expect(rows.length).toBe(TOTAL)
  expect(TOTAL).toBeGreaterThan(0)
  expect(TOTAL).toBeLessThanOrEqual(100_000)
})

test('bands end at floor(TOTAL * fraction)', () => {
  let end = 0
  bands.forEach((band, i) => {
    end += band.split('\n').length
    expect(end).toBe(Math.floor(TOTAL * [0.1, 0.25, 0.5, 1][i]))
  })
})

test('rows are unique hangul words with positive counts sorted desc', () => {
  const seen = new Set()
  let previous = Number.POSITIVE_INFINITY
  for (const [word, count] of rows) {
    expect(word).toMatch(/^[가-힣]+$/)
    expect(seen.has(word)).toBe(false)
    seen.add(word)
    const n = Number(count)
    expect(Number.isInteger(n) && n > 0 && n <= previous).toBe(true)
    previous = n
  }
})

test('each entry reaches exactly the last word of its range', () => {
  spyOn(Math, 'random').mockReturnValue(1 - Number.EPSILON)
  const last = (fraction) => rows[Math.floor(TOTAL * fraction) - 1][0]
  expect(top10()).toBe(last(0.1))
  expect(top25()).toBe(last(0.25))
  expect(top50()).toBe(last(0.5))
  expect(full()).toBe(last(1))
  expect(full({ top: 0.1 })).toBe(last(0.1))
  expect(top10({ even: false })).toBe(last(0.1))
})

test('tier entries reject top beyond their range', () => {
  expect(() => top10({ top: 0.2 })).toThrow(RangeError)
  expect(() => top50({ top: 1 })).toThrow(RangeError)
})
