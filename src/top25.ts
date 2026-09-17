import t10 from './data/t10.ts'
import t25 from './data/t25.ts'
import { create, type NounApi } from './core.ts'

const api = /* @__PURE__ */ create([t10, t25])

export const noun: NounApi['noun'] = api.noun
export const nouns: NounApi['nouns'] = api.nouns

export type { NounOptions } from './core.ts'
