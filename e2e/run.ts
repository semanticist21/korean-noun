// Pack the package, install it into a Vite app, build it, check tree-shaking by bundle size,
// then load the built pages in headless Chrome.
import { cpSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import puppeteer from 'puppeteer-core'
import t10 from '../data/t10.js'
import t25 from '../data/t25.js'
import t50 from '../data/t50.js'
import t100 from '../data/t100.js'

const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 4179
const root = resolve(import.meta.dir, '..')

const list = (...bands: string[]) => bands.join('\n').split('\n').map((line) => line.split('\t')[0])
const top10List = list(t10)
const top10Words = new Set(top10List)
const top5Words = new Set(top10List.slice(0, Math.floor(top10List.length / 2)))
const allWords = new Set(list(t10, t25, t50, t100))

function sh(cmd: string[], cwd: string, env: Record<string, string> = {}) {
  const result = Bun.spawnSync(cmd, { cwd, env: { ...process.env, ...env }, stdout: 'pipe', stderr: 'inherit' })
  if (result.exitCode !== 0) throw new Error(`${cmd.join(' ')} exited ${result.exitCode}`)
  return result.stdout.toString()
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

// Total size of the entry script plus every chunk the page preloads.
async function pageBytes(dist: string, page: string) {
  const html = await Bun.file(join(dist, page)).text()
  const assets = [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.js)"/g)].map((m) => m[1])
  assert(assets.length > 0, `${page}: no JS assets`)
  return assets.reduce((sum, asset) => sum + statSync(join(dist, asset)).size, 0)
}

const work = mkdtempSync(join(tmpdir(), 'korean-noun-e2e-'))
let preview: ReturnType<typeof Bun.spawn> | undefined
let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined

try {
  const packed = sh(['npm', 'pack', '--pack-destination', work, '--silent'], root).trim().split('\n').pop()!
  const app = join(work, 'app')
  cpSync(join(root, 'e2e/app'), app, { recursive: true })
  await Bun.write(join(app, 'package.json'), JSON.stringify({ name: 'e2e-app', private: true, type: 'module' }))
  sh(['npm', 'install', '--no-audit', '--no-fund', join(work, packed)], app)

  // Bun runtime consumer. Own transpiler cache so a broken global cache on the machine can't affect the result.
  const bunOut = sh(
    [
      'bun',
      '-e',
      "import { noun } from 'korean-noun'; import { noun as top10 } from 'korean-noun/top10'; console.log(JSON.stringify([noun(), noun({ even: false }), top10()]))",
    ],
    app,
    { BUN_RUNTIME_TRANSPILER_CACHE_PATH: join(work, 'bun-cache') },
  )
  const [bunFull, bunWeighted, bunTop10] = JSON.parse(bunOut)
  assert(allWords.has(bunFull) && allWords.has(bunWeighted), `bun: unexpected words ${bunOut}`)
  assert(top10Words.has(bunTop10), `bun: ${bunTop10} not in top 10%`)
  console.log('bun runtime ok', bunOut.trim())

  const vite = join(root, 'node_modules/.bin/vite')
  sh([vite, 'build'], app)
  const dist = join(app, 'dist')
  const fullBytes = await pageBytes(dist, 'full.html')
  const top10Bytes = await pageBytes(dist, 'top10.html')
  console.log(`bundle: full ${fullBytes} B, top10 ${top10Bytes} B`)
  assert(top10Bytes < fullBytes * 0.2, 'top10 bundle is not tree-shaken')

  preview = Bun.spawn([vite, 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    cwd: app,
    stdout: 'ignore',
  })
  const base = `http://127.0.0.1:${PORT}`
  for (let i = 0; ; i++) {
    if (await fetch(`${base}/full.html`).then((r) => r.ok, () => false)) break
    assert(i < 300, 'vite preview did not start')
    await Bun.sleep(100)
  }

  browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
  const read = async (page: string) => {
    const tab = await browser!.newPage()
    const errors: string[] = []
    tab.on('pageerror', (error) => errors.push(String(error)))
    tab.on('console', (message) => message.type() === 'error' && errors.push(message.text()))
    await tab.goto(`${base}/${page}`, { waitUntil: 'networkidle0' })
    const text = await tab.$eval('#out', (el) => el.textContent)
    assert(errors.length === 0, `${page}: ${errors.join('; ')}`)
    return JSON.parse(text!)
  }

  const full = await read('full.html')
  assert(full.words.every((w: string) => allWords.has(w)), `full.html: unexpected words ${full.words}`)
  assert(top10Words.has(full.top10), `full.html: ${full.top10} not in top 10%`)

  const top10 = await read('top10.html')
  assert(top10.words.every((w: string) => top10Words.has(w)), `top10.html: unexpected words ${top10.words}`)
  assert(top5Words.has(top10.half), `top10.html: top 0.5 gave ${top10.half}, outside top half of top10 set`)
  assert(top10.three.length === 3 && top10Words.has(top10.three), `top10.html: length 3 gave ${top10.three}`)
  assert(top10.error === 'RangeError', `top10.html: expected RangeError for top 1.5, got ${top10.error}`)

  console.log('e2e ok', { full, top10 })
} finally {
  await browser?.close()
  preview?.kill()
  rmSync(work, { recursive: true, force: true })
}
