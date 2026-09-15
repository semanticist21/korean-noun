import t10 from '../data/t10.js'
import t25 from '../data/t25.js'
import t50 from '../data/t50.js'
import t100 from '../data/t100.js'
import { TOTAL } from '../data/meta.js'
import { create } from './core.js'

export const noun = /* @__PURE__ */ create([t10, t25, t50, t100], 1, TOTAL)
