// build/wiki-counts.tsv → data/*.js rank bands
const LIMIT = 100_000
const BANDS = [
  ['t10', 0.1],
  ['t25', 0.25],
  ['t50', 0.5],
  ['t100', 1],
] as const
const HEADER = '// CC BY-SA 4.0. See data/LICENSE.\n'

const rows = (await Bun.file('build/wiki-counts.tsv').text())
  .trim()
  .split('\n')
  .map((line) => {
    const [word, count] = line.split('\t')
    return { word, count: Number(count) }
  })
  .filter((row) => row.count > 0 && /^[가-힣]+$/.test(row.word))
  .sort((a, b) => b.count - a.count || (a.word < b.word ? -1 : a.word > b.word ? 1 : 0))
  .slice(0, LIMIT)

const total = rows.length
let start = 0
for (const [name, fraction] of BANDS) {
  const end = Math.floor(total * fraction)
  const body = rows
    .slice(start, end)
    .map((row) => `${row.word}\t${row.count}`)
    .join('\n')
  await Bun.write(`data/${name}.js`, `${HEADER}export default \`${body}\`\n`)
  start = end
}
await Bun.write('data/meta.js', `${HEADER}export const TOTAL = ${total}\n`)

console.log(`total ${total}`)
