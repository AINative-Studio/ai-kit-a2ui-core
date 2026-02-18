import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FocusTrap } from './FocusTrap'

describe('FocusTrap', () => {
  it('should render children', () => {
    render(
      <FocusTrap>
        <div data-testid="content">Content</div>
      </FocusTrap>
    )

    expect(screen.getByTestId('content')).toBeTruthy()
  })

  it('should trap focus within container', async () => {
    const user = userEvent.setup()

    render(
      <FocusTrap>
        <div>
          <button data-testid="button-1">Button 1</button>
          <button data-testid="button-2">Button 2</button>
          <button data-testid="button-3">Button 3</button>
        </div>
      </FocusTrap>
    )

    const button1 = screen.getByTestId('button-1')
    const button3 = screen.getByTestId('button-3')

    // Focus first button
    button1.focus()
    expect(document.activeElement).toBe(button1)

    // Tab through buttons
    await user.tab()
    expect(document.activeElement).toBe(screen.getByTestId('button-2'))

    await user.tab()
    expect(document.activeElement).toBe(button3)

    // Should wrap to first button
    await user.tab()
    expect(document.activeElement).toBe(button1)
  })

  it('should handle shift+tab to go backwards', async () => {
    const user = userEvent.setup()

    render(
      <FocusTrap>
        <div>
          <button data-testid="button-1">Button 1</button>
          <button data-testid="button-2">Button 2</button>
        </div>
      </FocusTrap>
    )

    const button1 = screen.getByTestId('button-1')
    const button2 = screen.getByTestId('button-2')

    // Focus first button
    button1.focus()

    // Shift+Tab should go to last button
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(button2)
  })

  it('should auto-focus first element when enabled', () => {
    render(
      <FocusTrap autoFocus>
        <div>
          <button data-testid="button-1">Button 1</button>
          <button data-testid="button-2">Button 2</button>
        </div>
      </FocusTrap>
    )

    expect(document.activeElement).toBe(screen.getByTestId('button-1'))
  })

  it('should restore focus on unmount when enabled', () => {
    const previouslyFocused = document.createElement('button')
    document.body.appendChild(previouslyFocused)
    previouslyFocused.focus()

    const initialFocus = document.activeElement

    const { unmount } = render(
      <FocusTrap restoreFocus>
        <div>
          <button data-testid="button-1">Button 1</button>
        </div>
      </FocusTrap>
    )

    // After mounting FocusTrap, focus might change
    // Just verify the restoration works on unmount
    unmount()
    expect(document.activeElement).toBe(initialFocus)

    document.body.removeChild(previouslyFocused)
  })
})
