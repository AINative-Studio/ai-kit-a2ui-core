/**
 * Human-in-the-Loop (HITL) Interrupt Message Types (Issue #88)
 * Enables agents to pause execution and request user input, confirmation, or choices
 */

import type { BaseMessage } from './protocol.js'

/**
 * Interrupt reason types
 */
export type InterruptReason = 'confirmation' | 'choice' | 'input' | 'review'

/**
 * Agent Interrupt Message (Agent → UI)
 * Sent when agent needs to pause and request user input
 */
export interface AgentInterruptMessage extends BaseMessage {
  type: 'agentInterrupt'
  /** Unique interrupt identifier */
  interruptId: string
  /** Reason for the interrupt */
  reason: InterruptReason
  /** Prompt message to display to user */
  prompt: string
  /** Optional timeout in milliseconds */
  timeout?: number
  /** Interrupt-specific data */
  data?: ConfirmationInterruptData | ChoiceInterruptData | InputInterruptData | ReviewInterruptData
  /** Optional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Interrupt Response Message (UI → Agent)
 * Sent when user responds to an interrupt
 */
export interface InterruptResponseMessage extends BaseMessage {
  type: 'interruptResponse'
  /** Interrupt ID this response corresponds to */
  interruptId: string
  /** User's response (type depends on interrupt reason) */
  response: boolean | string | string[] | Record<string, unknown> | null
  /** Whether the interrupt was cancelled */
  cancelled?: boolean
  /** Cancellation/timeout reason */
  reason?: string
  /** Optional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Confirmation Interrupt Data
 * Yes/No or confirm/cancel decisions
 */
export interface ConfirmationInterruptData {
  /** Label for confirmation button */
  confirmLabel?: string
  /** Label for cancellation button */
  cancelLabel?: string
  /** Visual variant (normal, warning, destructive) */
  variant?: 'normal' | 'warning' | 'destructive'
  /** Default selection (true = confirm, false = cancel) */
  defaultValue?: boolean
}

/**
 * Choice Interrupt Data
 * Single or multiple choice selection
 */
export interface ChoiceInterruptData {
  /** Available options */
  options: Array<{
    value: string
    label: string
    description?: string
    disabled?: boolean
  }>
  /** Allow multiple selections */
  allowMultiple?: boolean
  /** Pre-selected values */
  defaultValue?: string | string[]
  /** Minimum selections required (for multiple choice) */
  minSelections?: number
  /** Maximum selections allowed (for multiple choice) */
  maxSelections?: number
}

/**
 * Input Interrupt Data
 * Text input requests with validation
 */
export interface InputInterruptData {
  /** Input type */
  inputType?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea'
  /** Placeholder text */
  placeholder?: string
  /** Default value */
  defaultValue?: string
  /** Validation rules */
  validation?: {
    required?: boolean
    pattern?: string
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    customValidator?: string
  }
  /** Helper text to display */
  helperText?: string
}

/**
 * Review Interrupt Data
 * Display structured data for user review
 */
export interface ReviewInterruptData {
  /** Data to review (flexible structure) */
  reviewData: Record<string, unknown>
  /** Label for approve action */
  approveLabel?: string
  /** Label for reject action */
  rejectLabel?: string
  /** Allow inline comments */
  allowComments?: boolean
  /** Format for data display */
  displayFormat?: 'json' | 'table' | 'diff' | 'custom'
}

/**
 * Type guard for AgentInterruptMessage
 */
export function isAgentInterruptMessage(msg: unknown): msg is AgentInterruptMessage {
  if (typeof msg !== 'object' || msg === null) return false
  const m = msg as Record<string, unknown>
  return (
    m['type'] === 'agentInterrupt' &&
    typeof m['interruptId'] === 'string' &&
    typeof m['reason'] === 'string' &&
    typeof m['prompt'] === 'string'
  )
}

/**
 * Type guard for InterruptResponseMessage
 */
export function isInterruptResponseMessage(msg: unknown): msg is InterruptResponseMessage {
  if (typeof msg !== 'object' || msg === null) return false
  const m = msg as Record<string, unknown>
  return (
    m['type'] === 'interruptResponse' &&
    typeof m['interruptId'] === 'string' &&
    'response' in m
  )
}

/**
 * Helper function to create confirmation interrupt
 */
export function createConfirmationInterrupt(options: {
  interruptId: string
  prompt: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'normal' | 'warning' | 'destructive'
  defaultValue?: boolean
  timeout?: number
  metadata?: Record<string, unknown>
}): AgentInterruptMessage {
  return {
    type: 'agentInterrupt',
    interruptId: options.interruptId,
    reason: 'confirmation',
    prompt: options.prompt,
    timeout: options.timeout,
    data: {
      confirmLabel: options.confirmLabel || 'Confirm',
      cancelLabel: options.cancelLabel || 'Cancel',
      variant: options.variant || 'normal',
      defaultValue: options.defaultValue,
    },
    metadata: options.metadata,
    timestamp: Date.now(),
  }
}

/**
 * Helper function to create choice interrupt
 */
export function createChoiceInterrupt(options: {
  interruptId: string
  prompt: string
  options: Array<{
    value: string
    label: string
    description?: string
    disabled?: boolean
  }>
  allowMultiple?: boolean
  defaultValue?: string | string[]
  minSelections?: number
  maxSelections?: number
  timeout?: number
  metadata?: Record<string, unknown>
}): AgentInterruptMessage {
  return {
    type: 'agentInterrupt',
    interruptId: options.interruptId,
    reason: 'choice',
    prompt: options.prompt,
    timeout: options.timeout,
    data: {
      options: options.options,
      allowMultiple: options.allowMultiple || false,
      defaultValue: options.defaultValue,
      minSelections: options.minSelections,
      maxSelections: options.maxSelections,
    },
    metadata: options.metadata,
    timestamp: Date.now(),
  }
}

/**
 * Helper function to create input interrupt
 */
export function createInputInterrupt(options: {
  interruptId: string
  prompt: string
  inputType?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea'
  placeholder?: string
  defaultValue?: string
  validation?: {
    required?: boolean
    pattern?: string
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    customValidator?: string
  }
  helperText?: string
  timeout?: number
  metadata?: Record<string, unknown>
}): AgentInterruptMessage {
  return {
    type: 'agentInterrupt',
    interruptId: options.interruptId,
    reason: 'input',
    prompt: options.prompt,
    timeout: options.timeout,
    data: {
      inputType: options.inputType || 'text',
      placeholder: options.placeholder,
      defaultValue: options.defaultValue,
      validation: options.validation,
      helperText: options.helperText,
    },
    metadata: options.metadata,
    timestamp: Date.now(),
  }
}

/**
 * Helper function to create review interrupt
 */
export function createReviewInterrupt(options: {
  interruptId: string
  prompt: string
  reviewData: Record<string, unknown>
  approveLabel?: string
  rejectLabel?: string
  allowComments?: boolean
  displayFormat?: 'json' | 'table' | 'diff' | 'custom'
  timeout?: number
  metadata?: Record<string, unknown>
}): AgentInterruptMessage {
  return {
    type: 'agentInterrupt',
    interruptId: options.interruptId,
    reason: 'review',
    prompt: options.prompt,
    timeout: options.timeout,
    data: {
      reviewData: options.reviewData,
      approveLabel: options.approveLabel || 'Approve',
      rejectLabel: options.rejectLabel || 'Reject',
      allowComments: options.allowComments,
      displayFormat: options.displayFormat || 'json',
    },
    metadata: options.metadata,
    timestamp: Date.now(),
  }
}

/**
 * Helper function to create interrupt response
 */
export function createInterruptResponse(options: {
  interruptId: string
  response: boolean | string | string[] | Record<string, unknown> | null
  cancelled?: boolean
  reason?: string
  metadata?: Record<string, unknown>
}): InterruptResponseMessage {
  return {
    type: 'interruptResponse',
    interruptId: options.interruptId,
    response: options.response,
    cancelled: options.cancelled,
    reason: options.reason,
    metadata: options.metadata,
    timestamp: Date.now(),
  }
}
