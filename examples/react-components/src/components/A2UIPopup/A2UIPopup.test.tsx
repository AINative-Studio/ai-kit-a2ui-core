import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { A2UIPopup } from './A2UIPopup'

describe('A2UIPopup', () => {
  it('should not render when closed', () => {
    render(
      <A2UIPopup isOpen={false} onClose={() => {}}>
        <div data-testid="content">Content</div>
      </A2UIPopup>
    )

    expect(screen.queryByTestId('content')).toBeNull()
  })

  it('should render when open', () => {
    render(
      <A2UIPopup isOpen={true} onClose={() => {}}>
        <div data-testid="content">Content</div>
      </A2UIPopup>
    )

    expect(screen.getByTestId('content')).toBeTruthy()
  })

  it('should render title when provided', () => {
    render(
      <A2UIPopup isOpen={true} onClose={() => {}} title="Test Title">
        <div>Content</div>
      </A2UIPopup>
    )

    expect(screen.getByText('Test Title')).toBeTruthy()
  })

  it('should call onClose when close button is clicked', async () => {
    const handleClose = vi.fn()
    const user = userEvent.setup()

    render(
      <A2UIPopup isOpen={true} onClose={handleClose} showCloseButton={true}>
        <div>Content</div>
      </A2UIPopup>
    )

    const closeButton = screen.getByLabelText(/close/i)
    await user.click(closeButton)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when backdrop is clicked and closeOnBackdrop is true', async () => {
    const handleClose = vi.fn()
    const user = userEvent.setup()

    render(
      <A2UIPopup isOpen={true} onClose={handleClose} closeOnBackdrop={true}>
        <div data-testid="content">Content</div>
      </A2UIPopup>
    )

    const backdrop = screen.getByTestId('popup-backdrop')
    await user.click(backdrop)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when Escape is pressed and closeOnEscape is true', async () => {
    const handleClose = vi.fn()

    render(
      <A2UIPopup isOpen={true} onClose={handleClose} closeOnEscape={true}>
        <div>Content</div>
      </A2UIPopup>
    )

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
    document.dispatchEvent(escapeEvent)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('should not close on backdrop click when closeOnBackdrop is false', async () => {
    const handleClose = vi.fn()
    const user = userEvent.setup()

    render(
      <A2UIPopup isOpen={true} onClose={handleClose} closeOnBackdrop={false}>
        <div data-testid="content">Content</div>
      </A2UIPopup>
    )

    const backdrop = screen.getByTestId('popup-backdrop')
    await user.click(backdrop)

    expect(handleClose).not.toHaveBeenCalled()
  })

  it('should apply custom className', () => {
    render(
      <A2UIPopup isOpen={true} onClose={() => {}} className="custom-class">
        <div data-testid="content">Content</div>
      </A2UIPopup>
    )

    const content = screen.getByTestId('content')
    const dialog = content.closest('[role="dialog"]')
    expect(dialog?.className).toContain('custom-class')
  })

  it('should apply size class', () => {
    render(
      <A2UIPopup isOpen={true} onClose={() => {}} size="lg">
        <div data-testid="content">Content</div>
      </A2UIPopup>
    )

    const content = screen.getByTestId('content')
    const dialog = content.closest('[role="dialog"]')
    expect(dialog?.className).toContain('lg')
  })

  it('should apply position class', () => {
    render(
      <A2UIPopup isOpen={true} onClose={() => {}} position="top">
        <div data-testid="content">Content</div>
      </A2UIPopup>
    )

    const content = screen.getByTestId('content')
    const container = content.closest('.a2ui-popup-container')
    expect(container?.className).toContain('top')
  })

  it('should have proper ARIA attributes', () => {
    render(
      <A2UIPopup isOpen={true} onClose={() => {}} title="Test Dialog">
        <div data-testid="content">Content</div>
      </A2UIPopup>
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeTruthy()
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy()
  })

  it('should trap focus within popup', async () => {
    const user = userEvent.setup()

    render(
      <A2UIPopup isOpen={true} onClose={() => {}} showCloseButton={true}>
        <div>
          <button data-testid="btn-1">Button 1</button>
          <button data-testid="btn-2">Button 2</button>
        </div>
      </A2UIPopup>
    )

    const btn1 = screen.getByTestId('btn-1')
    const btn2 = screen.getByTestId('btn-2')
    const closeBtn = screen.getByLabelText(/close/i)

    btn1.focus()
    await user.tab()
    expect(document.activeElement).toBe(btn2)

    await user.tab()
    expect(document.activeElement).toBe(closeBtn)

    // Should wrap back to first button
    await user.tab()
    expect(document.activeElement).toBe(btn1)
  })
})
