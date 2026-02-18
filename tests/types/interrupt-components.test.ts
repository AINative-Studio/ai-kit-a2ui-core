/**
 * Tests for Human-in-the-Loop Interrupt Component Types (Issue #88)
 * Following TDD approach: Tests written before implementation
 */

import { describe, it, expect } from 'vitest'
import type {
  InterruptDialogComponent,
  ConfirmationDialogComponent,
  ChoiceDialogComponent,
  InputDialogComponent,
  ReviewDialogComponent,
} from '../../src/types/interrupt-components'
import {
  isConfirmationDialogComponent,
  isChoiceDialogComponent,
  isInputDialogComponent,
  isReviewDialogComponent,
  createConfirmationDialog,
  createChoiceDialog,
  createInputDialog,
  createReviewDialog,
} from '../../src/types/interrupt-components'

describe('ConfirmationDialogComponent Type', () => {
  it('should define ConfirmationDialog with required fields', () => {
    const component: ConfirmationDialogComponent = {
      id: 'dialog-001',
      type: 'confirmationDialog',
      properties: {
        title: 'Confirm Action',
        message: 'Are you sure?',
        confirmLabel: 'Yes',
        cancelLabel: 'No',
      },
    }

    expect(component.id).toBe('dialog-001')
    expect(component.type).toBe('confirmationDialog')
    expect(component.properties.title).toBe('Confirm Action')
    expect(component.properties.message).toBe('Are you sure?')
  })

  it('should support variant property for styling', () => {
    const component: ConfirmationDialogComponent = {
      id: 'dialog-002',
      type: 'confirmationDialog',
      properties: {
        title: 'Delete File',
        message: 'This action cannot be undone',
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        variant: 'destructive',
      },
    }

    expect(component.properties.variant).toBe('destructive')
  })

  it('should support defaultValue property', () => {
    const component: ConfirmationDialogComponent = {
      id: 'dialog-003',
      type: 'confirmationDialog',
      properties: {
        title: 'Enable Feature',
        message: 'Enable this feature?',
        defaultValue: true,
      },
    }

    expect(component.properties.defaultValue).toBe(true)
  })

  it('should support optional icon property', () => {
    const component: ConfirmationDialogComponent = {
      id: 'dialog-004',
      type: 'confirmationDialog',
      properties: {
        title: 'Warning',
        message: 'Proceed with caution',
        icon: 'warning',
      },
    }

    expect(component.properties.icon).toBe('warning')
  })
})

describe('ChoiceDialogComponent Type', () => {
  it('should define ChoiceDialog with options', () => {
    const component: ChoiceDialogComponent = {
      id: 'choice-001',
      type: 'choiceDialog',
      properties: {
        title: 'Select Environment',
        message: 'Choose deployment target',
        options: [
          { value: 'dev', label: 'Development' },
          { value: 'prod', label: 'Production' },
        ],
      },
    }

    expect(component.type).toBe('choiceDialog')
    expect(component.properties.options).toHaveLength(2)
    expect(component.properties.options[0]?.value).toBe('dev')
  })

  it('should support single and multiple selection', () => {
    const singleChoice: ChoiceDialogComponent = {
      id: 'choice-002',
      type: 'choiceDialog',
      properties: {
        title: 'Select One',
        message: 'Choose one option',
        options: [{ value: 'a', label: 'A' }],
        allowMultiple: false,
      },
    }

    const multipleChoice: ChoiceDialogComponent = {
      id: 'choice-003',
      type: 'choiceDialog',
      properties: {
        title: 'Select Multiple',
        message: 'Choose multiple options',
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
        allowMultiple: true,
      },
    }

    expect(singleChoice.properties.allowMultiple).toBe(false)
    expect(multipleChoice.properties.allowMultiple).toBe(true)
  })

  it('should support option descriptions', () => {
    const component: ChoiceDialogComponent = {
      id: 'choice-004',
      type: 'choiceDialog',
      properties: {
        title: 'Choose Plan',
        message: 'Select your subscription',
        options: [
          {
            value: 'basic',
            label: 'Basic',
            description: '$9/month - Essential features',
          },
          {
            value: 'pro',
            label: 'Professional',
            description: '$29/month - Advanced features',
          },
        ],
      },
    }

    expect(component.properties.options[0]?.description).toBeDefined()
    expect(component.properties.options[0]?.description).toContain('$9/month')
  })

  it('should support disabled options', () => {
    const component: ChoiceDialogComponent = {
      id: 'choice-005',
      type: 'choiceDialog',
      properties: {
        title: 'Select Option',
        message: 'Some options are unavailable',
        options: [
          { value: 'available', label: 'Available Option', disabled: false },
          { value: 'unavailable', label: 'Unavailable Option', disabled: true },
        ],
      },
    }

    expect(component.properties.options[1]?.disabled).toBe(true)
  })

  it('should support min and max selections for multiple choice', () => {
    const component: ChoiceDialogComponent = {
      id: 'choice-006',
      type: 'choiceDialog',
      properties: {
        title: 'Select 2-3 Options',
        message: 'Choose at least 2, maximum 3',
        options: [
          { value: '1', label: 'Option 1' },
          { value: '2', label: 'Option 2' },
          { value: '3', label: 'Option 3' },
          { value: '4', label: 'Option 4' },
        ],
        allowMultiple: true,
        minSelections: 2,
        maxSelections: 3,
      },
    }

    expect(component.properties.minSelections).toBe(2)
    expect(component.properties.maxSelections).toBe(3)
  })
})

describe('InputDialogComponent Type', () => {
  it('should define InputDialog with basic text input', () => {
    const component: InputDialogComponent = {
      id: 'input-001',
      type: 'inputDialog',
      properties: {
        title: 'Enter Name',
        message: 'What is your name?',
        inputType: 'text',
      },
    }

    expect(component.type).toBe('inputDialog')
    expect(component.properties.inputType).toBe('text')
  })

  it('should support different input types', () => {
    const inputTypes: Array<'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea'> = [
      'text',
      'email',
      'password',
      'number',
      'tel',
      'url',
      'textarea',
    ]

    inputTypes.forEach((inputType) => {
      const component: InputDialogComponent = {
        id: `input-${inputType}`,
        type: 'inputDialog',
        properties: {
          title: 'Input',
          message: `Enter ${inputType}`,
          inputType,
        },
      }

      expect(component.properties.inputType).toBe(inputType)
    })
  })

  it('should support placeholder and default value', () => {
    const component: InputDialogComponent = {
      id: 'input-002',
      type: 'inputDialog',
      properties: {
        title: 'Enter Email',
        message: 'Your email address',
        inputType: 'email',
        placeholder: 'user@example.com',
        defaultValue: 'existing@example.com',
      },
    }

    expect(component.properties.placeholder).toBe('user@example.com')
    expect(component.properties.defaultValue).toBe('existing@example.com')
  })

  it('should support validation rules', () => {
    const component: InputDialogComponent = {
      id: 'input-003',
      type: 'inputDialog',
      properties: {
        title: 'Create Password',
        message: 'Enter a strong password',
        inputType: 'password',
        validation: {
          required: true,
          minLength: 8,
          maxLength: 128,
          pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$',
        },
      },
    }

    expect(component.properties.validation?.required).toBe(true)
    expect(component.properties.validation?.minLength).toBe(8)
    expect(component.properties.validation?.pattern).toBeDefined()
  })

  it('should support helper text for user guidance', () => {
    const component: InputDialogComponent = {
      id: 'input-004',
      type: 'inputDialog',
      properties: {
        title: 'API Key',
        message: 'Enter your API key',
        inputType: 'password',
        helperText: 'Found in your account settings',
      },
    }

    expect(component.properties.helperText).toBe('Found in your account settings')
  })

  it('should support multiline textarea', () => {
    const component: InputDialogComponent = {
      id: 'input-005',
      type: 'inputDialog',
      properties: {
        title: 'Comments',
        message: 'Enter your comments',
        inputType: 'textarea',
        rows: 5,
        maxLength: 500,
      },
    }

    expect(component.properties.inputType).toBe('textarea')
    expect(component.properties.rows).toBe(5)
  })
})

describe('ReviewDialogComponent Type', () => {
  it('should define ReviewDialog with data to review', () => {
    const component: ReviewDialogComponent = {
      id: 'review-001',
      type: 'reviewDialog',
      properties: {
        title: 'Review Changes',
        message: 'Please review the following',
        reviewData: {
          changes: ['Added feature A', 'Fixed bug B'],
        },
      },
    }

    expect(component.type).toBe('reviewDialog')
    expect(component.properties.reviewData).toBeDefined()
  })

  it('should support custom action labels', () => {
    const component: ReviewDialogComponent = {
      id: 'review-002',
      type: 'reviewDialog',
      properties: {
        title: 'Approve PR',
        message: 'Review pull request',
        reviewData: { pr: 123 },
        approveLabel: 'Merge',
        rejectLabel: 'Request Changes',
      },
    }

    expect(component.properties.approveLabel).toBe('Merge')
    expect(component.properties.rejectLabel).toBe('Request Changes')
  })

  it('should support different display formats', () => {
    const formats: Array<'json' | 'table' | 'diff' | 'custom'> = ['json', 'table', 'diff', 'custom']

    formats.forEach((format) => {
      const component: ReviewDialogComponent = {
        id: `review-${format}`,
        type: 'reviewDialog',
        properties: {
          title: 'Review',
          message: 'Review data',
          reviewData: { data: 'test' },
          displayFormat: format,
        },
      }

      expect(component.properties.displayFormat).toBe(format)
    })
  })

  it('should support inline comments', () => {
    const component: ReviewDialogComponent = {
      id: 'review-003',
      type: 'reviewDialog',
      properties: {
        title: 'Code Review',
        message: 'Review code changes',
        reviewData: {
          files: ['app.ts', 'test.ts'],
        },
        allowComments: true,
      },
    }

    expect(component.properties.allowComments).toBe(true)
  })

  it('should support complex nested review data', () => {
    const component: ReviewDialogComponent = {
      id: 'review-004',
      type: 'reviewDialog',
      properties: {
        title: 'Review Configuration',
        message: 'Review deployment config',
        reviewData: {
          environment: 'production',
          services: [
            { name: 'api', replicas: 3, resources: { cpu: '2', memory: '4Gi' } },
            { name: 'db', replicas: 1, resources: { cpu: '4', memory: '8Gi' } },
          ],
          domains: ['api.example.com', 'app.example.com'],
        },
        displayFormat: 'json',
      },
    }

    expect(component.properties.reviewData.environment).toBe('production')
    expect(component.properties.reviewData.services).toBeInstanceOf(Array)
  })
})

describe('Type Guards', () => {
  it('should identify ConfirmationDialogComponent correctly', () => {
    const component = {
      id: 'test',
      type: 'confirmationDialog',
      properties: { title: 'Test', message: 'Test' },
    }

    expect(isConfirmationDialogComponent(component)).toBe(true)
  })

  it('should reject non-confirmation components', () => {
    const component = {
      id: 'test',
      type: 'choiceDialog',
      properties: { title: 'Test', message: 'Test', options: [] },
    }

    expect(isConfirmationDialogComponent(component)).toBe(false)
  })

  it('should identify ChoiceDialogComponent correctly', () => {
    const component = {
      id: 'test',
      type: 'choiceDialog',
      properties: { title: 'Test', message: 'Test', options: [] },
    }

    expect(isChoiceDialogComponent(component)).toBe(true)
  })

  it('should identify InputDialogComponent correctly', () => {
    const component = {
      id: 'test',
      type: 'inputDialog',
      properties: { title: 'Test', message: 'Test', inputType: 'text' as const },
    }

    expect(isInputDialogComponent(component)).toBe(true)
  })

  it('should identify ReviewDialogComponent correctly', () => {
    const component = {
      id: 'test',
      type: 'reviewDialog',
      properties: { title: 'Test', message: 'Test', reviewData: {} },
    }

    expect(isReviewDialogComponent(component)).toBe(true)
  })
})

describe('Helper Functions', () => {
  describe('createConfirmationDialog', () => {
    it('should create confirmation dialog with required props', () => {
      const dialog = createConfirmationDialog({
        id: 'confirm-001',
        title: 'Confirm',
        message: 'Are you sure?',
      })

      expect(dialog.type).toBe('confirmationDialog')
      expect(dialog.properties.title).toBe('Confirm')
      expect(dialog.properties.message).toBe('Are you sure?')
    })

    it('should create dialog with custom labels', () => {
      const dialog = createConfirmationDialog({
        id: 'confirm-002',
        title: 'Delete',
        message: 'Delete file?',
        confirmLabel: 'Delete',
        cancelLabel: 'Keep',
        variant: 'destructive',
      })

      expect(dialog.properties.confirmLabel).toBe('Delete')
      expect(dialog.properties.cancelLabel).toBe('Keep')
      expect(dialog.properties.variant).toBe('destructive')
    })
  })

  describe('createChoiceDialog', () => {
    it('should create choice dialog with options', () => {
      const dialog = createChoiceDialog({
        id: 'choice-001',
        title: 'Select',
        message: 'Choose option',
        options: [
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ],
      })

      expect(dialog.type).toBe('choiceDialog')
      expect(dialog.properties.options).toHaveLength(2)
    })

    it('should support multiple selection', () => {
      const dialog = createChoiceDialog({
        id: 'choice-002',
        title: 'Select Multiple',
        message: 'Choose options',
        options: [{ value: 'a', label: 'A' }],
        allowMultiple: true,
        minSelections: 1,
        maxSelections: 3,
      })

      expect(dialog.properties.allowMultiple).toBe(true)
      expect(dialog.properties.minSelections).toBe(1)
    })
  })

  describe('createInputDialog', () => {
    it('should create input dialog with basic config', () => {
      const dialog = createInputDialog({
        id: 'input-001',
        title: 'Enter Data',
        message: 'Input required',
        inputType: 'text',
      })

      expect(dialog.type).toBe('inputDialog')
      expect(dialog.properties.inputType).toBe('text')
    })

    it('should support validation rules', () => {
      const dialog = createInputDialog({
        id: 'input-002',
        title: 'Email',
        message: 'Enter email',
        inputType: 'email',
        validation: {
          required: true,
          pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
        },
        helperText: 'Valid email required',
      })

      expect(dialog.properties.validation?.required).toBe(true)
      expect(dialog.properties.helperText).toBe('Valid email required')
    })
  })

  describe('createReviewDialog', () => {
    it('should create review dialog with data', () => {
      const dialog = createReviewDialog({
        id: 'review-001',
        title: 'Review',
        message: 'Review data',
        reviewData: { key: 'value' },
      })

      expect(dialog.type).toBe('reviewDialog')
      expect(dialog.properties.reviewData.key).toBe('value')
    })

    it('should support custom display format', () => {
      const dialog = createReviewDialog({
        id: 'review-002',
        title: 'Review',
        message: 'Review changes',
        reviewData: { changes: [] },
        displayFormat: 'diff',
        approveLabel: 'Accept',
        rejectLabel: 'Decline',
        allowComments: true,
      })

      expect(dialog.properties.displayFormat).toBe('diff')
      expect(dialog.properties.allowComments).toBe(true)
    })
  })
})

describe('Edge Cases', () => {
  it('should handle empty strings in properties', () => {
    const component: ConfirmationDialogComponent = {
      id: '',
      type: 'confirmationDialog',
      properties: {
        title: '',
        message: '',
      },
    }

    expect(component.properties.title).toBe('')
  })

  it('should handle very long text in properties', () => {
    const longText = 'A'.repeat(10000)
    const component: InputDialogComponent = {
      id: 'test',
      type: 'inputDialog',
      properties: {
        title: longText,
        message: longText,
        inputType: 'text',
      },
    }

    expect(component.properties.title).toHaveLength(10000)
  })

  it('should handle zero validation values', () => {
    const component: InputDialogComponent = {
      id: 'test',
      type: 'inputDialog',
      properties: {
        title: 'Test',
        message: 'Test',
        inputType: 'number',
        validation: {
          min: 0,
          max: 0,
          minLength: 0,
          maxLength: 0,
        },
      },
    }

    expect(component.properties.validation?.min).toBe(0)
    expect(component.properties.validation?.minLength).toBe(0)
  })

  it('should handle empty options array', () => {
    const component: ChoiceDialogComponent = {
      id: 'test',
      type: 'choiceDialog',
      properties: {
        title: 'Test',
        message: 'Test',
        options: [],
      },
    }

    expect(component.properties.options).toHaveLength(0)
  })

  it('should handle empty review data', () => {
    const component: ReviewDialogComponent = {
      id: 'test',
      type: 'reviewDialog',
      properties: {
        title: 'Test',
        message: 'Test',
        reviewData: {},
      },
    }

    expect(component.properties.reviewData).toEqual({})
  })
})
