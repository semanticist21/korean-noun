export interface NounOptions {
  /** Pick from the top fraction, in (0, 1], of this entry's nouns by usage frequency. Defaults to 1. */
  top?: number
  /** `true`: every noun in range is equally likely. `false`: weighted by usage frequency. Defaults to `true`. */
  even?: boolean
}

/** Returns a random Korean noun. Throws `RangeError` if `top` is not in (0, 1]. */
export function noun(options?: NounOptions): string
