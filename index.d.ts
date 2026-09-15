export interface NounOptions {
  /** Pick from the top fraction of nouns by usage frequency, in (0, 1]. Defaults to the entry's max. */
  top?: number
  /** `true`: every noun in range is equally likely. `false`: weighted by usage frequency. Defaults to `true`. */
  even?: boolean
}

/** Returns a random Korean noun. Throws `RangeError` if `top` is out of range for the entry. */
export function noun(options?: NounOptions): string
