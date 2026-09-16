import { afterEach, expect, mock, spyOn, test } from 'bun:test'
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
const total = rows.length

afterEach(() => mock.restore())

test('row count within limit', () => {
  expect(total).toBeGreaterThan(0)
  expect(total).toBeLessThanOrEqual(100_000)
})

test('bands end at floor(total * fraction)', () => {
  let end = 0
  bands.forEach((band, i) => {
    end += band.split('\n').length
    expect(end).toBe(Math.floor(total * [0.1, 0.25, 0.5, 1][i]))
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

test('top is relative to each entry set', () => {
  spyOn(Math, 'random').mockReturnValue(1 - Number.EPSILON)
  const last = (count) => rows[Math.max(1, Math.floor(count)) - 1][0]
  const size = (fraction) => Math.floor(total * fraction)

  expect(full()).toBe(last(total))
  expect(top50()).toBe(last(size(0.5)))
  expect(top25()).toBe(last(size(0.25)))
  expect(top10()).toBe(last(size(0.1)))

  expect(full({ top: 0.1 })).toBe(last(total * 0.1))
  expect(top50({ top: 0.5 })).toBe(last(size(0.5) * 0.5))
  expect(top10({ top: 0.5 })).toBe(last(size(0.1) * 0.5))
  expect(top10({ top: 0.5, even: false })).toBe(last(size(0.1) * 0.5))
})
