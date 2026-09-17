import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/top10.ts', 'src/top25.ts', 'src/top50.ts'],
  format: 'esm',
  platform: 'neutral',
  dts: true,
  unbundle: true,
  copy: [{ from: 'src/data/LICENSE', to: 'dist/data' }],
})
