// jest-dom 7 still types its matchers for Vitest 4's `Assertion<T>`. Vitest 5
// reads custom matchers from `Matchers<R, T>`, so register them there. Merged
// declarations must repeat every type parameter, used or not.
/* eslint-disable typescript/no-empty-object-type */
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare module 'vitest' {
  interface Matchers<
    R extends void | Promise<void> = void | Promise<void>,
    T = unknown,
  > extends TestingLibraryMatchers<unknown, R> {}
}
