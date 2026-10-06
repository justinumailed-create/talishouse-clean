/**
 * Widens an `as const` English content object into the shape a translation
 * must provide: same keys and nesting, any string values.
 */
export type Localized<T> = T extends string
  ? string
  : T extends number | boolean | null | undefined
    ? T
    : T extends (...args: never[]) => unknown
      ? T
      : T extends readonly (infer U)[]
        ? readonly Localized<U>[]
        : { -readonly [K in keyof T]: Localized<T[K]> };
