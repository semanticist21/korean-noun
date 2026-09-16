export interface NounOptions {
  /** Pick from the top fraction, in (0, 1], of this entry's nouns by usage frequency. Defaults to 1. */
  top?: number
  /** `true`: every noun in range is equally likely. `false`: weighted by usage frequency. Defaults to `true`. */
  even?: boolean
  /** Exact number of syllables. Cannot be combined with `minLength` or `maxLength`. */
  length?: number
  /** Minimum number of syllables, inclusive. */
  minLength?: number
  /** Maximum number of syllables, inclusive. */
  maxLength?: number
  /** Word starts with these Hangul syllables. Literal match (no 두음법칙). */
  startsWith?: string
  /** Word ends with these Hangul syllables. */
  endsWith?: string
  /** `true`: last syllable has a final consonant (받침), `false`: it has none. ㄹ counts as 받침. */
  batchim?: boolean
  /** Random source returning numbers in [0, 1). Defaults to `Math.random`. */
  random?: () => number
}

/**
 * Returns a random Korean noun. `top` cuts the frequency range first; the other filters apply within it.
 * Throws `RangeError` for invalid values or when no noun matches, `TypeError` for wrong types,
 * unknown option keys, or `length` combined with `minLength`/`maxLength`.
 */
export function noun(options?: NounOptions): string

/**
 * Returns `count` distinct random nouns in selection order. With `even: false`, picks are weighted
 * successive sampling without replacement. Throws `RangeError` if fewer than `count` nouns match.
 * `count` 0 returns `[]` after validating options, even when no noun would match.
 */
export function nouns(count: number, options?: NounOptions): string[]
