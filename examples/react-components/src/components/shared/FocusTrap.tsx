import { useEffect, useRef, ReactNode } from 'react'

export interface FocusTrapProps {
  children: ReactNode
  autoFocus?: boolean
  restoreFocus?: boolean
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function FocusTrap({
  children,
  autoFocus = false,
  restoreFocus = false
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Save previously focused element
    if (restoreFocus) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement
    }

    // Auto focus first element
    if (autoFocus) {
      const firstFocusable = container.querySelector<HTMLElement>(
        FOCUSABLE_SELECTOR
      )
      firstFocusable?.focus()
    }

    // Focus trap handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      )

      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)

      // Restore focus
      if (restoreFocus && previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus()
      }
    }
  }, [autoFocus, restoreFocus])

  return <div ref={containerRef}>{children}</div>
}
