import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { A2UIPopupProps } from '../types'
import { A2UIChat } from './A2UIChat'
import styles from './A2UIPopup.module.css'

export const A2UIPopup: React.FC<A2UIPopupProps> = ({
  position = 'bottom-right',
  theme = 'light',
  className = '',
  chatProps = {},
  renderTrigger,
  onOpen,
  onClose,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isMinimized, setIsMinimized] = useState(false)
  const [dataState, setDataState] = useState<'closed' | 'open' | 'closing'>('closed')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout>()

  // Handle initial open state
  useEffect(() => {
    if (defaultOpen) {
      setDataState('open')
    }
  }, [defaultOpen])

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    setIsMinimized(false)
    setDataState('open')
    onOpen?.()
  }, [onOpen])

  const handleClose = useCallback(() => {
    setDataState('closing')

    // Wait for animation before actually closing
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false)
      setIsMinimized(false)
      setDataState('closed')
      onClose?.()

      // Restore focus to trigger button
      triggerRef.current?.focus()
    }, 200) // Match animation duration
  }, [onClose])

  const handleToggle = useCallback(() => {
    if (isOpen) {
      handleClose()
    } else {
      handleOpen()
    }
  }, [isOpen, handleOpen, handleClose])

  const handleMinimize = useCallback(() => {
    setIsMinimized(true)
  }, [])

  const handleRestore = useCallback(() => {
    setIsMinimized(false)
  }, [])

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

  // Handle click outside
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose()
      }
    },
    [handleClose]
  )

  // Focus management - trap focus within dialog
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return

    const dialog = dialogRef.current
    const focusableElements = dialog.querySelectorAll<HTMLElement>(
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

    dialog.addEventListener('keydown', handleTab)
    firstElement?.focus()

    return () => {
      dialog.removeEventListener('keydown', handleTab)
    }
  }, [isOpen])

  // Default trigger button
  const defaultTrigger = (
    <button
      ref={triggerRef}
      className={styles.triggerButton}
      onClick={handleToggle}
      aria-label="Open chat"
      aria-expanded={isOpen}
      data-theme={theme}
    >
      <svg
        className={styles.triggerIcon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </button>
  )

  return (
    <div className={`${styles.popupWrapper} ${className}`} data-position={position}>
      {/* Trigger Button */}
      {renderTrigger ? renderTrigger({ onClick: handleToggle, isOpen }) : defaultTrigger}

      {/* Popup Portal */}
      {isOpen &&
        createPortal(
          <div
            className={styles.overlay}
            onClick={handleOverlayClick}
            data-testid="popup-overlay"
          >
            <div
              ref={dialogRef}
              className={styles.popup}
              role="dialog"
              aria-modal="true"
              aria-label="Chat popup"
              data-theme={theme}
              data-position={position}
              data-minimized={isMinimized}
              data-state={dataState}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Popup Header */}
              <div
                className={styles.popupHeader}
                onClick={isMinimized ? handleRestore : undefined}
                style={{ cursor: isMinimized ? 'pointer' : 'default' }}
              >
                <h3 className={styles.popupTitle}>
                  {chatProps.title || 'Chat'}
                </h3>
                <div className={styles.popupActions}>
                  <button
                    className={styles.minimizeButton}
                    onClick={handleMinimize}
                    aria-label="Minimize chat"
                    title="Minimize"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                  <button
                    className={styles.closeButton}
                    onClick={handleClose}
                    aria-label="Close chat"
                    title="Close"
                  >
                    <svg
                      width="16"
                      height="16"
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
              </div>

              {/* Chat Component */}
              {!isMinimized && (
                <div className={styles.popupContent}>
                  <A2UIChat {...chatProps} theme={theme} />
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

A2UIPopup.displayName = 'A2UIPopup'
