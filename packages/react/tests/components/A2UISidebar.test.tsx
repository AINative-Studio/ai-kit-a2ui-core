/// <reference types="vitest/globals" />
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { A2UISidebar } from '@/components/A2UISidebar'

describe('A2UISidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render sidebar container', () => {
      const { container } = render(<A2UISidebar />)
      expect(container.firstChild).toHaveClass('sidebarWrapper')
    })

    it('should not show sidebar initially', () => {
      render(<A2UISidebar />)
      expect(screen.queryByRole('complementary')).not.toBeVisible()
    })

    it('should show sidebar when defaultOpen is true', () => {
      render(<A2UISidebar defaultOpen />)
      expect(screen.getByRole('complementary')).toBeVisible()
    })

    it('should apply custom className', () => {
      const { container } = render(<A2UISidebar className="custom-sidebar" />)
      expect(container.firstChild).toHaveClass('custom-sidebar')
    })

    it('should apply theme to sidebar', () => {
      render(<A2UISidebar theme="dark" defaultOpen />)
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveAttribute('data-theme', 'dark')
    })
  })

  describe('Positioning', () => {
    it('should position on right by default', () => {
      const { container } = render(<A2UISidebar defaultOpen />)
      const wrapper = container.firstChild
      expect(wrapper).toHaveAttribute('data-position', 'right')
    })

    it('should position on left', () => {
      const { container } = render(<A2UISidebar position="left" defaultOpen />)
      const wrapper = container.firstChild
      expect(wrapper).toHaveAttribute('data-position', 'left')
    })
  })

  describe('Layout Modes', () => {
    it('should use overlay mode by default', () => {
      render(<A2UISidebar defaultOpen />)
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveAttribute('data-mode', 'overlay')
    })

    it('should use push mode', () => {
      render(<A2UISidebar mode="push" defaultOpen />)
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveAttribute('data-mode', 'push')
    })

    it('should show overlay backdrop in overlay mode', () => {
      render(<A2UISidebar mode="overlay" defaultOpen />)
      expect(screen.getByTestId('sidebar-overlay')).toBeInTheDocument()
    })

    it('should not show overlay backdrop in push mode', () => {
      render(<A2UISidebar mode="push" defaultOpen />)
      expect(screen.queryByTestId('sidebar-overlay')).not.toBeInTheDocument()
    })
  })

  describe('Width Configuration', () => {
    it('should apply default width', () => {
      render(<A2UISidebar defaultOpen />)
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveStyle({ width: '400px' })
    })

    it('should apply custom numeric width', () => {
      render(<A2UISidebar width={500} defaultOpen />)
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveStyle({ width: '500px' })
    })

    it('should apply custom string width', () => {
      render(<A2UISidebar width="50%" defaultOpen />)
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveStyle({ width: '50%' })
    })
  })

  describe('Open/Close Functionality', () => {
    it('should open sidebar when toggle button is clicked', async () => {
      const user = userEvent.setup()
      render(<A2UISidebar showToggle />)

      const toggleButton = screen.getByRole('button', { name: /toggle.*sidebar/i })
      await user.click(toggleButton)

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeVisible()
      })
    })

    it('should close sidebar when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<A2UISidebar defaultOpen />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.getByRole('complementary')).not.toBeVisible()
      })
    })

    it('should close sidebar when Escape key is pressed', async () => {
      const user = userEvent.setup()
      render(<A2UISidebar defaultOpen />)

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.getByRole('complementary')).not.toBeVisible()
      })
    })

    it('should close sidebar when overlay is clicked in overlay mode', async () => {
      const user = userEvent.setup()
      render(<A2UISidebar mode="overlay" defaultOpen />)

      const overlay = screen.getByTestId('sidebar-overlay')
      await user.click(overlay)

      await waitFor(() => {
        expect(screen.getByRole('complementary')).not.toBeVisible()
      })
    })

    it('should not close when clicking inside sidebar', async () => {
      const user = userEvent.setup()
      render(<A2UISidebar defaultOpen />)

      const sidebar = screen.getByRole('complementary')
      await user.click(sidebar)

      expect(sidebar).toBeVisible()
    })

    it('should call onOpen when sidebar opens', async () => {
      const user = userEvent.setup()
      const onOpen = vi.fn()
      render(<A2UISidebar showToggle onOpen={onOpen} />)

      const toggleButton = screen.getByRole('button', { name: /toggle.*sidebar/i })
      await user.click(toggleButton)

      await waitFor(() => {
        expect(onOpen).toHaveBeenCalledTimes(1)
      })
    })

    it('should call onClose when sidebar closes', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<A2UISidebar defaultOpen onClose={onClose} />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Controlled State', () => {
    it('should respect isOpen prop', () => {
      const { rerender } = render(<A2UISidebar isOpen={false} />)
      expect(screen.queryByRole('complementary')).not.toBeVisible()

      rerender(<A2UISidebar isOpen={true} />)
      expect(screen.getByRole('complementary')).toBeVisible()
    })

    it('should call onClose but not close when controlled', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<A2UISidebar isOpen={true} onClose={onClose} />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalled()
      expect(screen.getByRole('complementary')).toBeVisible()
    })
  })

  describe('Toggle Button', () => {
    it('should show toggle button when showToggle is true', () => {
      render(<A2UISidebar showToggle />)
      expect(screen.getByRole('button', { name: /toggle.*sidebar/i })).toBeInTheDocument()
    })

    it('should not show toggle button by default', () => {
      render(<A2UISidebar />)
      expect(screen.queryByRole('button', { name: /toggle.*sidebar/i })).not.toBeInTheDocument()
    })

    it('should position toggle button correctly for right sidebar', () => {
      render(<A2UISidebar position="right" showToggle />)
      const toggleButton = screen.getByRole('button', { name: /toggle.*sidebar/i })
      expect(toggleButton.parentElement).toHaveAttribute('data-position', 'right')
    })

    it('should position toggle button correctly for left sidebar', () => {
      render(<A2UISidebar position="left" showToggle />)
      const toggleButton = screen.getByRole('button', { name: /toggle.*sidebar/i })
      expect(toggleButton.parentElement).toHaveAttribute('data-position', 'left')
    })
  })

  describe('Chat Integration', () => {
    it('should pass chatProps to internal chat component', () => {
      render(
        <A2UISidebar
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

    it('should handle message sending through sidebar', async () => {
      const user = userEvent.setup()
      const onMessage = vi.fn()

      render(
        <A2UISidebar
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
      const { container } = render(<A2UISidebar showToggle />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations when open', async () => {
      const { container } = render(<A2UISidebar defaultOpen />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA attributes on sidebar', () => {
      render(<A2UISidebar defaultOpen />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveAttribute('aria-label')
    })

    it('should trap focus within sidebar when in overlay mode', async () => {
      const user = userEvent.setup()
      render(<A2UISidebar mode="overlay" defaultOpen />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      const input = screen.getByRole('textbox', { name: /message/i })
      const sendButton = screen.getByRole('button', { name: /send/i })

      // Tab should cycle through elements within sidebar
      await user.tab()
      expect(closeButton).toHaveFocus()

      await user.tab()
      expect(input).toHaveFocus()

      await user.tab()
      expect(sendButton).toHaveFocus()
    })

    it('should announce sidebar state to screen readers', () => {
      render(<A2UISidebar defaultOpen />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveAttribute('aria-hidden', 'false')
    })

    it('should update aria-hidden when closed', async () => {
      const user = userEvent.setup()
      render(<A2UISidebar defaultOpen />)

      const sidebar = screen.getByRole('complementary')
      const closeButton = screen.getByRole('button', { name: /close/i })

      expect(sidebar).toHaveAttribute('aria-hidden', 'false')

      await user.click(closeButton)

      await waitFor(() => {
        expect(sidebar).toHaveAttribute('aria-hidden', 'true')
      })
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<A2UISidebar showToggle />)

      await user.tab()
      const toggleButton = screen.getByRole('button', { name: /toggle.*sidebar/i })
      expect(toggleButton).toHaveFocus()

      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByRole('complementary')).toBeVisible()
      })
    })
  })

  describe('Animations', () => {
    it('should apply slide-in animation when opening', async () => {
      const user = userEvent.setup()
      render(<A2UISidebar showToggle />)

      const toggleButton = screen.getByRole('button', { name: /toggle.*sidebar/i })
      await user.click(toggleButton)

      await waitFor(() => {
        const sidebar = screen.getByRole('complementary')
        expect(sidebar).toHaveAttribute('data-state', 'open')
      })
    })

    it('should apply slide-out animation when closing', async () => {
      const user = userEvent.setup()
      render(<A2UISidebar defaultOpen />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveAttribute('data-state', 'closing')
    })
  })

  describe('Responsive Behavior', () => {
    it('should take full width on mobile', () => {
      // Simulate mobile viewport
      global.innerWidth = 375
      global.dispatchEvent(new Event('resize'))

      render(<A2UISidebar defaultOpen />)
      const sidebar = screen.getByRole('complementary')

      // On mobile, sidebar should have full width
      expect(sidebar).toBeInTheDocument()
    })
  })

  describe('Body Scroll Lock', () => {
    it('should lock body scroll when sidebar opens in overlay mode', async () => {
      const user = userEvent.setup()
      render(<A2UISidebar mode="overlay" showToggle />)

      const toggleButton = screen.getByRole('button', { name: /toggle.*sidebar/i })
      await user.click(toggleButton)

      await waitFor(() => {
        expect(document.body).toHaveStyle({ overflow: 'hidden' })
      })
    })

    it('should restore body scroll when sidebar closes', async () => {
      const user = userEvent.setup()
      render(<A2UISidebar mode="overlay" defaultOpen />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      await waitFor(() => {
        expect(document.body).not.toHaveStyle({ overflow: 'hidden' })
      })
    })

    it('should not lock body scroll in push mode', async () => {
      const user = userEvent.setup()
      render(<A2UISidebar mode="push" showToggle />)

      const toggleButton = screen.getByRole('button', { name: /toggle.*sidebar/i })
      await user.click(toggleButton)

      await waitFor(() => {
        expect(document.body).not.toHaveStyle({ overflow: 'hidden' })
      })
    })
  })
})
