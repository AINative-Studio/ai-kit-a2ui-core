import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKeyPress } from './useKeyPress'

describe('useKeyPress', () => {
  it('should call callback on key press', () => {
    const callback = vi.fn()
    renderHook(() => useKeyPress('Escape', callback))

    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    document.dispatchEvent(event)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should not call callback for different key', () => {
    const callback = vi.fn()
    renderHook(() => useKeyPress('Escape', callback))

    const event = new KeyboardEvent('keydown', { key: 'Enter' })
    document.dispatchEvent(event)

    expect(callback).not.toHaveBeenCalled()
  })

  it('should support multiple keys', () => {
    const callback = vi.fn()
    renderHook(() => useKeyPress(['Escape', 'Esc'], callback))

    const event1 = new KeyboardEvent('keydown', { key: 'Escape' })
    document.dispatchEvent(event1)
    expect(callback).toHaveBeenCalledTimes(1)

    const event2 = new KeyboardEvent('keydown', { key: 'Esc' })
    document.dispatchEvent(event2)
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('should cleanup listener on unmount', () => {
    const callback = vi.fn()
    const { unmount } = renderHook(() => useKeyPress('Escape', callback))

    unmount()

    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    document.dispatchEvent(event)

    expect(callback).not.toHaveBeenCalled()
  })
})
