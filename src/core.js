/**
 * @param {string[]} chunks rank bands, each `word\tfreq` lines sorted by freq desc
 */
export function create(chunks) {
  let words, cum

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

  return function noun({ top = 1, even = true } = {}) {
    if (!(top > 0 && top <= 1)) throw new RangeError(`top must be in (0, 1], got ${top}`)
    if (!words) load()
    const n = Math.max(1, Math.floor(words.length * top))
    if (even) return words[Math.floor(Math.random() * n)]

    const r = Math.random() * cum[n - 1]
    let lo = 0
    let hi = n - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cum[mid] > r) hi = mid
      else lo = mid + 1
    }
    return words[lo]
  }
}
