import t10 from '../data/t10.js'
import t25 from '../data/t25.js'
import { TOTAL } from '../data/meta.js'
import { create } from './core.js'

export const noun = /* @__PURE__ */ create([t10, t25], 0.25, TOTAL)
