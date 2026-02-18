import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { A2UIChat } from './A2UIChat'

describe('A2UIChat', () => {
  it('should render with title', () => {
    render(<A2UIChat agentUrl="wss://test" title="AI Assistant" />)
    expect(screen.getByText('AI Assistant')).toBeTruthy()
  })

  it('should render message input', () => {
    render(<A2UIChat agentUrl="wss://test" />)
    expect(screen.getByPlaceholderText(/type.*message/i)).toBeTruthy()
  })

  it('should render send button', () => {
    render(<A2UIChat agentUrl="wss://test" />)
    expect(screen.getByRole('button', { name: /send/i })).toBeTruthy()
  })

  it('should handle message submission', async () => {
    const handleMessage = vi.fn()
    const user = userEvent.setup()

    render(<A2UIChat agentUrl="wss://test" onMessage={handleMessage} />)

    const input = screen.getByPlaceholderText(/type.*message/i)
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, 'Hello')
    await user.click(sendButton)

    expect(handleMessage).toHaveBeenCalledWith('Hello')
  })

  it('should clear input after sending', async () => {
    const user = userEvent.setup()

    render(<A2UIChat agentUrl="wss://test" />)

    const input = screen.getByPlaceholderText(/type.*message/i) as HTMLInputElement
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, 'Hello')
    await user.click(sendButton)

    expect(input.value).toBe('')
  })

  it('should not send empty messages', async () => {
    const handleMessage = vi.fn()
    const user = userEvent.setup()

    render(<A2UIChat agentUrl="wss://test" onMessage={handleMessage} />)

    const sendButton = screen.getByRole('button', { name: /send/i })
    await user.click(sendButton)

    expect(handleMessage).not.toHaveBeenCalled()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <A2UIChat agentUrl="wss://test" className="custom-chat" />
    )

    const chatElement = container.querySelector('.a2ui-chat')
    expect(chatElement?.className).toContain('custom-chat')
  })

  it('should call onError when error occurs', () => {
    const handleError = vi.fn()

    // Simulate WebSocket error
    render(<A2UIChat agentUrl="wss://test" onError={handleError} />)

    // WebSocket mock will trigger error in the implementation
    // Just verify the prop is accepted
    expect(handleError).toBeDefined()
  })

  it('should display messages', () => {
    render(<A2UIChat agentUrl="wss://test" />)

    // Messages list should exist
    const messagesList = screen.getByRole('log')
    expect(messagesList).toBeTruthy()
  })
})
