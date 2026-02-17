/**
 * Email Builder Component Tests
 * Comprehensive tests for email builder component types and helpers
 * Issue #51
 */

import { describe, it, expect } from 'vitest'
import type {
  ComponentType,
  EmailTemplateEditorComponent,
  EmailTemplatePreviewComponent,
  EmailTemplateSendComponent,
  EmailTemplateListComponent,
  EmailTemplateVariablesComponent,
  EmailBlockType,
  EmailVariableType,
  EmailProvider,
  EmailTemplate,
  EmailBlock,
  EmailVariable,
  EmailTheme,
} from '../../src/types/index.js'
import {
  DEFAULT_EMAIL_THEME,
  DEFAULT_EMAIL_TEMPLATE_METADATA,
  DEFAULT_EMAIL_TEMPLATE_EDITOR_PROPERTIES,
  DEFAULT_EMAIL_TEMPLATE_PREVIEW_PROPERTIES,
  DEFAULT_EMAIL_TEMPLATE_SEND_PROPERTIES,
  DEFAULT_EMAIL_TEMPLATE_LIST_PROPERTIES,
  isEmailTemplateEditorComponent,
  isEmailTemplatePreviewComponent,
  isEmailTemplateSendComponent,
  isEmailTemplateListComponent,
  isEmailTemplateVariablesComponent,
  createEmailTemplateEditor,
  createEmailTemplatePreview,
  createEmailTemplateSend,
  createEmailTemplateList,
  createEmailTemplateVariables,
  createEmptyEmailTemplate,
  isValidEmail,
  replaceVariables,
  extractVariables,
  templateToHtml,
} from '../../src/types/email-builder-components.js'

describe('Email Builder Component Types', () => {
  describe('ComponentType Union', () => {
    it('includes emailTemplateEditor in ComponentType union', () => {
      const type: ComponentType = 'emailTemplateEditor'
      expect(type).toBe('emailTemplateEditor')
    })

    it('includes emailTemplatePreview in ComponentType union', () => {
      const type: ComponentType = 'emailTemplatePreview'
      expect(type).toBe('emailTemplatePreview')
    })

    it('includes emailTemplateSend in ComponentType union', () => {
      const type: ComponentType = 'emailTemplateSend'
      expect(type).toBe('emailTemplateSend')
    })

    it('includes emailTemplateList in ComponentType union', () => {
      const type: ComponentType = 'emailTemplateList'
      expect(type).toBe('emailTemplateList')
    })

    it('includes emailTemplateVariables in ComponentType union', () => {
      const type: ComponentType = 'emailTemplateVariables'
      expect(type).toBe('emailTemplateVariables')
    })
  })

  describe('EmailTemplateEditor Component', () => {
    it('creates email template editor with minimal properties', () => {
      const component: EmailTemplateEditorComponent = {
        id: 'editor-1',
        type: 'emailTemplateEditor',
        properties: {},
      }

      expect(component.type).toBe('emailTemplateEditor')
      expect(component.id).toBe('editor-1')
    })

    it('creates email template editor with all properties', () => {
      const template = createEmptyEmailTemplate('Test Template')

      const component: EmailTemplateEditorComponent = {
        id: 'editor-2',
        type: 'emailTemplateEditor',
        properties: {
          template,
          availableBlocks: ['text', 'heading', 'image', 'button', 'divider'],
          themes: [DEFAULT_EMAIL_THEME],
          currentTheme: DEFAULT_EMAIL_THEME,
          variables: [
            { id: 'name', name: 'Name', type: 'text', defaultValue: 'User' },
            { id: 'email', name: 'Email', type: 'email', required: true },
          ],
          readonly: false,
          autoSave: true,
          autoSaveDelay: 2000,
          showBlockToolbar: true,
          showVariablePicker: true,
          enableDragDrop: true,
          enableUndo: true,
          maxUndoHistory: 50,
        },
      }

      expect(component.properties?.template).toBeDefined()
      expect(component.properties?.availableBlocks).toHaveLength(5)
      expect(component.properties?.variables).toHaveLength(2)
      expect(component.properties?.autoSave).toBe(true)
    })

    it('supports different block types', () => {
      const blockTypes: EmailBlockType[] = [
        'text',
        'heading',
        'image',
        'button',
        'divider',
        'spacer',
        'social',
        'video',
        'code',
        'html',
        'columns',
        'footer',
      ]

      blockTypes.forEach((blockType) => {
        expect(blockType).toBeDefined()
      })
    })
  })

  describe('EmailTemplatePreview Component', () => {
    it('creates email template preview with required properties', () => {
      const template = createEmptyEmailTemplate('Preview Template')

      const component: EmailTemplatePreviewComponent = {
        id: 'preview-1',
        type: 'emailTemplatePreview',
        properties: {
          template,
          device: 'desktop',
          variables: { name: 'John Doe', email: 'john@example.com' },
        },
      }

      expect(component.type).toBe('emailTemplatePreview')
      expect(component.properties.template).toBeDefined()
      expect(component.properties.device).toBe('desktop')
    })

    it('supports different device types', () => {
      const template = createEmptyEmailTemplate('Test')
      const devices = ['desktop', 'mobile', 'tablet'] as const

      devices.forEach((device) => {
        const component: EmailTemplatePreviewComponent = {
          id: `preview-${device}`,
          type: 'emailTemplatePreview',
          properties: {
            template,
            device,
          },
        }
        expect(component.properties.device).toBe(device)
      })
    })

    it('supports interactive mode and HTML source view', () => {
      const template = createEmptyEmailTemplate('Test')

      const component: EmailTemplatePreviewComponent = {
        id: 'preview-2',
        type: 'emailTemplatePreview',
        properties: {
          template,
          interactive: true,
          showHtmlSource: true,
          showTextVersion: true,
          enableDeviceSwitch: true,
        },
      }

      expect(component.properties.interactive).toBe(true)
      expect(component.properties.showHtmlSource).toBe(true)
    })
  })

  describe('EmailTemplateSend Component', () => {
    it('creates email template send with template', () => {
      const template = createEmptyEmailTemplate('Send Template')

      const component: EmailTemplateSendComponent = {
        id: 'send-1',
        type: 'emailTemplateSend',
        properties: {
          template,
          provider: 'resend',
          recipients: [
            { email: 'user1@example.com', name: 'User 1' },
            { email: 'user2@example.com', name: 'User 2' },
          ],
        },
      }

      expect(component.type).toBe('emailTemplateSend')
      expect(component.properties.template).toBeDefined()
      expect(component.properties.recipients).toHaveLength(2)
    })

    it('supports different email providers', () => {
      const template = createEmptyEmailTemplate('Test')
      const providers: EmailProvider[] = [
        'resend',
        'sendgrid',
        'ses',
        'smtp',
        'mailgun',
        'postmark',
      ]

      providers.forEach((provider) => {
        const component: EmailTemplateSendComponent = {
          id: `send-${provider}`,
          type: 'emailTemplateSend',
          properties: {
            template,
            provider,
          },
        }
        expect(component.properties.provider).toBe(provider)
      })
    })

    it('supports scheduling and priority', () => {
      const template = createEmptyEmailTemplate('Test')

      const component: EmailTemplateSendComponent = {
        id: 'send-2',
        type: 'emailTemplateSend',
        properties: {
          template,
          schedule: {
            sendAt: new Date('2025-01-01T10:00:00Z'),
            timezone: 'America/New_York',
            batchSize: 100,
            batchDelay: 5000,
          },
          priority: 'urgent',
          enableScheduling: true,
          enableTestSend: true,
        },
      }

      expect(component.properties.schedule?.sendAt).toBeInstanceOf(Date)
      expect(component.properties.priority).toBe('urgent')
      expect(component.properties.enableScheduling).toBe(true)
    })
  })

  describe('EmailTemplateList Component', () => {
    it('creates email template list with templates', () => {
      const component: EmailTemplateListComponent = {
        id: 'list-1',
        type: 'emailTemplateList',
        properties: {
          templates: [
            {
              id: 'template-1',
              name: 'Welcome Email',
              description: 'Welcome new users',
              category: 'onboarding',
              tags: ['welcome', 'new-user'],
              updatedAt: new Date(),
              isFavorite: true,
              usageCount: 150,
            },
            {
              id: 'template-2',
              name: 'Password Reset',
              description: 'Reset password email',
              category: 'security',
              tags: ['password', 'security'],
              updatedAt: new Date(),
              isFavorite: false,
              usageCount: 75,
            },
          ],
          enableSearch: true,
          enableFiltering: true,
          sortBy: 'usage',
          sortOrder: 'desc',
        },
      }

      expect(component.type).toBe('emailTemplateList')
      expect(component.properties?.templates).toHaveLength(2)
      expect(component.properties?.enableSearch).toBe(true)
    })

    it('supports different view modes and sorting', () => {
      const component: EmailTemplateListComponent = {
        id: 'list-2',
        type: 'emailTemplateList',
        properties: {
          viewMode: 'grid',
          sortBy: 'name',
          sortOrder: 'asc',
          itemsPerPage: 20,
          enablePagination: true,
          enableFavorites: true,
          showPreviewOnHover: true,
        },
      }

      expect(component.properties?.viewMode).toBe('grid')
      expect(component.properties?.sortBy).toBe('name')
      expect(component.properties?.enablePagination).toBe(true)
    })
  })

  describe('EmailTemplateVariables Component', () => {
    it('creates email template variables with variable definitions', () => {
      const variables: EmailVariable[] = [
        {
          id: 'firstName',
          name: 'First Name',
          type: 'text',
          defaultValue: 'User',
          required: true,
          example: 'John',
        },
        {
          id: 'orderTotal',
          name: 'Order Total',
          type: 'number',
          defaultValue: 0,
          example: '99.99',
        },
        {
          id: 'confirmationUrl',
          name: 'Confirmation URL',
          type: 'url',
          required: true,
          example: 'https://example.com/confirm',
        },
      ]

      const component: EmailTemplateVariablesComponent = {
        id: 'vars-1',
        type: 'emailTemplateVariables',
        properties: {
          variables,
          values: {
            firstName: 'Jane',
            orderTotal: 149.99,
            confirmationUrl: 'https://example.com/confirm/123',
          },
          enableCreation: true,
          enableEditing: true,
          enableDeletion: true,
        },
      }

      expect(component.type).toBe('emailTemplateVariables')
      expect(component.properties.variables).toHaveLength(3)
      expect(component.properties.values?.firstName).toBe('Jane')
    })

    it('supports different variable types', () => {
      const types: EmailVariableType[] = ['text', 'number', 'date', 'boolean', 'url', 'email']

      types.forEach((type) => {
        const variable: EmailVariable = {
          id: `var-${type}`,
          name: `Test ${type}`,
          type,
        }
        expect(variable.type).toBe(type)
      })
    })

    it('supports variable grouping and testing', () => {
      const component: EmailTemplateVariablesComponent = {
        id: 'vars-2',
        type: 'emailTemplateVariables',
        properties: {
          variables: [],
          groupByType: true,
          showExamples: true,
          enableTesting: true,
        },
      }

      expect(component.properties.groupByType).toBe(true)
      expect(component.properties.showExamples).toBe(true)
      expect(component.properties.enableTesting).toBe(true)
    })
  })

  describe('Type Guards', () => {
    it('identifies EmailTemplateEditorComponent', () => {
      const component: EmailTemplateEditorComponent = {
        id: 'editor-1',
        type: 'emailTemplateEditor',
      }

      expect(isEmailTemplateEditorComponent(component)).toBe(true)
      expect(isEmailTemplatePreviewComponent(component)).toBe(false)
    })

    it('identifies EmailTemplatePreviewComponent', () => {
      const template = createEmptyEmailTemplate('Test')
      const component: EmailTemplatePreviewComponent = {
        id: 'preview-1',
        type: 'emailTemplatePreview',
        properties: { template },
      }

      expect(isEmailTemplatePreviewComponent(component)).toBe(true)
      expect(isEmailTemplateEditorComponent(component)).toBe(false)
    })

    it('identifies EmailTemplateSendComponent', () => {
      const template = createEmptyEmailTemplate('Test')
      const component: EmailTemplateSendComponent = {
        id: 'send-1',
        type: 'emailTemplateSend',
        properties: { template },
      }

      expect(isEmailTemplateSendComponent(component)).toBe(true)
      expect(isEmailTemplateListComponent(component)).toBe(false)
    })

    it('identifies EmailTemplateListComponent', () => {
      const component: EmailTemplateListComponent = {
        id: 'list-1',
        type: 'emailTemplateList',
      }

      expect(isEmailTemplateListComponent(component)).toBe(true)
      expect(isEmailTemplateVariablesComponent(component)).toBe(false)
    })

    it('identifies EmailTemplateVariablesComponent', () => {
      const component: EmailTemplateVariablesComponent = {
        id: 'vars-1',
        type: 'emailTemplateVariables',
        properties: { variables: [] },
      }

      expect(isEmailTemplateVariablesComponent(component)).toBe(true)
      expect(isEmailTemplateSendComponent(component)).toBe(false)
    })
  })

  describe('Component Helpers', () => {
    it('creates email template editor with helper', () => {
      const template = createEmptyEmailTemplate('Test Template')
      const component = createEmailTemplateEditor('editor-1', template, {
        readonly: true,
        autoSave: false,
      })

      expect(component.id).toBe('editor-1')
      expect(component.type).toBe('emailTemplateEditor')
      expect(component.properties?.template).toBe(template)
      expect(component.properties?.readonly).toBe(true)
    })

    it('creates email template preview with helper', () => {
      const template = createEmptyEmailTemplate('Test Template')
      const component = createEmailTemplatePreview('preview-1', template, {
        device: 'mobile',
      })

      expect(component.id).toBe('preview-1')
      expect(component.type).toBe('emailTemplatePreview')
      expect(component.properties.device).toBe('mobile')
    })

    it('creates email template send with helper', () => {
      const template = createEmptyEmailTemplate('Test Template')
      const component = createEmailTemplateSend('send-1', template, {
        provider: 'sendgrid',
      })

      expect(component.id).toBe('send-1')
      expect(component.type).toBe('emailTemplateSend')
      expect(component.properties.provider).toBe('sendgrid')
    })

    it('creates email template list with helper', () => {
      const templates = [
        {
          id: 'template-1',
          name: 'Template 1',
          updatedAt: new Date(),
        },
      ]
      const component = createEmailTemplateList('list-1', templates, {
        viewMode: 'list',
      })

      expect(component.id).toBe('list-1')
      expect(component.type).toBe('emailTemplateList')
      expect(component.properties?.templates).toHaveLength(1)
      expect(component.properties?.viewMode).toBe('list')
    })

    it('creates email template variables with helper', () => {
      const variables: EmailVariable[] = [
        { id: 'name', name: 'Name', type: 'text' },
      ]
      const component = createEmailTemplateVariables('vars-1', variables, {
        groupByType: true,
      })

      expect(component.id).toBe('vars-1')
      expect(component.type).toBe('emailTemplateVariables')
      expect(component.properties.variables).toHaveLength(1)
      expect(component.properties.groupByType).toBe(true)
    })
  })

  describe('Email Template Helpers', () => {
    it('creates empty email template', () => {
      const template = createEmptyEmailTemplate('My Template')

      expect(template.id).toBeDefined()
      expect(template.metadata.name).toBe('My Template')
      expect(template.subject).toBe('')
      expect(template.blocks).toEqual([])
      expect(template.variables).toEqual([])
      expect(template.theme).toBeDefined()
      expect(template.metadata.createdAt).toBeInstanceOf(Date)
    })

    it('validates email addresses correctly', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true)
      expect(isValidEmail('invalid@')).toBe(false)
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('user @example.com')).toBe(false)
    })

    it('replaces variables in text', () => {
      const text = 'Hello {{name}}, your order total is {{total}}.'
      const variables = { name: 'John Doe', total: '$99.99' }
      const result = replaceVariables(text, variables)

      expect(result).toBe('Hello John Doe, your order total is $99.99.')
    })

    it('handles missing variables in replacement', () => {
      const text = 'Hello {{name}}, welcome to {{company}}.'
      const variables = { name: 'Jane' }
      const result = replaceVariables(text, variables)

      expect(result).toBe('Hello Jane, welcome to {{company}}.')
    })

    it('extracts variables from text', () => {
      const text = 'Hi {{firstName}} {{lastName}}, your email is {{email}}.'
      const variables = extractVariables(text)

      expect(variables).toEqual(['firstName', 'lastName', 'email'])
    })

    it('extracts unique variables only', () => {
      const text = 'Hello {{name}}, goodbye {{name}}.'
      const variables = extractVariables(text)

      expect(variables).toEqual(['name'])
    })

    it('handles text with no variables', () => {
      const text = 'Hello world, no variables here.'
      const variables = extractVariables(text)

      expect(variables).toEqual([])
    })
  })

  describe('Email Block Types', () => {
    it('creates text block', () => {
      const block: EmailBlock = {
        type: 'text',
        id: 'block-1',
        content: 'Hello {{name}}',
        styles: {
          fontSize: '16px',
          color: '#333333',
        },
      }

      expect(block.type).toBe('text')
      expect(block.content).toBe('Hello {{name}}')
    })

    it('creates heading block', () => {
      const block: EmailBlock = {
        type: 'heading',
        id: 'block-2',
        level: 1,
        content: 'Welcome',
      }

      expect(block.type).toBe('heading')
      expect(block.level).toBe(1)
    })

    it('creates image block', () => {
      const block: EmailBlock = {
        type: 'image',
        id: 'block-3',
        src: 'https://example.com/image.jpg',
        alt: 'Example image',
        href: 'https://example.com',
        target: '_blank',
      }

      expect(block.type).toBe('image')
      expect(block.src).toBe('https://example.com/image.jpg')
    })

    it('creates button block', () => {
      const block: EmailBlock = {
        type: 'button',
        id: 'block-4',
        text: 'Click Here',
        href: 'https://example.com/action',
        backgroundColor: '#3b82f6',
        textColor: '#ffffff',
      }

      expect(block.type).toBe('button')
      expect(block.text).toBe('Click Here')
    })

    it('creates divider block', () => {
      const block: EmailBlock = {
        type: 'divider',
        id: 'block-5',
        color: '#e5e7eb',
        height: '2px',
      }

      expect(block.type).toBe('divider')
    })

    it('creates social block', () => {
      const block: EmailBlock = {
        type: 'social',
        id: 'block-6',
        links: [
          { platform: 'facebook', url: 'https://facebook.com/example' },
          { platform: 'twitter', url: 'https://twitter.com/example' },
        ],
        iconSize: '32px',
      }

      expect(block.type).toBe('social')
      expect(block.links).toHaveLength(2)
    })

    it('creates columns block', () => {
      const block: EmailBlock = {
        type: 'columns',
        id: 'block-7',
        columns: [
          {
            id: 'col-1',
            width: '50%',
            blocks: [
              {
                type: 'text',
                id: 'text-1',
                content: 'Left column',
              },
            ],
          },
          {
            id: 'col-2',
            width: '50%',
            blocks: [
              {
                type: 'text',
                id: 'text-2',
                content: 'Right column',
              },
            ],
          },
        ],
        stackOnMobile: true,
      }

      expect(block.type).toBe('columns')
      expect(block.columns).toHaveLength(2)
      expect(block.stackOnMobile).toBe(true)
    })
  })

  describe('Email Theme', () => {
    it('has default theme with all required properties', () => {
      expect(DEFAULT_EMAIL_THEME.name).toBe('Default')
      expect(DEFAULT_EMAIL_THEME.mode).toBe('light')
      expect(DEFAULT_EMAIL_THEME.primaryColor).toBeDefined()
      expect(DEFAULT_EMAIL_THEME.backgroundColor).toBeDefined()
      expect(DEFAULT_EMAIL_THEME.textColor).toBeDefined()
      expect(DEFAULT_EMAIL_THEME.fontFamily).toBeDefined()
      expect(DEFAULT_EMAIL_THEME.containerMaxWidth).toBe('600px')
    })

    it('creates custom theme', () => {
      const theme: EmailTheme = {
        name: 'Dark Theme',
        mode: 'dark',
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        backgroundColor: '#1f2937',
        textColor: '#f9fafb',
        fontFamily: 'Arial, sans-serif',
        linkColor: '#60a5fa',
        borderColor: '#374151',
        button: {
          backgroundColor: '#3b82f6',
          textColor: '#ffffff',
          borderRadius: '8px',
        },
        containerMaxWidth: '700px',
      }

      expect(theme.mode).toBe('dark')
      expect(theme.backgroundColor).toBe('#1f2937')
    })
  })

  describe('Template to HTML Conversion', () => {
    it('converts template with text block to HTML', () => {
      const template: EmailTemplate = {
        id: 'template-1',
        subject: 'Test Email',
        blocks: [
          {
            type: 'text',
            id: 'text-1',
            content: 'Hello {{name}}',
          },
        ],
        variables: [{ id: 'name', name: 'Name', type: 'text' }],
        metadata: {
          name: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const html = templateToHtml(template, { name: 'John' })

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('Hello John')
      expect(html).toContain('Test Email')
    })

    it('converts template with heading block to HTML', () => {
      const template: EmailTemplate = {
        id: 'template-2',
        subject: 'Welcome',
        blocks: [
          {
            type: 'heading',
            id: 'heading-1',
            level: 1,
            content: 'Welcome {{name}}!',
          },
        ],
        variables: [],
        metadata: {
          name: 'Welcome',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const html = templateToHtml(template, { name: 'Jane' })

      expect(html).toContain('<h1')
      expect(html).toContain('Welcome Jane!')
    })

    it('converts template with button block to HTML', () => {
      const template: EmailTemplate = {
        id: 'template-3',
        subject: 'Action Required',
        blocks: [
          {
            type: 'button',
            id: 'button-1',
            text: 'Click Here',
            href: 'https://example.com',
            backgroundColor: '#3b82f6',
            textColor: '#ffffff',
          },
        ],
        variables: [],
        metadata: {
          name: 'Action',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const html = templateToHtml(template)

      expect(html).toContain('<a href="https://example.com"')
      expect(html).toContain('Click Here')
      expect(html).toContain('background-color: #3b82f6')
    })

    it('applies theme to HTML output', () => {
      const customTheme: EmailTheme = {
        ...DEFAULT_EMAIL_THEME,
        backgroundColor: '#f0f0f0',
        textColor: '#222222',
        containerMaxWidth: '700px',
      }

      const template: EmailTemplate = {
        id: 'template-4',
        subject: 'Themed Email',
        blocks: [
          {
            type: 'text',
            id: 'text-1',
            content: 'Themed content',
          },
        ],
        variables: [],
        theme: customTheme,
        metadata: {
          name: 'Themed',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const html = templateToHtml(template)

      expect(html).toContain('background-color: #f0f0f0')
      expect(html).toContain('color: #222222')
      expect(html).toContain('max-width: 700px')
    })
  })

  describe('Default Properties', () => {
    it('has default editor properties', () => {
      expect(DEFAULT_EMAIL_TEMPLATE_EDITOR_PROPERTIES.autoSave).toBe(true)
      expect(DEFAULT_EMAIL_TEMPLATE_EDITOR_PROPERTIES.autoSaveDelay).toBe(2000)
      expect(DEFAULT_EMAIL_TEMPLATE_EDITOR_PROPERTIES.enableDragDrop).toBe(true)
      expect(DEFAULT_EMAIL_TEMPLATE_EDITOR_PROPERTIES.enableUndo).toBe(true)
    })

    it('has default preview properties', () => {
      expect(DEFAULT_EMAIL_TEMPLATE_PREVIEW_PROPERTIES.device).toBe('desktop')
      expect(DEFAULT_EMAIL_TEMPLATE_PREVIEW_PROPERTIES.enableDeviceSwitch).toBe(true)
      expect(DEFAULT_EMAIL_TEMPLATE_PREVIEW_PROPERTIES.showHtmlSource).toBe(false)
    })

    it('has default send properties', () => {
      expect(DEFAULT_EMAIL_TEMPLATE_SEND_PROPERTIES.provider).toBe('resend')
      expect(DEFAULT_EMAIL_TEMPLATE_SEND_PROPERTIES.maxRecipients).toBe(1000)
      expect(DEFAULT_EMAIL_TEMPLATE_SEND_PROPERTIES.priority).toBe('normal')
      expect(DEFAULT_EMAIL_TEMPLATE_SEND_PROPERTIES.enableScheduling).toBe(true)
    })

    it('has default list properties', () => {
      expect(DEFAULT_EMAIL_TEMPLATE_LIST_PROPERTIES.enableSearch).toBe(true)
      expect(DEFAULT_EMAIL_TEMPLATE_LIST_PROPERTIES.sortBy).toBe('updated')
      expect(DEFAULT_EMAIL_TEMPLATE_LIST_PROPERTIES.sortOrder).toBe('desc')
      expect(DEFAULT_EMAIL_TEMPLATE_LIST_PROPERTIES.viewMode).toBe('grid')
    })
  })
})
