import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { A2UISidebarProps } from '../types'
import { A2UIChat } from './A2UIChat'
import styles from './A2UISidebar.module.css'

export const A2UISidebar: React.FC<A2UISidebarProps> = ({
  position = 'right',
  mode = 'overlay',
  theme = 'light',
  className = '',
  width = 400,
  chatProps = {},
  isOpen: controlledIsOpen,
  onOpen,
  onClose,
  defaultOpen = false,
  showToggle = false,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen)
  const [dataState, setDataState] = useState<'closed' | 'open' | 'closing'>('closed')
  const sidebarRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout>()

  // Determine if component is controlled or uncontrolled
  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen

  // Handle initial open state
  useEffect(() => {
    if (defaultOpen) {
      setDataState('open')
    }
  }, [defaultOpen])

  const handleOpen = useCallback(() => {
    if (!isControlled) {
      setInternalIsOpen(true)
    }
    setDataState('open')
    onOpen?.()
  }, [isControlled, onOpen])

  const handleClose = useCallback(() => {
    setDataState('closing')

    // Wait for animation before actually closing
    closeTimeoutRef.current = setTimeout(() => {
      if (!isControlled) {
        setInternalIsOpen(false)
      }
      setDataState('closed')
      onClose?.()
    }, 300) // Match animation duration
  }, [isControlled, onClose])

  const handleToggle = useCallback(() => {
    if (isOpen) {
      handleClose()
    } else {
      handleOpen()
    }
  }, [isOpen, handleOpen, handleClose])

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [isOpen, handleClose])

  // Lock body scroll in overlay mode
  useEffect(() => {
    if (isOpen && mode === 'overlay') {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen, mode])

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose()
      }
    },
    [handleClose]
  )

  // Focus management - trap focus within sidebar in overlay mode
  useEffect(() => {
    if (!isOpen || mode !== 'overlay' || !sidebarRef.current) return

    const sidebar = sidebarRef.current
    const focusableElements = sidebar.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    sidebar.addEventListener('keydown', handleTab)
    firstElement?.focus()

    return () => {
      sidebar.removeEventListener('keydown', handleTab)
    }
  }, [isOpen, mode])

  const sidebarWidth = typeof width === 'number' ? `${width}px` : width

  return (
    <div
      className={`${styles.sidebarWrapper} ${className}`}
      data-position={position}
      data-mode={mode}
    >
      {/* Toggle Button */}
      {showToggle && (
        <div className={styles.toggleButtonContainer} data-position={position}>
          <button
            ref={toggleRef}
            className={styles.toggleButton}
            onClick={handleToggle}
            aria-label={`Toggle ${position} sidebar`}
            aria-expanded={isOpen}
            data-theme={theme}
          >
            <svg
              className={styles.toggleIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      {/* Overlay (only in overlay mode) */}
      {mode === 'overlay' && isOpen && (
        <div
          className={styles.overlay}
          onClick={handleOverlayClick}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={styles.sidebar}
        role="complementary"
        aria-label={`${position} sidebar chat`}
        aria-hidden={!isOpen}
        data-theme={theme}
        data-position={position}
        data-mode={mode}
        data-state={dataState}
        data-open={isOpen}
        style={{ width: sidebarWidth }}
      >
        {/* Sidebar Header */}
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>
            {chatProps.title || 'Chat'}
          </h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close sidebar"
            title="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Chat Component */}
        <div className={styles.sidebarContent}>
          <A2UIChat {...chatProps} theme={theme} />
        </div>
      </aside>
    </div>
  )
}

A2UISidebar.displayName = 'A2UISidebar'
