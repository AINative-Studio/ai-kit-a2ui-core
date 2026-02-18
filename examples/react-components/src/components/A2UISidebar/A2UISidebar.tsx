import { ReactNode } from 'react'
import { Portal } from '../shared/Portal'
import { useKeyPress } from '../../hooks/useKeyPress'
import './A2UISidebar.module.css'

export interface A2UISidebarProps {
  isOpen: boolean
  onClose: () => void
  position?: 'left' | 'right'
  mode?: 'overlay' | 'push'
  width?: string | number
  className?: string
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode
}

export function A2UISidebar({
  isOpen,
  onClose,
  position = 'left',
  mode = 'overlay',
  width = 280,
  className = '',
  children,
  header,
  footer
}: A2UISidebarProps) {
  // Handle Escape key
  useKeyPress('Escape', () => {
    if (isOpen) {
      onClose()
    }
  })

  if (!isOpen) return null

  const sidebarWidth = typeof width === 'number' ? `${width}px` : width

  const handleBackdropClick = () => {
    if (mode === 'overlay') {
      onClose()
    }
  }

  return (
    <Portal>
      {mode === 'overlay' && (
        <div
          className="a2ui-sidebar-backdrop"
          onClick={handleBackdropClick}
          data-testid="sidebar-backdrop"
        />
      )}
      <aside
        className={`a2ui-sidebar ${position} ${mode} ${className}`}
        style={{ width: sidebarWidth }}
      >
        {header && <div className="a2ui-sidebar-header">{header}</div>}
        <div className="a2ui-sidebar-content">{children}</div>
        {footer && <div className="a2ui-sidebar-footer">{footer}</div>}
      </aside>
    </Portal>
  )
}
