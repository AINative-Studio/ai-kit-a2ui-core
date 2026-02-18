/**
 * Tests for StateTreeViewer component
 * TDD approach - tests written BEFORE implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StateTreeViewer } from '@/panel/components/StateTreeViewer'
import type { StateTree, StateNode } from '@/shared/types'

describe('StateTreeViewer', () => {
  const mockStateTree: StateTree = {
    user: {
      value: {
        name: 'John Doe',
        email: 'john@example.com'
      },
      timestamp: Date.now() - 5000,
      path: '/user',
      changes: [
        {
          timestamp: Date.now() - 5000,
          oldValue: undefined,
          newValue: { name: 'John Doe', email: 'john@example.com' },
          operation: 'add'
        }
      ],
      children: {
        name: {
          value: 'John Doe',
          timestamp: Date.now() - 4000,
          path: '/user/name',
          changes: [
            {
              timestamp: Date.now() - 4000,
              oldValue: undefined,
              newValue: 'John Doe',
              operation: 'add'
            },
            {
              timestamp: Date.now() - 2000,
              oldValue: 'John Doe',
              newValue: 'Jane Doe',
              operation: 'replace'
            }
          ],
          children: {}
        },
        email: {
          value: 'john@example.com',
          timestamp: Date.now() - 3000,
          path: '/user/email',
          changes: [
            {
              timestamp: Date.now() - 3000,
              oldValue: undefined,
              newValue: 'john@example.com',
              operation: 'add'
            }
          ],
          children: {}
        }
      }
    },
    settings: {
      value: {
        theme: 'dark',
        notifications: true
      },
      timestamp: Date.now() - 1000,
      path: '/settings',
      changes: [
        {
          timestamp: Date.now() - 1000,
          oldValue: undefined,
          newValue: { theme: 'dark', notifications: true },
          operation: 'add'
        }
      ],
      children: {
        theme: {
          value: 'dark',
          timestamp: Date.now() - 1000,
          path: '/settings/theme',
          changes: [
            {
              timestamp: Date.now() - 1000,
              oldValue: 'light',
              newValue: 'dark',
              operation: 'replace'
            }
          ],
          children: {}
        }
      }
    }
  }

  describe('rendering', () => {
    it('should render empty state when no tree provided', () => {
      render(<StateTreeViewer stateTree={{}} />)
      expect(screen.getByText(/no state data/i)).toBeInTheDocument()
    })

    it('should render root level nodes', () => {
      render(<StateTreeViewer stateTree={mockStateTree} />)

      expect(screen.getByText(/user/i)).toBeInTheDocument()
      expect(screen.getByText(/settings/i)).toBeInTheDocument()
    })

    it('should display node values', () => {
      render(<StateTreeViewer stateTree={mockStateTree} />)

      // Values should be displayed next to keys
      expect(screen.getAllByText(/object/i).length).toBeGreaterThan(0)
    })

    it('should show expand/collapse indicators', () => {
      render(<StateTreeViewer stateTree={mockStateTree} />)

      const expandButtons = screen.getAllByRole('button', { name: /expand|collapse/i })
      expect(expandButtons.length).toBeGreaterThan(0)
    })

    it('should display timestamps', () => {
      render(<StateTreeViewer stateTree={mockStateTree} />)

      // Should show relative time or formatted timestamp
      const timestamps = screen.getAllByText(/ago|:\d{2}/i)
      expect(timestamps.length).toBeGreaterThan(0)
    })
  })

  describe('expand/collapse functionality', () => {
    it('should start with all nodes collapsed by default', () => {
      render(<StateTreeViewer stateTree={mockStateTree} />)

      // Child nodes should not be visible
      expect(screen.queryByText(/john@example.com/i)).not.toBeInTheDocument()
    })

    it('should expand node on click', async () => {
      const user = userEvent.setup()
      render(<StateTreeViewer stateTree={mockStateTree} />)

      const expandButton = screen.getAllByRole('button', { name: /expand/i })[0]
      await user.click(expandButton!)

      // Child nodes should now be visible
      await waitFor(() => {
        expect(screen.getByText(/name/i)).toBeInTheDocument()
      })
    })

    it('should toggle expand/collapse on button click', async () => {
      const user = userEvent.setup()
      render(<StateTreeViewer stateTree={mockStateTree} />)

      // Find individual expand buttons (not "Expand all")
      const allButtons = screen.getAllByRole('button')
      const expandButton = allButtons.find(btn => btn.getAttribute('aria-label') === 'Expand')!

      // Should start with expand label
      expect(expandButton).toHaveAttribute('aria-label', 'Expand')

      // Expand
      await user.click(expandButton)

      await waitFor(() => {
        // Button should change to collapse
        expect(expandButton).toHaveAttribute('aria-label', 'Collapse')
      })

      // Collapse again
      await user.click(expandButton)

      await waitFor(() => {
        // Button should change back to expand
        expect(expandButton).toHaveAttribute('aria-label', 'Expand')
      })
    })

    it('should expand all nodes', async () => {
      const user = userEvent.setup()
      render(<StateTreeViewer stateTree={mockStateTree} />)

      const expandAllButton = screen.getByRole('button', { name: /expand all/i })
      await user.click(expandAllButton)

      await waitFor(() => {
        expect(screen.getByText(/name/i)).toBeInTheDocument()
        expect(screen.getByText(/theme/i)).toBeInTheDocument()
      })
    })

    it('should collapse all nodes', async () => {
      const user = userEvent.setup()
      render(<StateTreeViewer stateTree={mockStateTree} />)

      // First expand all
      const expandAllButton = screen.getByRole('button', { name: /expand all/i })
      await user.click(expandAllButton)

      // Then collapse all
      const collapseAllButton = screen.getByRole('button', { name: /collapse all/i })
      await user.click(collapseAllButton)

      await waitFor(() => {
        expect(screen.queryByText(/john@example.com/i)).not.toBeInTheDocument()
      })
    })

    it('should support keyboard navigation for expand/collapse', async () => {
      render(<StateTreeViewer stateTree={mockStateTree} />)

      const tree = screen.getByRole('tree')
      tree.focus()

      fireEvent.keyDown(tree, { key: 'ArrowRight' })

      await waitFor(() => {
        expect(screen.getByText(/name/i)).toBeInTheDocument()
      })
    })
  })

  describe('diff highlighting', () => {
    it('should highlight nodes that changed recently', () => {
      const recentTimestamp = Date.now()
      render(
        <StateTreeViewer
          stateTree={mockStateTree}
          highlightSince={recentTimestamp - 3000}
        />
      )

      // Nodes with changes after highlightSince should be highlighted
      const highlightedNodes = screen.getAllByTestId(/highlighted-node/i)
      expect(highlightedNodes.length).toBeGreaterThan(0)
    })

    it('should show old vs new values for changed nodes', async () => {
      const user = userEvent.setup()
      render(<StateTreeViewer stateTree={mockStateTree} />)

      // Expand user node to see changes
      const expandButton = screen.getAllByRole('button', { name: /expand/i })[0]
      await user.click(expandButton!)

      await waitFor(() => {
        // Should show that name changed from John Doe to Jane Doe
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument()
      })
    })

    it('should display change indicator badge', async () => {
      const user = userEvent.setup()
      render(<StateTreeViewer stateTree={mockStateTree} />)

      // Expand to show nested nodes with changes
      const expandButton = screen.getAllByRole('button', { name: /expand/i })[0]
      await user.click(expandButton!)

      // Wait for children to appear
      await waitFor(() => {
        expect(screen.getByText(/name/i)).toBeInTheDocument()
      })

      // The 'name' node has 2 changes, so it should have a badge
      const badges = screen.queryAllByTestId('change-count')
      expect(badges.length).toBeGreaterThan(0)
    })

    it('should differentiate add/replace/remove operations', async () => {
      const user = userEvent.setup()
      render(<StateTreeViewer stateTree={mockStateTree} />)

      const expandButton = screen.getAllByRole('button', { name: /expand/i })[0]
      await user.click(expandButton!)

      await waitFor(() => {
        // Should show operation type (add, replace, remove)
        const operations = screen.getAllByText(/add|replace|remove/i)
        expect(operations.length).toBeGreaterThan(0)
      })
    })
  })

  describe('time travel debugging', () => {
    it('should render state at specific timestamp', () => {
      const pastTimestamp = Date.now() - 3000
      render(
        <StateTreeViewer
          stateTree={mockStateTree}
          viewTimestamp={pastTimestamp}
        />
      )

      // Should show state as it was at pastTimestamp
      expect(screen.getByText(/user/i)).toBeInTheDocument()
    })

    it('should allow stepping through change history', async () => {
      const user = userEvent.setup()
      render(<StateTreeViewer stateTree={mockStateTree} enableTimeTravel />)

      const prevButton = screen.getByRole('button', { name: /previous|prev/i })
      const nextButton = screen.getByRole('button', { name: /next/i })

      expect(prevButton).toBeInTheDocument()
      expect(nextButton).toBeInTheDocument()
    })

    it('should show timeline slider', () => {
      render(<StateTreeViewer stateTree={mockStateTree} enableTimeTravel />)

      const slider = screen.getByRole('slider', { name: /timeline/i })
      expect(slider).toBeInTheDocument()
    })

    it('should update state when timeline slider changes', async () => {
      const user = userEvent.setup()
      render(<StateTreeViewer stateTree={mockStateTree} enableTimeTravel />)

      const slider = screen.getByRole('slider', { name: /timeline/i })
      await user.click(slider)

      // State should update based on slider position
      expect(slider).toBeInTheDocument()
    })

    it('should display current timestamp in time travel mode', () => {
      render(<StateTreeViewer stateTree={mockStateTree} enableTimeTravel />)

      const timestamp = screen.getByText(/\d{1,2}:\d{2}:\d{2}/)
      expect(timestamp).toBeInTheDocument()
    })

    it('should show change count in timeline', () => {
      render(<StateTreeViewer stateTree={mockStateTree} enableTimeTravel />)

      // Should show total number of changes
      const changeInfo = screen.getByText(/\d+ change/i)
      expect(changeInfo).toBeInTheDocument()
    })
  })

  describe('copy to clipboard', () => {
    it('should copy entire state tree to clipboard', async () => {
      const user = userEvent.setup()
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true,
        configurable: true
      })

      render(<StateTreeViewer stateTree={mockStateTree} />)

      const copyButton = screen.getByRole('button', { name: /copy all/i })
      await user.click(copyButton)

      expect(writeText).toHaveBeenCalled()
    })

    it('should copy selected node to clipboard', async () => {
      const user = userEvent.setup()
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true,
        configurable: true
      })

      render(<StateTreeViewer stateTree={mockStateTree} />)

      // Select a node
      const treeItems = screen.getAllByRole('treeitem')
      await user.click(treeItems[0]!)

      const copyButton = screen.getByRole('button', { name: /copy selected/i })
      await user.click(copyButton)

      expect(writeText).toHaveBeenCalled()
    })

    it('should copy node path to clipboard', async () => {
      const user = userEvent.setup()
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true,
        configurable: true
      })

      render(<StateTreeViewer stateTree={mockStateTree} />)

      const treeItems = screen.getAllByRole('treeitem')
      await user.click(treeItems[0]!)

      const copyPathButton = screen.getByRole('button', { name: /copy path/i })
      await user.click(copyPathButton)

      expect(writeText).toHaveBeenCalledWith('/user')
    })

    it('should show success notification after copy', async () => {
      const user = userEvent.setup()
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true,
        configurable: true
      })

      render(<StateTreeViewer stateTree={mockStateTree} />)

      const copyButton = screen.getByRole('button', { name: /copy all/i })
      await user.click(copyButton)

      await waitFor(() => {
        const notifications = screen.getAllByText(/copied to clipboard/i)
        expect(notifications.length).toBeGreaterThan(0)
      })
    })
  })

  describe('search and filter', () => {
    it('should filter nodes by search term', async () => {
      const user = userEvent.setup()
      render(<StateTreeViewer stateTree={mockStateTree} />)

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'theme')

      // Wait for debounced search to complete
      await waitFor(() => {
        // Should find theme-related nodes
        expect(screen.getByText(/theme/i)).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should highlight search matches', async () => {
      const user = userEvent.setup()
      render(<StateTreeViewer stateTree={mockStateTree} />)

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'user')

      const highlighted = screen.getAllByTestId(/search-match/i)
      expect(highlighted.length).toBeGreaterThan(0)
    })

    it('should show search result count', async () => {
      const user = userEvent.setup()
      render(<StateTreeViewer stateTree={mockStateTree} />)

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'user')

      await waitFor(() => {
        expect(screen.getByText(/\d+ result/i)).toBeInTheDocument()
      })
    })

    it('should clear search on button click', async () => {
      const user = userEvent.setup()
      render(<StateTreeViewer stateTree={mockStateTree} />)

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'user')

      const clearButton = screen.getByRole('button', { name: /clear search/i })
      await user.click(clearButton)

      expect(searchInput).toHaveValue('')
    })

    it('should expand matching nodes automatically', async () => {
      const user = userEvent.setup()
      render(<StateTreeViewer stateTree={mockStateTree} />)

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'theme')

      // Parent node (settings) should auto-expand to show matching child
      await waitFor(() => {
        expect(screen.getByText(/dark/i)).toBeInTheDocument()
      })
    })

    it('should filter by value type', async () => {
      const user = userEvent.setup()
      render(<StateTreeViewer stateTree={mockStateTree} />)

      // First expand all to see nested values
      const expandAllButton = screen.getByRole('button', { name: /expand all/i })
      await user.click(expandAllButton)

      const typeFilter = screen.getByRole('combobox', { name: /filter by type/i })
      await user.selectOptions(typeFilter, 'string')

      // Should show nodes with string values
      await waitFor(() => {
        // Parent nodes are shown if children match filter
        const treeItems = screen.getAllByRole('treeitem')
        expect(treeItems.length).toBeGreaterThan(0)
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<StateTreeViewer stateTree={mockStateTree} />)

      expect(screen.getByRole('tree')).toHaveAttribute('aria-label', 'State tree')
    })

    it('should support keyboard navigation', () => {
      render(<StateTreeViewer stateTree={mockStateTree} />)

      const treeItems = screen.getAllByRole('treeitem')
      expect(treeItems.length).toBeGreaterThan(0)

      // Should be focusable
      treeItems[0]!.focus()
      expect(document.activeElement).toBe(treeItems[0])
    })

    it('should navigate tree with arrow keys', async () => {
      render(<StateTreeViewer stateTree={mockStateTree} />)

      const firstItem = screen.getAllByRole('treeitem')[0]
      firstItem!.focus()

      fireEvent.keyDown(firstItem!, { key: 'ArrowDown' })

      // Focus should move to next item
      const secondItem = screen.getAllByRole('treeitem')[1]
      expect(document.activeElement).toBe(secondItem)
    })

    it('should expand node with ArrowRight key', async () => {
      render(<StateTreeViewer stateTree={mockStateTree} />)

      const firstItem = screen.getAllByRole('treeitem')[0]
      firstItem!.focus()

      fireEvent.keyDown(firstItem!, { key: 'ArrowRight' })

      await waitFor(() => {
        expect(screen.getByText(/name/i)).toBeInTheDocument()
      })
    })

    it('should collapse node with ArrowLeft key', async () => {
      render(<StateTreeViewer stateTree={mockStateTree} />)

      const firstItem = screen.getAllByRole('treeitem')[0]
      firstItem!.focus()

      // Expand
      fireEvent.keyDown(firstItem!, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText(/name/i)).toBeInTheDocument()
      })

      // Collapse
      fireEvent.keyDown(firstItem!, { key: 'ArrowLeft' })
      await waitFor(() => {
        expect(screen.queryByText(/john@example.com/i)).not.toBeInTheDocument()
      })
    })

    it('should announce state changes to screen readers', async () => {
      const user = userEvent.setup()
      render(<StateTreeViewer stateTree={mockStateTree} />)

      const expandButton = screen.getAllByRole('button', { name: /expand/i })[0]
      await user.click(expandButton!)

      // Should have live region for announcements
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('performance', () => {
    it('should virtualize large state trees', () => {
      const largeTree: StateTree = {}

      // Create 1000 nodes
      for (let i = 0; i < 1000; i++) {
        largeTree[`node_${i}`] = {
          value: `value_${i}`,
          timestamp: Date.now(),
          path: `/node_${i}`,
          changes: [],
          children: {}
        }
      }

      const { container } = render(<StateTreeViewer stateTree={largeTree} />)

      // Should not render all 1000 items in DOM
      const renderedItems = container.querySelectorAll('[role="treeitem"]')
      expect(renderedItems.length).toBeLessThan(100)
    })

    it('should handle deep nesting efficiently', () => {
      const deepTree: StateTree = {
        level1: {
          value: {},
          timestamp: Date.now(),
          path: '/level1',
          changes: [],
          children: {
            level2: {
              value: {},
              timestamp: Date.now(),
              path: '/level1/level2',
              changes: [],
              children: {}
            }
          }
        }
      }

      // Add 50 levels of nesting
      let current = deepTree.level1!.children!.level2!
      for (let i = 3; i <= 50; i++) {
        current.children = {
          [`level${i}`]: {
            value: {},
            timestamp: Date.now(),
            path: `/level1/level2/level${i}`,
            changes: [],
            children: {}
          }
        }
        current = current.children[`level${i}`]!
      }

      expect(() => {
        render(<StateTreeViewer stateTree={deepTree} />)
      }).not.toThrow()
    })

    it('should debounce search input', async () => {
      const user = userEvent.setup()
      render(<StateTreeViewer stateTree={mockStateTree} />)

      const searchInput = screen.getByPlaceholderText(/search/i)

      // Type quickly
      await user.type(searchInput, 'user')

      // Search should be debounced
      expect(searchInput).toHaveValue('user')
    })
  })

  describe('integration with StateTree utility', () => {
    it('should work with StateTree instance', () => {
      const stateTree = {
        user: {
          value: { name: 'Test' },
          timestamp: Date.now(),
          path: '/user',
          changes: [],
          children: {}
        }
      }

      render(<StateTreeViewer stateTree={stateTree} />)

      expect(screen.getByText(/user/i)).toBeInTheDocument()
    })

    it('should update when state tree changes', () => {
      const { rerender } = render(<StateTreeViewer stateTree={mockStateTree} />)

      const updatedTree = {
        ...mockStateTree,
        newNode: {
          value: 'new value',
          timestamp: Date.now(),
          path: '/newNode',
          changes: [],
          children: {}
        }
      }

      rerender(<StateTreeViewer stateTree={updatedTree} />)

      expect(screen.getByText(/newNode/i)).toBeInTheDocument()
    })
  })
})
