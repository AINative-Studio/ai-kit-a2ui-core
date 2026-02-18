/// <reference types="vitest/globals" />
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'

// Extend Vitest expect with jest-dom matchers
expect.extend(toHaveNoViolations)

// Cleanup after each test case (e.g., clearing jsdom)
afterEach(() => {
  cleanup()
})
