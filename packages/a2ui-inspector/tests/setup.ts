/**
 * Test setup file
 */

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Chrome API
global.chrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    connect: vi.fn(),
    getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`)
  },
  devtools: {
    inspectedWindow: {
      tabId: 1,
      eval: vi.fn()
    },
    panels: {
      create: vi.fn()
    }
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn()
    }
  },
  tabs: {
    sendMessage: vi.fn(),
    query: vi.fn()
  }
} as unknown as typeof chrome

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock URL.createObjectURL and URL.revokeObjectURL for jsdom
global.URL.createObjectURL = vi.fn(() => 'mock-blob-url')
global.URL.revokeObjectURL = vi.fn()

// Mock ResizeObserver for virtualization testing
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()

  constructor(callback: ResizeObserverCallback) {
    // Immediately trigger callback with mock data for tests
    setTimeout(() => {
      callback(
        [
          {
            target: document.createElement('div'),
            contentRect: {
              x: 0,
              y: 0,
              width: 400,
              height: 600,
              top: 0,
              right: 400,
              bottom: 600,
              left: 0,
              toJSON: () => ({})
            },
            borderBoxSize: [] as any,
            contentBoxSize: [] as any,
            devicePixelContentBoxSize: [] as any
          }
        ] as ResizeObserverEntry[],
        this
      )
    }, 0)
  }
}
