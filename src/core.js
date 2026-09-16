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

  // buckets[length] = ranks of words with that length (ascending) and their running freq sums
  function loadBuckets() {
    const groups = []
    for (let i = 0; i < words.length; i++) (groups[words[i].length] ??= []).push(i)
    buckets = groups.map((ranks) => {
      const index = Uint32Array.from(ranks)
      const sums = new Float64Array(index.length)
      let sum = 0
      for (let j = 0; j < index.length; j++) {
        const i = index[j]
        sums[j] = sum += cum[i] - (i ? cum[i - 1] : 0)
      }
      return { index, sums }
    })
  }

  return function noun({ top = 1, even = true, length, minLength, maxLength } = {}) {
    if (!(top > 0 && top <= 1)) throw new RangeError(`top must be in (0, 1], got ${top}`)
    if (length !== undefined) {
      if (minLength !== undefined || maxLength !== undefined) {
        throw new TypeError('length cannot be combined with minLength or maxLength')
      }
      minLength = maxLength = length
    }
    const min = minLength ?? 1
    const max = maxLength ?? Number.POSITIVE_INFINITY
    if (!isCount(min) || !(isCount(max) || max === Number.POSITIVE_INFINITY) || min > max) {
      throw new RangeError(`invalid length range: ${minLength ?? length}..${maxLength ?? length}`)
    }

    if (!words) load()
    const n = Math.max(1, Math.floor(words.length * top))

    if (min === 1 && max === Number.POSITIVE_INFINITY) {
      return words[even ? Math.floor(Math.random() * n) : search(cum, n, Math.random() * cum[n - 1])]
    }

    if (!buckets) loadBuckets()
    const parts = []
    let total = 0
    for (let len = min; len <= Math.min(max, buckets.length - 1); len++) {
      const bucket = buckets[len]
      if (!bucket) continue
      const count = countBelow(bucket.index, n)
      if (!count) continue
      const weight = even ? count : bucket.sums[count - 1]
      parts.push({ bucket, count, weight })
      total += weight
    }
    if (!total) throw new RangeError('no noun matches the given options')

    let r = Math.random() * total
    for (let p = 0; p < parts.length; p++) {
      const { bucket, count, weight } = parts[p]
      if (r < weight || p === parts.length - 1) {
        const j = even ? Math.min(Math.floor(r), count - 1) : search(bucket.sums, count, r)
        return words[bucket.index[j]]
      }
      r -= weight
    }
  }
}

function isCount(value) {
  return Number.isInteger(value) && value >= 1
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
