/**
 * Human-in-the-Loop (HITL) Interrupt Component Types (Issue #88)
 * UI component definitions for displaying interrupt dialogs
 */

import type { A2UIComponent } from './components.js'

/**
 * Base type for all interrupt dialog components
 */
export type InterruptDialogComponent =
  | ConfirmationDialogComponent
  | ChoiceDialogComponent
  | InputDialogComponent
  | ReviewDialogComponent

/**
 * Confirmation Dialog Component
 * Yes/No or confirm/cancel decisions
 */
export interface ConfirmationDialogComponent extends A2UIComponent {
  type: 'confirmationDialog'
  properties: {
    /** Dialog title */
    title: string
    /** Main message to display */
    message: string
    /** Label for confirmation button */
    confirmLabel?: string
    /** Label for cancellation button */
    cancelLabel?: string
    /** Visual variant (normal, warning, destructive) */
    variant?: 'normal' | 'warning' | 'destructive'
    /** Default selection (true = confirm, false = cancel) */
    defaultValue?: boolean
    /** Optional icon to display */
    icon?: string
  }
}

/**
 * Choice Dialog Component
 * Single or multiple choice selection
 */
export interface ChoiceDialogComponent extends A2UIComponent {
  type: 'choiceDialog'
  properties: {
    /** Dialog title */
    title: string
    /** Main message to display */
    message: string
    /** Available options */
    options: Array<{
      value: string
      label: string
      description?: string
      disabled?: boolean
    }>
    /** Allow multiple selections */
    allowMultiple?: boolean
    /** Pre-selected value(s) */
    defaultValue?: string | string[]
    /** Minimum selections required (for multiple choice) */
    minSelections?: number
    /** Maximum selections allowed (for multiple choice) */
    maxSelections?: number
  }
}

/**
 * Input Dialog Component
 * Text input requests with validation
 */
export interface InputDialogComponent extends A2UIComponent {
  type: 'inputDialog'
  properties: {
    /** Dialog title */
    title: string
    /** Main message to display */
    message: string
    /** Input type */
    inputType: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea'
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
    /** Number of rows (for textarea) */
    rows?: number
    /** Maximum length (for textarea) */
    maxLength?: number
  }
}

/**
 * Review Dialog Component
 * Display structured data for user review
 */
export interface ReviewDialogComponent extends A2UIComponent {
  type: 'reviewDialog'
  properties: {
    /** Dialog title */
    title: string
    /** Main message to display */
    message: string
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
}

/**
 * Type guard for ConfirmationDialogComponent
 */
export function isConfirmationDialogComponent(
  component: unknown
): component is ConfirmationDialogComponent {
  if (typeof component !== 'object' || component === null) return false
  const c = component as A2UIComponent
  return c.type === 'confirmationDialog'
}

/**
 * Type guard for ChoiceDialogComponent
 */
export function isChoiceDialogComponent(component: unknown): component is ChoiceDialogComponent {
  if (typeof component !== 'object' || component === null) return false
  const c = component as A2UIComponent
  return c.type === 'choiceDialog'
}

/**
 * Type guard for InputDialogComponent
 */
export function isInputDialogComponent(component: unknown): component is InputDialogComponent {
  if (typeof component !== 'object' || component === null) return false
  const c = component as A2UIComponent
  return c.type === 'inputDialog'
}

/**
 * Type guard for ReviewDialogComponent
 */
export function isReviewDialogComponent(component: unknown): component is ReviewDialogComponent {
  if (typeof component !== 'object' || component === null) return false
  const c = component as A2UIComponent
  return c.type === 'reviewDialog'
}

/**
 * Helper function to create confirmation dialog component
 */
export function createConfirmationDialog(options: {
  id: string
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'normal' | 'warning' | 'destructive'
  defaultValue?: boolean
  icon?: string
}): ConfirmationDialogComponent {
  return {
    id: options.id,
    type: 'confirmationDialog',
    properties: {
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel || 'Confirm',
      cancelLabel: options.cancelLabel || 'Cancel',
      variant: options.variant || 'normal',
      defaultValue: options.defaultValue,
      icon: options.icon,
    },
  }
}

/**
 * Helper function to create choice dialog component
 */
export function createChoiceDialog(options: {
  id: string
  title: string
  message: string
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
}): ChoiceDialogComponent {
  return {
    id: options.id,
    type: 'choiceDialog',
    properties: {
      title: options.title,
      message: options.message,
      options: options.options,
      allowMultiple: options.allowMultiple,
      defaultValue: options.defaultValue,
      minSelections: options.minSelections,
      maxSelections: options.maxSelections,
    },
  }
}

/**
 * Helper function to create input dialog component
 */
export function createInputDialog(options: {
  id: string
  title: string
  message: string
  inputType: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea'
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
  rows?: number
  maxLength?: number
}): InputDialogComponent {
  return {
    id: options.id,
    type: 'inputDialog',
    properties: {
      title: options.title,
      message: options.message,
      inputType: options.inputType,
      placeholder: options.placeholder,
      defaultValue: options.defaultValue,
      validation: options.validation,
      helperText: options.helperText,
      rows: options.rows,
      maxLength: options.maxLength,
    },
  }
}

/**
 * Helper function to create review dialog component
 */
export function createReviewDialog(options: {
  id: string
  title: string
  message: string
  reviewData: Record<string, unknown>
  approveLabel?: string
  rejectLabel?: string
  allowComments?: boolean
  displayFormat?: 'json' | 'table' | 'diff' | 'custom'
}): ReviewDialogComponent {
  return {
    id: options.id,
    type: 'reviewDialog',
    properties: {
      title: options.title,
      message: options.message,
      reviewData: options.reviewData,
      approveLabel: options.approveLabel || 'Approve',
      rejectLabel: options.rejectLabel || 'Reject',
      allowComments: options.allowComments,
      displayFormat: options.displayFormat || 'json',
    },
  }
}
