import { useState, useCallback, useRef } from 'react'

export interface PendingApproval<T = unknown> {
  id: string
  action: string
  data: T
  timestamp: number
  timeout?: number
}

export interface UseHumanInTheLoopReturn<T = unknown> {
  pendingApprovals: PendingApproval<T>[]
  requestApproval: (action: string, data: T, timeout?: number) => Promise<boolean>
  approve: (id: string) => void
  reject: (id: string) => void
  clear: (id: string) => void
}

export function useHumanInTheLoop<T = unknown>(): UseHumanInTheLoopReturn<T> {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval<T>[]>([])
  const resolversRef = useRef<Map<string, (approved: boolean) => void>>(new Map())

  const requestApproval = useCallback((
    action: string,
    data: T,
    timeout?: number
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const timestamp = Date.now()
      const random = Math.random().toString(36).substr(2, 9)
      const id = action + '-' + timestamp + '-' + random
      
      const approval: PendingApproval<T> = {
        id,
        action,
        data,
        timestamp,
        timeout
      }

      setPendingApprovals((prev) => [...prev, approval])
      resolversRef.current.set(id, resolve)

      if (timeout) {
        setTimeout(() => {
          const resolver = resolversRef.current.get(id)
          if (resolver) {
            resolver(false)
            resolversRef.current.delete(id)
          }

          setPendingApprovals((prev) => prev.filter((a) => a.id !== id))
        }, timeout)
      }
    })
  }, [])

  const approve = useCallback((id: string) => {
    const resolver = resolversRef.current.get(id)
    if (resolver) {
      resolver(true)
      resolversRef.current.delete(id)
    }

    setPendingApprovals((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const reject = useCallback((id: string) => {
    const resolver = resolversRef.current.get(id)
    if (resolver) {
      resolver(false)
      resolversRef.current.delete(id)
    }

    setPendingApprovals((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const clear = useCallback((id: string) => {
    setPendingApprovals((prev) => prev.filter((a) => a.id !== id))
    resolversRef.current.delete(id)
  }, [])

  return {
    pendingApprovals,
    requestApproval,
    approve,
    reject,
    clear
  }
}
