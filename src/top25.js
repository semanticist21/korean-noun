import t10 from '../data/t10.js'
import t25 from '../data/t25.js'
import { create } from './core.js'

const api = /* @__PURE__ */ create([t10, t25])

export const noun = api.noun
export const nouns = api.nouns
