/**
 * Tests for ActionTracer component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ActionTracer } from '@/panel/components/ActionTracer'
import type { ActionTrace } from '@/shared/types'

describe('ActionTracer', () => {
  const mockActions: ActionTrace[] = [
    {
      type: 'ACTION_TRACE',
      timestamp: Date.now() - 5000,
      actionId: 'action_1',
      actionType: 'SUBMIT_FORM',
      status: 'completed',
      duration: 1250,
      params: {
        formId: 'user-registration',
        fields: ['email', 'password']
      },
      result: {
        success: true,
        userId: 'user_123'
      }
    },
    {
      type: 'ACTION_TRACE',
      timestamp: Date.now() - 3000,
      actionId: 'action_2',
      actionType: 'FETCH_DATA',
      status: 'failed',
      duration: 2500,
      params: {
        endpoint: '/api/users',
        method: 'GET'
      },
      error: new Error('Network timeout')
    },
    {
      type: 'ACTION_TRACE',
      timestamp: Date.now() - 1000,
      actionId: 'action_3',
      actionType: 'UPDATE_STATE',
      status: 'started',
      params: {
        path: 'user.profile',
        value: { name: 'John Doe' }
      }
    }
  ]

  describe('rendering', () => {
    it('should render action timeline', () => {
      render(<ActionTracer actions={mockActions} />)

      expect(screen.getByText(/SUBMIT_FORM/i)).toBeInTheDocument()
      expect(screen.getByText(/FETCH_DATA/i)).toBeInTheDocument()
      expect(screen.getByText(/UPDATE_STATE/i)).toBeInTheDocument()
    })

    it('should display action count', () => {
      render(<ActionTracer actions={mockActions} />)

      expect(screen.getByText(/3 actions/i)).toBeInTheDocument()
    })

    it('should show empty state when no actions', () => {
      render(<ActionTracer actions={[]} />)

      expect(screen.getByText(/no actions traced/i)).toBeInTheDocument()
      expect(screen.getByText(/actions will appear here/i)).toBeInTheDocument()
    })

    it('should display status indicators', () => {
      const { container } = render(<ActionTracer actions={mockActions} />)

      const statusBadges = container.querySelectorAll('[class*="status"]')
      const statusTexts = Array.from(statusBadges).map(el => el.textContent)

      expect(statusTexts).toContain('completed')
      expect(statusTexts).toContain('failed')
      expect(statusTexts).toContain('started')
    })

    it('should display duration for completed and failed actions', () => {
      render(<ActionTracer actions={mockActions} />)

      expect(screen.getByText(/1250ms/i)).toBeInTheDocument()
      expect(screen.getByText(/2500ms/i)).toBeInTheDocument()
    })

    it('should not display duration for pending actions', () => {
      const pendingAction: ActionTrace[] = [{
        type: 'ACTION_TRACE',
        timestamp: Date.now(),
        actionId: 'action_pending',
        actionType: 'PENDING_ACTION',
        status: 'started'
      }]

      render(<ActionTracer actions={pendingAction} />)

      expect(screen.queryByText(/ms$/)).not.toBeInTheDocument()
    })
  })

  describe('filtering', () => {
    it('should filter actions by status - success', () => {
      render(<ActionTracer actions={mockActions} />)

      const statusFilter = screen.getByLabelText(/filter by status/i)
      fireEvent.change(statusFilter, { target: { value: 'completed' } })

      expect(screen.getByText(/SUBMIT_FORM/i)).toBeInTheDocument()
      expect(screen.queryByText(/FETCH_DATA/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/UPDATE_STATE/i)).not.toBeInTheDocument()
    })

    it('should filter actions by status - failed', () => {
      render(<ActionTracer actions={mockActions} />)

      const statusFilter = screen.getByLabelText(/filter by status/i)
      fireEvent.change(statusFilter, { target: { value: 'failed' } })

      expect(screen.getByText(/FETCH_DATA/i)).toBeInTheDocument()
      expect(screen.queryByText(/SUBMIT_FORM/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/UPDATE_STATE/i)).not.toBeInTheDocument()
    })

    it('should filter actions by status - pending', () => {
      render(<ActionTracer actions={mockActions} />)

      const statusFilter = screen.getByLabelText(/filter by status/i)
      fireEvent.change(statusFilter, { target: { value: 'started' } })

      expect(screen.getByText(/UPDATE_STATE/i)).toBeInTheDocument()
      expect(screen.queryByText(/SUBMIT_FORM/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/FETCH_DATA/i)).not.toBeInTheDocument()
    })

    it('should search actions by type', () => {
      render(<ActionTracer actions={mockActions} />)

      const searchInput = screen.getByPlaceholderText(/search actions/i)
      fireEvent.change(searchInput, { target: { value: 'SUBMIT' } })

      expect(screen.getByText(/SUBMIT_FORM/i)).toBeInTheDocument()
      expect(screen.queryByText(/FETCH_DATA/i)).not.toBeInTheDocument()
    })

    it('should update count when filtering', () => {
      render(<ActionTracer actions={mockActions} />)

      const statusFilter = screen.getByLabelText(/filter by status/i)
      fireEvent.change(statusFilter, { target: { value: 'completed' } })

      expect(screen.getByText(/1 action/i)).toBeInTheDocument()
    })
  })

  describe('action details', () => {
    it('should show action details on click', () => {
      render(<ActionTracer actions={mockActions} />)

      const firstAction = screen.getByText(/SUBMIT_FORM/i)
      fireEvent.click(firstAction)

      expect(screen.getByText(/formId/i)).toBeInTheDocument()
      expect(screen.getByText(/user-registration/i)).toBeInTheDocument()
    })

    it('should display action parameters', () => {
      render(<ActionTracer actions={mockActions} />)

      const firstAction = screen.getByText(/SUBMIT_FORM/i)
      fireEvent.click(firstAction)

      expect(screen.getByText(/parameters/i)).toBeInTheDocument()
      expect(screen.getByText(/email/i)).toBeInTheDocument()
      expect(screen.getByText(/password/i)).toBeInTheDocument()
    })

    it('should display action result for completed actions', () => {
      render(<ActionTracer actions={mockActions} />)

      const firstAction = screen.getByText(/SUBMIT_FORM/i)
      fireEvent.click(firstAction)

      expect(screen.getByText(/result/i)).toBeInTheDocument()
      expect(screen.getByText(/user_123/i)).toBeInTheDocument()
    })

    it('should display error details for failed actions', () => {
      render(<ActionTracer actions={mockActions} />)

      const failedAction = screen.getByText(/FETCH_DATA/i)
      fireEvent.click(failedAction)

      const sections = screen.getAllByRole('heading', { level: 4 })
      expect(sections.some(h => h.textContent === 'Error')).toBe(true)
      expect(screen.getByText(/Network timeout/i)).toBeInTheDocument()
    })

    it('should copy action data to clipboard', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, {
        clipboard: {
          writeText
        }
      })

      render(<ActionTracer actions={mockActions} />)

      const firstAction = screen.getByText(/SUBMIT_FORM/i)
      fireEvent.click(firstAction)

      const copyButton = screen.getByRole('button', { name: /copy/i })
      fireEvent.click(copyButton)

      expect(writeText).toHaveBeenCalled()
    })

    it('should hide details when clicking another action', () => {
      render(<ActionTracer actions={mockActions} />)

      const firstAction = screen.getByText(/SUBMIT_FORM/i)
      fireEvent.click(firstAction)

      expect(screen.getByText(/user-registration/i)).toBeInTheDocument()

      const secondAction = screen.getByText(/FETCH_DATA/i)
      fireEvent.click(secondAction)

      expect(screen.getByText(/Network timeout/i)).toBeInTheDocument()
      expect(screen.queryByText(/user-registration/i)).not.toBeInTheDocument()
    })
  })

  describe('actions', () => {
    it('should clear actions', () => {
      const onClear = vi.fn()
      render(<ActionTracer actions={mockActions} onClear={onClear} />)

      const clearButton = screen.getByRole('button', { name: /clear/i })
      fireEvent.click(clearButton)

      expect(onClear).toHaveBeenCalled()
    })

    it('should export actions', () => {
      const onExport = vi.fn()
      render(<ActionTracer actions={mockActions} onExport={onExport} />)

      const exportButton = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportButton)

      expect(onExport).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should be keyboard navigable', () => {
      render(<ActionTracer actions={mockActions} />)

      const firstAction = screen.getByText(/SUBMIT_FORM/i)
      firstAction.focus()

      fireEvent.keyDown(firstAction, { key: 'Enter' })
      expect(screen.getByText(/formId/i)).toBeInTheDocument()
    })

    it('should support Space key for selection', () => {
      render(<ActionTracer actions={mockActions} />)

      const firstAction = screen.getByText(/SUBMIT_FORM/i)
      firstAction.focus()

      fireEvent.keyDown(firstAction, { key: ' ' })
      expect(screen.getByText(/formId/i)).toBeInTheDocument()
    })

    it('should have proper ARIA labels', () => {
      render(<ActionTracer actions={mockActions} />)

      expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Action list')
    })

    it('should announce filter changes', () => {
      render(<ActionTracer actions={mockActions} />)

      const statusFilter = screen.getByLabelText(/filter by status/i)
      fireEvent.change(statusFilter, { target: { value: 'completed' } })

      expect(screen.getByRole('status')).toHaveTextContent(/1 action/i)
    })
  })

  describe('timeline visualization', () => {
    it('should display actions in chronological order', () => {
      render(<ActionTracer actions={mockActions} />)

      const actionItems = screen.getAllByRole('listitem')
      const actionTexts = actionItems.map(item => item.textContent)

      // Should be in reverse chronological order (newest first)
      expect(actionTexts[0]).toMatch(/UPDATE_STATE/)
      expect(actionTexts[1]).toMatch(/FETCH_DATA/)
      expect(actionTexts[2]).toMatch(/SUBMIT_FORM/)
    })

    it('should display timestamps', () => {
      render(<ActionTracer actions={mockActions} />)

      const timeElements = screen.getAllByText(/:\d{2}:\d{2}/i)
      expect(timeElements.length).toBeGreaterThan(0)
    })

    it('should apply status-specific styling', () => {
      const { container } = render(<ActionTracer actions={mockActions} />)

      const completedAction = container.querySelector('[data-status="completed"]')
      const failedAction = container.querySelector('[data-status="failed"]')
      const startedAction = container.querySelector('[data-status="started"]')

      expect(completedAction).toBeInTheDocument()
      expect(failedAction).toBeInTheDocument()
      expect(startedAction).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle actions without parameters', () => {
      const actionWithoutParams: ActionTrace[] = [{
        type: 'ACTION_TRACE',
        timestamp: Date.now(),
        actionId: 'action_no_params',
        actionType: 'SIMPLE_ACTION',
        status: 'completed',
        duration: 100
      }]

      render(<ActionTracer actions={actionWithoutParams} />)

      const action = screen.getByText(/SIMPLE_ACTION/i)
      fireEvent.click(action)

      expect(screen.getByText(/action details/i)).toBeInTheDocument()
    })

    it('should handle actions without result', () => {
      const actionWithoutResult: ActionTrace[] = [{
        type: 'ACTION_TRACE',
        timestamp: Date.now(),
        actionId: 'action_void',
        actionType: 'VOID_ACTION',
        status: 'completed',
        duration: 50
      }]

      render(<ActionTracer actions={actionWithoutResult} />)

      const action = screen.getByText(/VOID_ACTION/i)
      fireEvent.click(action)

      const sections = screen.getAllByRole('heading', { level: 4 })
      expect(sections.every(h => h.textContent !== 'Result')).toBe(true)
    })

    it('should handle error without message', () => {
      const actionWithEmptyError: ActionTrace[] = [{
        type: 'ACTION_TRACE',
        timestamp: Date.now(),
        actionId: 'action_empty_error',
        actionType: 'ERROR_ACTION',
        status: 'failed',
        duration: 100,
        error: new Error()
      }]

      render(<ActionTracer actions={actionWithEmptyError} />)

      const action = screen.getByText(/ERROR_ACTION/i)
      fireEvent.click(action)

      const sections = screen.getAllByRole('heading', { level: 4 })
      expect(sections.some(h => h.textContent === 'Error')).toBe(true)
      expect(screen.getByText(/Unknown error/i)).toBeInTheDocument()
    })
  })
})
