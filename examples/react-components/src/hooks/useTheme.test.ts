import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from './useTheme'

describe('useTheme', () => {
  beforeEach(() => {
    // Reset theme
    document.documentElement.removeAttribute('data-theme')
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should default to light theme', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })

  it('should set theme on document element', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(result.current.theme).toBe('dark')
  })

  it('should persist theme in localStorage', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(localStorage.getItem('a2ui-theme')).toBe('dark')
  })

  it('should load theme from localStorage', () => {
    localStorage.setItem('a2ui-theme', 'dark')

    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('should handle auto theme based on system preference', () => {
    const matchMediaMock = vi.fn((query: string) => ({
      matches: query.includes('prefers-color-scheme: dark'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))

    vi.stubGlobal('matchMedia', matchMediaMock)

    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('auto')
    })

    expect(result.current.theme).toBe('auto')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('should toggle between light and dark', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.theme).toBe('dark')

    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.theme).toBe('light')
  })
})
