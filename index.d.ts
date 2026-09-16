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
}

/**
 * Returns a random Korean noun. `top` picks the frequency range first, then length options filter within it.
 * Throws `RangeError` for out-of-range options or when no noun matches,
 * `TypeError` when `length` is combined with `minLength`/`maxLength`.
 */
export function noun(options?: NounOptions): string
