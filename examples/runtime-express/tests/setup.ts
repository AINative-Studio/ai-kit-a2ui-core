import { beforeEach, vi } from 'vitest'

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-secret-key-for-testing-only'
process.env.OPENAI_API_KEY = 'sk-test-key'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.RATE_LIMIT_WINDOW_MS = '60000'
process.env.RATE_LIMIT_MAX_REQUESTS = '60'
process.env.NODE_ENV = 'test'

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})
