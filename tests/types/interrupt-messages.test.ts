/**
 * Tests for Human-in-the-Loop Interrupt Message Types (Issue #88)
 * Following TDD approach: Tests written before implementation
 */

import { describe, it, expect } from 'vitest'
import type {
  AgentInterruptMessage,
  InterruptResponseMessage,
  InterruptReason,
  ConfirmationInterruptData,
  ChoiceInterruptData,
  InputInterruptData,
  ReviewInterruptData,
} from '../../src/types/interrupt-messages'
import {
  isAgentInterruptMessage,
  isInterruptResponseMessage,
  createConfirmationInterrupt,
  createChoiceInterrupt,
  createInputInterrupt,
  createReviewInterrupt,
  createInterruptResponse,
} from '../../src/types/interrupt-messages'

describe('AgentInterruptMessage Type', () => {
  it('should define AgentInterruptMessage with required fields', () => {
    const message: AgentInterruptMessage = {
      type: 'agentInterrupt',
      interruptId: 'int-001',
      reason: 'confirmation',
      prompt: 'Are you sure you want to proceed?',
      timestamp: Date.now(),
    }

    expect(message.type).toBe('agentInterrupt')
    expect(message.interruptId).toBe('int-001')
    expect(message.reason).toBe('confirmation')
    expect(message.prompt).toBe('Are you sure you want to proceed?')
    expect(message.timestamp).toBeTypeOf('number')
  })

  it('should support confirmation interrupt with optional timeout', () => {
    const message: AgentInterruptMessage = {
      type: 'agentInterrupt',
      interruptId: 'int-002',
      reason: 'confirmation',
      prompt: 'Delete this file?',
      timeout: 30000,
      data: {
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        variant: 'destructive',
      } as ConfirmationInterruptData,
    }

    expect(message.timeout).toBe(30000)
    expect(message.data).toBeDefined()
    expect((message.data as ConfirmationInterruptData).confirmLabel).toBe('Delete')
  })

  it('should support choice interrupt with options', () => {
    const message: AgentInterruptMessage = {
      type: 'agentInterrupt',
      interruptId: 'int-003',
      reason: 'choice',
      prompt: 'Select deployment environment',
      data: {
        options: [
          { value: 'dev', label: 'Development' },
          { value: 'staging', label: 'Staging' },
          { value: 'prod', label: 'Production' },
        ],
        allowMultiple: false,
      } as ChoiceInterruptData,
    }

    expect(message.reason).toBe('choice')
    expect((message.data as ChoiceInterruptData).options).toHaveLength(3)
    expect((message.data as ChoiceInterruptData).allowMultiple).toBe(false)
  })

  it('should support input interrupt with validation', () => {
    const message: AgentInterruptMessage = {
      type: 'agentInterrupt',
      interruptId: 'int-004',
      reason: 'input',
      prompt: 'Enter your API key',
      data: {
        inputType: 'password',
        placeholder: 'sk-...',
        validation: {
          required: true,
          pattern: '^sk-[a-zA-Z0-9]{32}$',
          minLength: 35,
        },
      } as InputInterruptData,
    }

    expect(message.reason).toBe('input')
    expect((message.data as InputInterruptData).inputType).toBe('password')
    expect((message.data as InputInterruptData).validation?.pattern).toBeDefined()
  })

  it('should support review interrupt with structured data', () => {
    const message: AgentInterruptMessage = {
      type: 'agentInterrupt',
      interruptId: 'int-005',
      reason: 'review',
      prompt: 'Please review the following changes',
      data: {
        reviewData: {
          changes: [
            { file: 'app.ts', additions: 10, deletions: 5 },
            { file: 'test.ts', additions: 20, deletions: 0 },
          ],
          summary: 'Added authentication feature',
        },
        approveLabel: 'Approve',
        rejectLabel: 'Reject',
      } as ReviewInterruptData,
    }

    expect(message.reason).toBe('review')
    expect((message.data as ReviewInterruptData).reviewData).toBeDefined()
    expect((message.data as ReviewInterruptData).approveLabel).toBe('Approve')
  })

  it('should support optional metadata field', () => {
    const message: AgentInterruptMessage = {
      type: 'agentInterrupt',
      interruptId: 'int-006',
      reason: 'confirmation',
      prompt: 'Continue?',
      metadata: {
        surfaceId: 'surface-1',
        context: 'file-deletion',
        priority: 'high',
      },
    }

    expect(message.metadata).toBeDefined()
    expect(message.metadata?.surfaceId).toBe('surface-1')
  })

  it('should validate interrupt reason enum', () => {
    const validReasons: InterruptReason[] = ['confirmation', 'choice', 'input', 'review']

    validReasons.forEach((reason) => {
      const message: AgentInterruptMessage = {
        type: 'agentInterrupt',
        interruptId: 'test',
        reason,
        prompt: 'Test',
      }
      expect(message.reason).toBe(reason)
    })
  })
})

describe('InterruptResponseMessage Type', () => {
  it('should define InterruptResponseMessage with required fields', () => {
    const response: InterruptResponseMessage = {
      type: 'interruptResponse',
      interruptId: 'int-001',
      response: true,
      timestamp: Date.now(),
    }

    expect(response.type).toBe('interruptResponse')
    expect(response.interruptId).toBe('int-001')
    expect(response.response).toBe(true)
    expect(response.timestamp).toBeTypeOf('number')
  })

  it('should support boolean response for confirmation', () => {
    const response: InterruptResponseMessage = {
      type: 'interruptResponse',
      interruptId: 'int-002',
      response: false,
      timestamp: Date.now(),
    }

    expect(response.response).toBe(false)
  })

  it('should support string response for choice', () => {
    const response: InterruptResponseMessage = {
      type: 'interruptResponse',
      interruptId: 'int-003',
      response: 'staging',
      timestamp: Date.now(),
    }

    expect(response.response).toBe('staging')
  })

  it('should support array response for multiple choice', () => {
    const response: InterruptResponseMessage = {
      type: 'interruptResponse',
      interruptId: 'int-004',
      response: ['option1', 'option2'],
      timestamp: Date.now(),
    }

    expect(Array.isArray(response.response)).toBe(true)
    expect(response.response).toHaveLength(2)
  })

  it('should support null response for timeout/cancellation', () => {
    const response: InterruptResponseMessage = {
      type: 'interruptResponse',
      interruptId: 'int-005',
      response: null,
      timestamp: Date.now(),
      cancelled: true,
      reason: 'timeout',
    }

    expect(response.response).toBeNull()
    expect(response.cancelled).toBe(true)
    expect(response.reason).toBe('timeout')
  })

  it('should support optional metadata field', () => {
    const response: InterruptResponseMessage = {
      type: 'interruptResponse',
      interruptId: 'int-006',
      response: 'approved',
      timestamp: Date.now(),
      metadata: {
        userId: 'user-123',
        deviceId: 'device-456',
      },
    }

    expect(response.metadata).toBeDefined()
    expect(response.metadata?.userId).toBe('user-123')
  })
})

describe('Type Guards', () => {
  it('should identify AgentInterruptMessage correctly', () => {
    const message = {
      type: 'agentInterrupt',
      interruptId: 'int-001',
      reason: 'confirmation',
      prompt: 'Proceed?',
    }

    expect(isAgentInterruptMessage(message)).toBe(true)
  })

  it('should reject non-interrupt messages', () => {
    const message = {
      type: 'userAction',
      surfaceId: 'surface-1',
      action: 'click',
    }

    expect(isAgentInterruptMessage(message)).toBe(false)
  })

  it('should identify InterruptResponseMessage correctly', () => {
    const response = {
      type: 'interruptResponse',
      interruptId: 'int-001',
      response: true,
      timestamp: Date.now(),
    }

    expect(isInterruptResponseMessage(response)).toBe(true)
  })

  it('should reject invalid interrupt response', () => {
    const response = {
      type: 'error',
      code: 'ERR001',
      message: 'Error',
    }

    expect(isInterruptResponseMessage(response)).toBe(false)
  })
})

describe('Helper Functions', () => {
  describe('createConfirmationInterrupt', () => {
    it('should create confirmation interrupt with defaults', () => {
      const interrupt = createConfirmationInterrupt({
        interruptId: 'int-001',
        prompt: 'Are you sure?',
      })

      expect(interrupt.type).toBe('agentInterrupt')
      expect(interrupt.reason).toBe('confirmation')
      expect(interrupt.prompt).toBe('Are you sure?')
      expect(interrupt.data).toBeDefined()
    })

    it('should create confirmation interrupt with custom labels', () => {
      const interrupt = createConfirmationInterrupt({
        interruptId: 'int-002',
        prompt: 'Delete file?',
        confirmLabel: 'Delete',
        cancelLabel: 'Keep',
        variant: 'destructive',
      })

      const data = interrupt.data as ConfirmationInterruptData
      expect(data.confirmLabel).toBe('Delete')
      expect(data.cancelLabel).toBe('Keep')
      expect(data.variant).toBe('destructive')
    })

    it('should support timeout configuration', () => {
      const interrupt = createConfirmationInterrupt({
        interruptId: 'int-003',
        prompt: 'Continue?',
        timeout: 15000,
      })

      expect(interrupt.timeout).toBe(15000)
    })
  })

  describe('createChoiceInterrupt', () => {
    it('should create choice interrupt with options', () => {
      const options = [
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' },
      ]

      const interrupt = createChoiceInterrupt({
        interruptId: 'int-004',
        prompt: 'Select an option',
        options,
      })

      expect(interrupt.reason).toBe('choice')
      const data = interrupt.data as ChoiceInterruptData
      expect(data.options).toEqual(options)
      expect(data.allowMultiple).toBe(false)
    })

    it('should support multiple selection', () => {
      const interrupt = createChoiceInterrupt({
        interruptId: 'int-005',
        prompt: 'Select features',
        options: [{ value: '1', label: 'Feature 1' }],
        allowMultiple: true,
      })

      const data = interrupt.data as ChoiceInterruptData
      expect(data.allowMultiple).toBe(true)
    })
  })

  describe('createInputInterrupt', () => {
    it('should create input interrupt with default text type', () => {
      const interrupt = createInputInterrupt({
        interruptId: 'int-006',
        prompt: 'Enter your name',
      })

      expect(interrupt.reason).toBe('input')
      const data = interrupt.data as InputInterruptData
      expect(data.inputType).toBe('text')
    })

    it('should support different input types', () => {
      const interrupt = createInputInterrupt({
        interruptId: 'int-007',
        prompt: 'Enter password',
        inputType: 'password',
        placeholder: 'Your password',
      })

      const data = interrupt.data as InputInterruptData
      expect(data.inputType).toBe('password')
      expect(data.placeholder).toBe('Your password')
    })

    it('should support validation rules', () => {
      const interrupt = createInputInterrupt({
        interruptId: 'int-008',
        prompt: 'Enter email',
        validation: {
          required: true,
          pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
          minLength: 5,
          maxLength: 100,
        },
      })

      const data = interrupt.data as InputInterruptData
      expect(data.validation?.required).toBe(true)
      expect(data.validation?.pattern).toBeDefined()
    })
  })

  describe('createReviewInterrupt', () => {
    it('should create review interrupt with data', () => {
      const reviewData = {
        title: 'Code Review',
        items: ['Change 1', 'Change 2'],
      }

      const interrupt = createReviewInterrupt({
        interruptId: 'int-009',
        prompt: 'Review changes',
        reviewData,
      })

      expect(interrupt.reason).toBe('review')
      const data = interrupt.data as ReviewInterruptData
      expect(data.reviewData).toEqual(reviewData)
    })

    it('should support custom action labels', () => {
      const interrupt = createReviewInterrupt({
        interruptId: 'int-010',
        prompt: 'Review PR',
        reviewData: { pr: 123 },
        approveLabel: 'Merge',
        rejectLabel: 'Request Changes',
      })

      const data = interrupt.data as ReviewInterruptData
      expect(data.approveLabel).toBe('Merge')
      expect(data.rejectLabel).toBe('Request Changes')
    })
  })

  describe('createInterruptResponse', () => {
    it('should create response with boolean value', () => {
      const response = createInterruptResponse({
        interruptId: 'int-001',
        response: true,
      })

      expect(response.type).toBe('interruptResponse')
      expect(response.response).toBe(true)
      expect(response.timestamp).toBeDefined()
    })

    it('should create response with string value', () => {
      const response = createInterruptResponse({
        interruptId: 'int-002',
        response: 'selected-option',
      })

      expect(response.response).toBe('selected-option')
    })

    it('should create cancelled response', () => {
      const response = createInterruptResponse({
        interruptId: 'int-003',
        response: null,
        cancelled: true,
        reason: 'user-cancelled',
      })

      expect(response.response).toBeNull()
      expect(response.cancelled).toBe(true)
      expect(response.reason).toBe('user-cancelled')
    })

    it('should support metadata in response', () => {
      const response = createInterruptResponse({
        interruptId: 'int-004',
        response: 'value',
        metadata: { source: 'mobile-app' },
      })

      expect(response.metadata?.source).toBe('mobile-app')
    })
  })
})

describe('Edge Cases and Validation', () => {
  it('should handle empty prompt strings', () => {
    const message: AgentInterruptMessage = {
      type: 'agentInterrupt',
      interruptId: 'int-001',
      reason: 'confirmation',
      prompt: '',
    }

    expect(message.prompt).toBe('')
  })

  it('should handle very long prompt strings', () => {
    const longPrompt = 'A'.repeat(10000)
    const message: AgentInterruptMessage = {
      type: 'agentInterrupt',
      interruptId: 'int-002',
      reason: 'input',
      prompt: longPrompt,
    }

    expect(message.prompt).toHaveLength(10000)
  })

  it('should handle special characters in interruptId', () => {
    const message: AgentInterruptMessage = {
      type: 'agentInterrupt',
      interruptId: 'int-uuid-123e4567-e89b-12d3-a456-426614174000',
      reason: 'confirmation',
      prompt: 'Proceed?',
    }

    expect(message.interruptId).toContain('uuid')
  })

  it('should handle zero timeout', () => {
    const message: AgentInterruptMessage = {
      type: 'agentInterrupt',
      interruptId: 'int-003',
      reason: 'confirmation',
      prompt: 'Quick question?',
      timeout: 0,
    }

    expect(message.timeout).toBe(0)
  })

  it('should handle negative timestamp', () => {
    const response: InterruptResponseMessage = {
      type: 'interruptResponse',
      interruptId: 'int-004',
      response: true,
      timestamp: -1,
    }

    expect(response.timestamp).toBe(-1)
  })

  it('should handle complex nested data in metadata', () => {
    const message: AgentInterruptMessage = {
      type: 'agentInterrupt',
      interruptId: 'int-005',
      reason: 'review',
      prompt: 'Review',
      metadata: {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      },
    }

    expect(message.metadata?.level1?.level2?.level3?.value).toBe('deep')
  })
})
