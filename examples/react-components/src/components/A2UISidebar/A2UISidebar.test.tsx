import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { A2UISidebar } from './A2UISidebar'

describe('A2UISidebar', () => {
  it('should not render when closed', () => {
    render(
      <A2UISidebar isOpen={false} onClose={() => {}}>
        <div data-testid="content">Content</div>
      </A2UISidebar>
    )

    expect(screen.queryByTestId('content')).toBeNull()
  })

  it('should render when open', () => {
    render(
      <A2UISidebar isOpen={true} onClose={() => {}}>
        <div data-testid="content">Content</div>
      </A2UISidebar>
    )

    expect(screen.getByTestId('content')).toBeTruthy()
  })

  it('should call onClose when Escape is pressed', () => {
    const handleClose = vi.fn()

    render(
      <A2UISidebar isOpen={true} onClose={handleClose}>
        <div>Content</div>
      </A2UISidebar>
    )

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
    document.dispatchEvent(escapeEvent)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when backdrop is clicked in overlay mode', async () => {
    const handleClose = vi.fn()
    const user = userEvent.setup()

    render(
      <A2UISidebar isOpen={true} onClose={handleClose} mode="overlay">
        <div data-testid="content">Content</div>
      </A2UISidebar>
    )

    const backdrop = screen.getByTestId('sidebar-backdrop')
    await user.click(backdrop)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('should apply position class', () => {
    render(
      <A2UISidebar isOpen={true} onClose={() => {}} position="right">
        <div data-testid="content">Content</div>
      </A2UISidebar>
    )

    const content = screen.getByTestId('content')
    const sidebar = content.closest('.a2ui-sidebar')
    expect(sidebar?.className).toContain('right')
  })

  it('should apply mode class', () => {
    render(
      <A2UISidebar isOpen={true} onClose={() => {}} mode="push">
        <div data-testid="content">Content</div>
      </A2UISidebar>
    )

    const content = screen.getByTestId('content')
    const sidebar = content.closest('.a2ui-sidebar')
    expect(sidebar?.className).toContain('push')
  })

  it('should render header when provided', () => {
    render(
      <A2UISidebar
        isOpen={true}
        onClose={() => {}}
        header={<div data-testid="header">Header</div>}
      >
        <div>Content</div>
      </A2UISidebar>
    )

    expect(screen.getByTestId('header')).toBeTruthy()
  })

  it('should render footer when provided', () => {
    render(
      <A2UISidebar
        isOpen={true}
        onClose={() => {}}
        footer={<div data-testid="footer">Footer</div>}
      >
        <div>Content</div>
      </A2UISidebar>
    )

    expect(screen.getByTestId('footer')).toBeTruthy()
  })

  it('should apply custom width', () => {
    render(
      <A2UISidebar isOpen={true} onClose={() => {}} width={350}>
        <div data-testid="content">Content</div>
      </A2UISidebar>
    )

    const content = screen.getByTestId('content')
    const sidebar = content.closest('.a2ui-sidebar') as HTMLElement
    expect(sidebar?.style.width).toBe('350px')
  })
})
