import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'
import '@testing-library/jest-dom'

// Extend Vitest expect with jest-axe matchers
expect.extend(toHaveNoViolations)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Global test setup
globalThis.IS_REACT_ACT_ENVIRONMENT = true

