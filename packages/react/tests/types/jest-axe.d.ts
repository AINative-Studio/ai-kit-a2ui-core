/**
 * Type declarations for jest-axe with Vitest
 * Provides accessibility testing matchers for Vitest
 */
declare module 'jest-axe' {
  import { AxeResults } from 'axe-core'

  export interface JestAxeConfigureOptions {
    globalOptions?: object
    impactLevels?: string[]
  }

  export function configureAxe(options?: JestAxeConfigureOptions): typeof axe
  export function axe(
    html: Element | string,
    options?: object
  ): Promise<AxeResults>
  export function toHaveNoViolations(results: AxeResults): {
    pass: boolean
    message: () => string
  }
}

/**
 * Extend Vitest's Assertion interface with jest-axe matchers
 */
declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveNoViolations(): T
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): any
  }
}
