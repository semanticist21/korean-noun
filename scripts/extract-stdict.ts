// raw/stdict/*.zip (표준국어대사전 XML 전체 내려받기) → build/stdict-nouns.txt
import { mkdirSync } from 'node:fs'

const [zip] = await Array.fromAsync(new Bun.Glob('raw/stdict/*.zip').scan())
if (!zip) throw new Error('raw/stdict/*.zip not found')

const run = (cmd: string[]) => new Response(Bun.spawn(cmd).stdout).text()
const values = (xml: string, tag: string) =>
  [...xml.matchAll(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, 'g'))].map((m) => m[1])

const PROPER = new Set(['인명', '지명', '책명', '고유명 일반'])
const SLUR = /(낮잡아|속되게|비속하게|비하하여) 이르는 말/

const dropped = { proper: 0, slur: 0, shape: 0 }
const nouns = new Set<string>()
let total = 0

for (const name of (await run(['unzip', '-Z1', zip])).trim().split('\n')) {
  const xml = await run(['unzip', '-p', zip, name])
  for (const [, item] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    if (!values(item, 'pos').includes('명사')) continue
    total++
    const senses = values(item, 'sense_info')
    const definitions = senses.map((sense) => values(sense, 'definition')[0] ?? '')

    if (senses.every((sense) => values(sense, 'cat').some((cat) => PROPER.has(cat)))) dropped.proper++
    else if (definitions.some((d) => SLUR.test(d))) dropped.slur++
    else {
      // word_info's own <word> comes before relation/lexical <word>s; strip markup and homonym number
      const word = values(item, 'word')[0].replace(/[-^]|\d+$/g, '')
      if (/^[가-힣]+$/.test(word)) nouns.add(word)
      else dropped.shape++
    }
  }
}

mkdirSync('build', { recursive: true })
await Bun.write('build/stdict-nouns.txt', `${[...nouns].sort().join('\n')}\n`)
console.log({ total, dropped, unique: nouns.size })
