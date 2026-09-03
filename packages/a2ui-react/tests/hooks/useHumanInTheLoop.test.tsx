import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useHumanInTheLoop } from '../../src/hooks/useHumanInTheLoop'

describe('useHumanInTheLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should start with no pending approvals', () => {
    const { result } = renderHook(() => useHumanInTheLoop())

    expect(result.current.pendingApprovals).toEqual([])
  })

  it('should add a pending approval when requestApproval is called', () => {
    const { result } = renderHook(() => useHumanInTheLoop<{ amount: number }>())

    act(() => {
      void result.current.requestApproval('withdraw', { amount: 100 })
    })

    expect(result.current.pendingApprovals).toHaveLength(1)
    expect(result.current.pendingApprovals[0]?.action).toBe('withdraw')
    expect(result.current.pendingApprovals[0]?.data).toEqual({ amount: 100 })
  })

  it('should resolve true and remove the approval when approve is called', async () => {
    const { result } = renderHook(() => useHumanInTheLoop<{ amount: number }>())

    let promise!: Promise<boolean>
    act(() => {
      promise = result.current.requestApproval('withdraw', { amount: 100 })
    })

    const id = result.current.pendingApprovals[0]!.id

    act(() => {
      result.current.approve(id)
    })

    await expect(promise).resolves.toBe(true)
    expect(result.current.pendingApprovals).toHaveLength(0)
  })

  it('should resolve false and remove the approval when reject is called', async () => {
    const { result } = renderHook(() => useHumanInTheLoop<{ amount: number }>())

    let promise!: Promise<boolean>
    act(() => {
      promise = result.current.requestApproval('withdraw', { amount: 100 })
    })

    const id = result.current.pendingApprovals[0]!.id

    act(() => {
      result.current.reject(id)
    })

    await expect(promise).resolves.toBe(false)
    expect(result.current.pendingApprovals).toHaveLength(0)
  })

  it('should auto-reject after the timeout elapses', async () => {
    const { result } = renderHook(() => useHumanInTheLoop<{ amount: number }>())

    let promise!: Promise<boolean>
    act(() => {
      promise = result.current.requestApproval('withdraw', { amount: 100 }, 5000)
    })

    expect(result.current.pendingApprovals).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    await expect(promise).resolves.toBe(false)
    expect(result.current.pendingApprovals).toHaveLength(0)
  })

  it('should not auto-reject before the timeout elapses', () => {
    const { result } = renderHook(() => useHumanInTheLoop<{ amount: number }>())

    act(() => {
      void result.current.requestApproval('withdraw', { amount: 100 }, 5000)
    })

    act(() => {
      vi.advanceTimersByTime(4999)
    })

    expect(result.current.pendingApprovals).toHaveLength(1)
  })

  it('should not schedule a timeout when none is provided', () => {
    const { result } = renderHook(() => useHumanInTheLoop())

    act(() => {
      void result.current.requestApproval('withdraw', {})
    })

    act(() => {
      vi.advanceTimersByTime(100000)
    })

    // No timeout means it stays pending indefinitely until approve/reject.
    expect(result.current.pendingApprovals).toHaveLength(1)
  })

  it('should remove an approval via clear without resolving its promise settled state observably', () => {
    const { result } = renderHook(() => useHumanInTheLoop<{ amount: number }>())

    act(() => {
      void result.current.requestApproval('withdraw', { amount: 100 })
    })

    const id = result.current.pendingApprovals[0]!.id

    act(() => {
      result.current.clear(id)
    })

    expect(result.current.pendingApprovals).toHaveLength(0)
  })

  it('should be a no-op when approving an id that does not exist', () => {
    const { result } = renderHook(() => useHumanInTheLoop())

    expect(() => {
      act(() => {
        result.current.approve('nonexistent-id')
      })
    }).not.toThrow()

    expect(result.current.pendingApprovals).toHaveLength(0)
  })

  it('should be a no-op when rejecting an id that does not exist', () => {
    const { result } = renderHook(() => useHumanInTheLoop())

    expect(() => {
      act(() => {
        result.current.reject('nonexistent-id')
      })
    }).not.toThrow()
  })

  it('should handle multiple concurrent approvals independently', async () => {
    const { result } = renderHook(() => useHumanInTheLoop<{ amount: number }>())

    let promise1!: Promise<boolean>
    let promise2!: Promise<boolean>

    act(() => {
      promise1 = result.current.requestApproval('withdraw', { amount: 100 })
      promise2 = result.current.requestApproval('transfer', { amount: 50 })
    })

    expect(result.current.pendingApprovals).toHaveLength(2)

    const id1 = result.current.pendingApprovals[0]!.id
    const id2 = result.current.pendingApprovals[1]!.id

    act(() => {
      result.current.approve(id1)
      result.current.reject(id2)
    })

    await expect(promise1).resolves.toBe(true)
    await expect(promise2).resolves.toBe(false)
    expect(result.current.pendingApprovals).toHaveLength(0)
  })

  it('should maintain stable function references across rerenders', () => {
    const { result, rerender } = renderHook(() => useHumanInTheLoop())

    const requestApprovalRef1 = result.current.requestApproval
    const approveRef1 = result.current.approve
    const rejectRef1 = result.current.reject
    const clearRef1 = result.current.clear

    rerender()

    expect(result.current.requestApproval).toBe(requestApprovalRef1)
    expect(result.current.approve).toBe(approveRef1)
    expect(result.current.reject).toBe(rejectRef1)
    expect(result.current.clear).toBe(clearRef1)
  })
})
