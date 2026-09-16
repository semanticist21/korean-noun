const OPTION_KEYS = new Set([
  'top',
  'even',
  'length',
  'minLength',
  'maxLength',
  'startsWith',
  'endsWith',
  'batchim',
  'random',
])
const HANGUL = /^[가-힣]+$/

/**
 * @param {string[]} chunks rank bands, each `word\tfreq` lines sorted by freq desc
 */
export function create(chunks) {
  let words, cum, buckets

  function load() {
    const lines = chunks.filter(Boolean).join('\n').split('\n')
    words = new Array(lines.length)
    cum = new Float64Array(lines.length)
    let sum = 0
    for (let i = 0; i < lines.length; i++) {
      const tab = lines[i].indexOf('\t')
      words[i] = lines[i].slice(0, tab)
      cum[i] = sum += Number(lines[i].slice(tab + 1))
    }
  }

  const freq = (rank) => cum[rank] - (rank ? cum[rank - 1] : 0)

  // buckets[length] = ranks of words with that length (ascending) and their running freq sums
  function loadBuckets() {
    const groups = []
    for (let i = 0; i < words.length; i++) (groups[words[i].length] ??= []).push(i)
    buckets = groups.map((ranks) => {
      const index = Uint32Array.from(ranks)
      const sums = new Float64Array(index.length)
      let sum = 0
      for (let j = 0; j < index.length; j++) sums[j] = sum += freq(index[j])
      return { index, sums }
    })
  }

  function rankLimit(top) {
    if (!words) load()
    return Math.max(1, Math.floor(words.length * top))
  }

  function candidates(o, n) {
    const ranks = []
    for (let i = 0; i < n; i++) if (o.match(words[i])) ranks.push(i)
    return ranks
  }

  function noun(options) {
    const o = parseOptions(options)
    const n = rankLimit(o.top)

    if (!o.lengthFiltered && !o.textFiltered) {
      return words[o.even ? Math.floor(o.random() * n) : search(cum, n, o.random() * cum[n - 1])]
    }

    if (!o.textFiltered) {
      if (!buckets) loadBuckets()
      const parts = []
      let total = 0
      for (let len = o.min; len <= Math.min(o.max, buckets.length - 1); len++) {
        const bucket = buckets[len]
        if (!bucket) continue
        const count = countBelow(bucket.index, n)
        if (!count) continue
        const weight = o.even ? count : bucket.sums[count - 1]
        parts.push({ bucket, count, weight })
        total += weight
      }
      if (!total) throw noMatch()

      let r = o.random() * total
      for (let p = 0; p < parts.length; p++) {
        const { bucket, count, weight } = parts[p]
        if (r < weight || p === parts.length - 1) {
          const j = o.even ? Math.min(Math.floor(r), count - 1) : search(bucket.sums, count, r)
          return words[bucket.index[j]]
        }
        r -= weight
      }
    }

    const ranks = candidates(o, n)
    if (!ranks.length) throw noMatch()
    if (o.even) return words[ranks[Math.floor(o.random() * ranks.length)]]
    const sums = new Float64Array(ranks.length)
    let sum = 0
    for (let j = 0; j < ranks.length; j++) sums[j] = sum += freq(ranks[j])
    return words[ranks[search(sums, ranks.length, o.random() * sum)]]
  }

  function nouns(count, options) {
    const o = parseOptions(options)
    if (typeof count !== 'number') throw new TypeError('count must be a number')
    if (!Number.isInteger(count) || count < 0) {
      throw new RangeError(`count must be an integer >= 0, got ${count}`)
    }
    if (count === 0) return []
    const n = rankLimit(o.top)
    const ranks =
      o.lengthFiltered || o.textFiltered
        ? Uint32Array.from(candidates(o, n))
        : Uint32Array.from({ length: n }, (_, i) => i)
    if (count > ranks.length) {
      throw new RangeError(`requested ${count} nouns but only ${ranks.length} match the given options`)
    }

    if (o.even) {
      // partial Fisher–Yates
      const picked = []
      for (let i = 0; i < count; i++) {
        const j = i + Math.floor(o.random() * (ranks.length - i))
        const rank = ranks[j]
        ranks[j] = ranks[i]
        ranks[i] = rank
        picked.push(words[rank])
      }
      return picked
    }

    // Efraimidis–Spirakis: the `count` largest keys log(u) / freq, in descending key order,
    // are a weighted sample without replacement in selection order.
    const keys = new Float64Array(count)
    const items = new Uint32Array(count)
    let size = 0
    for (const rank of ranks) {
      const key = Math.log(o.random()) / freq(rank)
      if (size < count) {
        let i = size++
        while (i > 0) {
          const parent = (i - 1) >> 1
          if (keys[parent] <= key) break
          keys[i] = keys[parent]
          items[i] = items[parent]
          i = parent
        }
        keys[i] = key
        items[i] = rank
      } else if (key > keys[0]) {
        let i = 0
        while (true) {
          const left = 2 * i + 1
          if (left >= size) break
          const child = left + 1 < size && keys[left + 1] < keys[left] ? left + 1 : left
          if (keys[child] >= key) break
          keys[i] = keys[child]
          items[i] = items[child]
          i = child
        }
        keys[i] = key
        items[i] = rank
      }
    }
    return Array.from({ length: size }, (_, i) => i)
      .sort((a, b) => keys[b] - keys[a])
      .map((i) => words[items[i]])
  }

  return { noun, nouns }
}

function parseOptions(options) {
  if (options === undefined) options = {}
  const proto = options !== null && typeof options === 'object' ? Object.getPrototypeOf(options) : undefined
  if (Array.isArray(options) || (proto !== Object.prototype && proto !== null)) {
    throw new TypeError('options must be an object')
  }
  for (const key of Object.keys(options)) {
    if (!OPTION_KEYS.has(key)) throw new TypeError(`unknown option: ${key}`)
  }
  const { top = 1, even = true, length, startsWith, endsWith, batchim, random = Math.random } = options
  let { minLength, maxLength } = options

  if (typeof top !== 'number') throw new TypeError('top must be a number')
  if (!(top > 0 && top <= 1)) throw new RangeError(`top must be in (0, 1], got ${top}`)
  if (typeof even !== 'boolean') throw new TypeError('even must be a boolean')
  for (const [name, value] of [
    ['length', length],
    ['minLength', minLength],
    ['maxLength', maxLength],
  ]) {
    if (value !== undefined && typeof value !== 'number') throw new TypeError(`${name} must be a number`)
  }
  if (length !== undefined) {
    if (minLength !== undefined || maxLength !== undefined) {
      throw new TypeError('length cannot be combined with minLength or maxLength')
    }
    minLength = maxLength = length
  }
  const min = minLength ?? 1
  const max = maxLength ?? Number.POSITIVE_INFINITY
  if (!isCount(min) || !(isCount(max) || max === Number.POSITIVE_INFINITY) || min > max) {
    const detail = length !== undefined ? `length ${length}` : `minLength ${min}, maxLength ${max}`
    throw new RangeError(`invalid length range: ${detail}`)
  }
  for (const [name, value] of [
    ['startsWith', startsWith],
    ['endsWith', endsWith],
  ]) {
    if (value === undefined) continue
    if (typeof value !== 'string') throw new TypeError(`${name} must be a string`)
    if (!HANGUL.test(value)) throw new RangeError(`${name} must be one or more Hangul syllables, got '${value}'`)
  }
  if (batchim !== undefined && typeof batchim !== 'boolean') throw new TypeError('batchim must be a boolean')
  if (typeof random !== 'function') throw new TypeError('random must be a function')

  return {
    top,
    even,
    min,
    max,
    lengthFiltered: min !== 1 || max !== Number.POSITIVE_INFINITY,
    textFiltered: startsWith !== undefined || endsWith !== undefined || batchim !== undefined,
    random() {
      const r = random()
      if (typeof r !== 'number' || !(r >= 0 && r < 1)) {
        throw new RangeError(`random() must return a number in [0, 1), got ${r}`)
      }
      return r
    },
    match: (word) =>
      word.length >= min &&
      word.length <= max &&
      (startsWith === undefined || word.startsWith(startsWith)) &&
      (endsWith === undefined || word.endsWith(endsWith)) &&
      (batchim === undefined || hasBatchim(word) === batchim),
  }
}

function hasBatchim(word) {
  return (word.charCodeAt(word.length - 1) - 0xac00) % 28 !== 0
}

function isCount(value) {
  return Number.isInteger(value) && value >= 1
}

function noMatch() {
  return new RangeError('no noun matches the given options')
}

// first j < count with sums[j] > r, else count - 1
function search(sums, count, r) {
  let lo = 0
  let hi = count - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sums[mid] > r) hi = mid
    else lo = mid + 1
  }
  return lo
}

// number of sorted values < limit
function countBelow(sorted, limit) {
  let lo = 0
  let hi = sorted.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sorted[mid] < limit) lo = mid + 1
    else hi = mid
  }
  return lo
}
