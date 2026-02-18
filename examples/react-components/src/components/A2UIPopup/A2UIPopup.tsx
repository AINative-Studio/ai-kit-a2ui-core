import { ReactNode, useId } from 'react'
import { Portal } from '../shared/Portal'
import { FocusTrap } from '../shared/FocusTrap'
import { useKeyPress } from '../../hooks/useKeyPress'
import './A2UIPopup.module.css'

export interface A2UIPopupProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  className?: string
  children: ReactNode
}

export function A2UIPopup({
  isOpen,
  onClose,
  title,
  position = 'center',
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  children
}: A2UIPopupProps) {
  const titleId = useId()

  // Handle Escape key
  useKeyPress('Escape', () => {
    if (isOpen && closeOnEscape) {
      onClose()
    }
  })

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose()
    }
  }

  return (
    <Portal>
      <div
        className={`a2ui-popup-backdrop ${position}`}
        onClick={handleBackdropClick}
        data-testid="popup-backdrop"
      >
        <div className={`a2ui-popup-container ${position}`}>
          <FocusTrap autoFocus restoreFocus>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              className={`a2ui-popup ${size} ${className}`}
            >
              {title && (
                <div className="a2ui-popup-header">
                  <h2 id={titleId} className="a2ui-popup-title">
                    {title}
                  </h2>
                  {showCloseButton && (
                    <button
                      className="a2ui-popup-close"
                      onClick={onClose}
                      aria-label="Close dialog"
                      type="button"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}
              {!title && showCloseButton && (
                <button
                  className="a2ui-popup-close a2ui-popup-close-absolute"
                  onClick={onClose}
                  aria-label="Close dialog"
                  type="button"
                >
                  ×
                </button>
              )}
              <div className="a2ui-popup-content">{children}</div>
            </div>
          </FocusTrap>
        </div>
      </div>
    </Portal>
  )
}
