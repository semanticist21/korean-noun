import t10 from '../data/t10.js'
import t25 from '../data/t25.js'
import t50 from '../data/t50.js'
import { create } from './core.js'

const api = /* @__PURE__ */ create([t10, t25, t50])

export const noun = api.noun
export const nouns = api.nouns
