import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Portal } from './Portal'

describe('Portal', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'portal-container'
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('should render children in document.body by default', () => {
    render(
      <Portal>
        <div data-testid="portal-content">Portal Content</div>
      </Portal>
    )

    const content = screen.getByTestId('portal-content')
    expect(content).toBeTruthy()
    expect(content.parentElement).toBe(document.body)
  })

  it('should render children in custom container', () => {
    render(
      <Portal container={container}>
        <div data-testid="portal-content">Portal Content</div>
      </Portal>
    )

    const content = screen.getByTestId('portal-content')
    expect(content).toBeTruthy()
    expect(container.contains(content)).toBe(true)
  })

  it('should cleanup on unmount', () => {
    const { unmount } = render(
      <Portal>
        <div data-testid="portal-content">Portal Content</div>
      </Portal>
    )

    expect(screen.getByTestId('portal-content')).toBeTruthy()
    unmount()
    expect(screen.queryByTestId('portal-content')).toBeNull()
  })
})
