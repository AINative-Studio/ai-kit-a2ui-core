/// <reference types="vitest/globals" />
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { A2UIPopup } from '@/components/A2UIPopup'

describe('A2UIPopup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render trigger button', () => {
      render(<A2UIPopup />)
      expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument()
    })

    it('should not show popup initially', () => {
      render(<A2UIPopup />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should show popup when defaultOpen is true', () => {
      render(<A2UIPopup defaultOpen />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(<A2UIPopup className="custom-popup" />)
      expect(container.firstChild).toHaveClass('custom-popup')
    })

    it('should apply theme to popup', () => {
      render(<A2UIPopup theme="dark" defaultOpen />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('data-theme', 'dark')
    })
  })

  describe('Positioning', () => {
    it('should position at bottom-right by default', () => {
      const { container } = render(<A2UIPopup />)
      const wrapper = container.firstChild
      expect(wrapper).toHaveAttribute('data-position', 'bottom-right')
    })

    it('should position at bottom-left', () => {
      const { container } = render(<A2UIPopup position="bottom-left" />)
      const wrapper = container.firstChild
      expect(wrapper).toHaveAttribute('data-position', 'bottom-left')
    })

    it('should position at top-right', () => {
      const { container } = render(<A2UIPopup position="top-right" />)
      const wrapper = container.firstChild
      expect(wrapper).toHaveAttribute('data-position', 'top-right')
    })

    it('should position at top-left', () => {
      const { container } = render(<A2UIPopup position="top-left" />)
      const wrapper = container.firstChild
      expect(wrapper).toHaveAttribute('data-position', 'top-left')
    })
  })

  describe('Open/Close Functionality', () => {
    it('should open popup when trigger button is clicked', async () => {
      const user = userEvent.setup()
      render(<A2UIPopup />)

      const triggerButton = screen.getByRole('button', { name: /chat/i })
      await user.click(triggerButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should close popup when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<A2UIPopup defaultOpen />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should close popup when Escape key is pressed', async () => {
      const user = userEvent.setup()
      render(<A2UIPopup defaultOpen />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should close popup when clicking overlay', async () => {
      const user = userEvent.setup()
      render(<A2UIPopup defaultOpen />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()

      const overlay = screen.getByTestId('popup-overlay')
      await user.click(overlay)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should not close when clicking inside popup', async () => {
      const user = userEvent.setup()
      render(<A2UIPopup defaultOpen />)

      const dialog = screen.getByRole('dialog')
      await user.click(dialog)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should call onOpen when popup opens', async () => {
      const user = userEvent.setup()
      const onOpen = vi.fn()
      render(<A2UIPopup onOpen={onOpen} />)

      const triggerButton = screen.getByRole('button', { name: /chat/i })
      await user.click(triggerButton)

      expect(onOpen).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when popup closes', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<A2UIPopup defaultOpen onClose={onClose} />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Custom Trigger', () => {
    it('should render custom trigger button', () => {
      const customTrigger = ({ onClick }: { onClick: () => void }) => (
        <button onClick={onClick}>Custom Trigger</button>
      )

      render(<A2UIPopup renderTrigger={customTrigger} />)
      expect(screen.getByText('Custom Trigger')).toBeInTheDocument()
    })

    it('should pass isOpen state to custom trigger', async () => {
      const user = userEvent.setup()
      const customTrigger = ({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) => (
        <button onClick={onClick}>{isOpen ? 'Open' : 'Closed'}</button>
      )

      render(<A2UIPopup renderTrigger={customTrigger} />)

      expect(screen.getByText('Closed')).toBeInTheDocument()

      const trigger = screen.getByRole('button')
      await user.click(trigger)

      expect(screen.getByText('Open')).toBeInTheDocument()
    })
  })

  describe('Chat Integration', () => {
    it('should pass chatProps to internal chat component', () => {
      render(
        <A2UIPopup
          defaultOpen
          chatProps={{
            title: 'Support Chat',
            placeholder: 'How can we help?',
          }}
        />
      )

      expect(screen.getByText('Support Chat')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('How can we help?')).toBeInTheDocument()
    })

    it('should handle message sending through popup', async () => {
      const user = userEvent.setup()
      const onMessage = vi.fn()

      render(
        <A2UIPopup
          defaultOpen
          chatProps={{
            onMessage,
          }}
        />
      )

      const input = screen.getByRole('textbox', { name: /message/i })
      await user.type(input, 'Test message{Enter}')

      expect(onMessage).toHaveBeenCalledWith('Test message')
    })
  })

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<A2UIPopup />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations when open', async () => {
      const { container } = render(<A2UIPopup defaultOpen />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA attributes on dialog', () => {
      render(<A2UIPopup defaultOpen />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('should trap focus within popup when open', async () => {
      const user = userEvent.setup()
      render(<A2UIPopup defaultOpen />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      const input = screen.getByRole('textbox', { name: /message/i })
      const sendButton = screen.getByRole('button', { name: /send/i })

      // Tab should cycle through elements within dialog
      await user.tab()
      expect(closeButton).toHaveFocus()

      await user.tab()
      expect(input).toHaveFocus()

      await user.tab()
      expect(sendButton).toHaveFocus()
    })

    it('should restore focus to trigger when closed', async () => {
      const user = userEvent.setup()
      render(<A2UIPopup />)

      const triggerButton = screen.getByRole('button', { name: /chat/i })
      await user.click(triggerButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(triggerButton).toHaveFocus()
      })
    })

    it('should announce popup state changes to screen readers', async () => {
      const user = userEvent.setup()
      render(<A2UIPopup />)

      const triggerButton = screen.getByRole('button', { name: /chat/i })
      expect(triggerButton).toHaveAttribute('aria-expanded', 'false')

      await user.click(triggerButton)

      expect(triggerButton).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('Minimize Functionality', () => {
    it('should show minimize button when popup is open', () => {
      render(<A2UIPopup defaultOpen />)

      expect(screen.getByRole('button', { name: /minimize/i })).toBeInTheDocument()
    })

    it('should minimize popup when minimize button is clicked', async () => {
      const user = userEvent.setup()
      render(<A2UIPopup defaultOpen />)

      const dialog = screen.getByRole('dialog')
      const minimizeButton = screen.getByRole('button', { name: /minimize/i })

      await user.click(minimizeButton)

      await waitFor(() => {
        expect(dialog).toHaveAttribute('data-minimized', 'true')
      })
    })

    it('should restore from minimized state', async () => {
      const user = userEvent.setup()
      render(<A2UIPopup defaultOpen />)

      const minimizeButton = screen.getByRole('button', { name: /minimize/i })
      await user.click(minimizeButton)

      const dialog = screen.getByRole('dialog')
      await waitFor(() => {
        expect(dialog).toHaveAttribute('data-minimized', 'true')
      })

      // Click header to restore
      const header = screen.getByText(/chat/i)
      await user.click(header)

      await waitFor(() => {
        expect(dialog).toHaveAttribute('data-minimized', 'false')
      })
    })
  })

  describe('Portal Behavior', () => {
    it('should render popup in document.body', () => {
      render(<A2UIPopup defaultOpen />)

      const dialog = screen.getByRole('dialog')
      expect(dialog.parentElement?.tagName).toBe('BODY')
    })
  })

  describe('Animations', () => {
    it('should apply enter animation when opening', async () => {
      const user = userEvent.setup()
      render(<A2UIPopup />)

      const triggerButton = screen.getByRole('button', { name: /chat/i })
      await user.click(triggerButton)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('data-state', 'open')
    })

    it('should apply exit animation when closing', async () => {
      const user = userEvent.setup()
      render(<A2UIPopup defaultOpen />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      const dialog = screen.queryByRole('dialog')
      if (dialog) {
        expect(dialog).toHaveAttribute('data-state', 'closing')
      }
    })
  })
})
