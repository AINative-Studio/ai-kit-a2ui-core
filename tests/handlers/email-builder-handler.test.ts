/**
 * Email Builder Handler Tests
 * Comprehensive tests for EmailBuilderHandler class
 * Issue #51
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { EmailBuilderHandler } from '../../src/handlers/email-builder-handler.js'
import { A2UITransport } from '../../src/transport/index.js'
import { createEmptyEmailTemplate } from '../../src/types/email-builder-components.js'
import type {
  EmailTemplateSaveMessage,
  EmailTemplateLoadMessage,
  EmailTemplateDeleteMessage,
  EmailTemplateListMessage,
  EmailBlockAddMessage,
  EmailBlockUpdateMessage,
  EmailBlockDeleteMessage,
  EmailBlockReorderMessage,
  EmailVariableAddMessage,
  EmailVariableUpdateMessage,
  EmailVariableDeleteMessage,
  EmailThemeUpdateMessage,
  EmailTemplatePreviewMessage,
  EmailTemplateValidateMessage,
  EmailTemplateSendMessage,
  EmailTemplateTestSendMessage,
  EmailTemplateDuplicateMessage,
} from '../../src/types/index.js'

// Mock transport
class MockTransport extends A2UITransport {
  private handlers: Map<string, Function> = new Map()
  public sentMessages: any[] = []

  constructor() {
    super()
  }

  connect(): Promise<void> {
    return Promise.resolve()
  }

  disconnect(): Promise<void> {
    return Promise.resolve()
  }

  send(message: any): void {
    this.sentMessages.push(message)
  }

  on<T>(event: string, handler: (message: T) => void): void {
    this.handlers.set(event, handler)
  }

  emit<T>(event: string, message: T): void {
    const handler = this.handlers.get(event)
    if (handler) {
      handler(message)
    }
  }

  clearSentMessages(): void {
    this.sentMessages = []
  }
}

describe('EmailBuilderHandler', () => {
  let transport: MockTransport
  let handler: EmailBuilderHandler

  // Helper to create and save a template
  async function createTestTemplate(name: string): Promise<{ template: EmailTemplate; templateId: string }> {
    const template = createEmptyEmailTemplate(name)
    const saveMessage: EmailTemplateSaveMessage = {
      type: 'emailTemplateSave',
      componentId: 'test-setup',
      template,
      timestamp: Date.now(),
    }
    transport.emit('emailTemplateSave', saveMessage)
    await new Promise((resolve) => setTimeout(resolve, 10))

    const savedMessages = transport.sentMessages.filter((m) => m.type === 'emailTemplateSaved')
    const templateId = savedMessages[0].templateId

    transport.clearSentMessages()
    return { template, templateId }
  }

  beforeEach(() => {
    transport = new MockTransport()
    handler = new EmailBuilderHandler(transport, {
      autoSave: false,
      enableValidation: true,
    })
  })

  afterEach(() => {
    handler.destroy()
  })

  describe('Save Email Template', () => {
    it('saves a new template and sends saved message', async () => {
      const template = createEmptyEmailTemplate('Test Template')
      template.subject = 'Welcome Email'

      const saveMessage: EmailTemplateSaveMessage = {
        type: 'emailTemplateSave',
        componentId: 'editor-1',
        template,
        timestamp: Date.now(),
      }

      transport.emit('emailTemplateSave', saveMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const savedMessages = transport.sentMessages.filter((m) => m.type === 'emailTemplateSaved')
      expect(savedMessages).toHaveLength(1)
      expect(savedMessages[0].componentId).toBe('editor-1')
      expect(savedMessages[0].templateId).toBeDefined()
    })

    it('updates existing template when saveAsNew is false', async () => {
      const template = createEmptyEmailTemplate('Existing Template')

      const saveMessage: EmailTemplateSaveMessage = {
        type: 'emailTemplateSave',
        componentId: 'editor-1',
        template,
        saveAsNew: false,
        timestamp: Date.now(),
      }

      transport.emit('emailTemplateSave', saveMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const savedMessages = transport.sentMessages.filter((m) => m.type === 'emailTemplateSaved')
      expect(savedMessages).toHaveLength(1)
    })

    it('creates new template when saveAsNew is true', async () => {
      const template = createEmptyEmailTemplate('Template Copy')

      const saveMessage: EmailTemplateSaveMessage = {
        type: 'emailTemplateSave',
        componentId: 'editor-1',
        template,
        saveAsNew: true,
        timestamp: Date.now(),
      }

      transport.emit('emailTemplateSave', saveMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const savedMessages = transport.sentMessages.filter((m) => m.type === 'emailTemplateSaved')
      expect(savedMessages[0].templateId).not.toBe(template.id)
    })

    it('emits templateSaved event', async () => {
      const eventHandler = vi.fn()
      handler.on('templateSaved', eventHandler)

      const template = createEmptyEmailTemplate('Test')

      const saveMessage: EmailTemplateSaveMessage = {
        type: 'emailTemplateSave',
        componentId: 'editor-1',
        template,
        timestamp: Date.now(),
      }

      transport.emit('emailTemplateSave', saveMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(eventHandler).toHaveBeenCalled()
      expect(eventHandler.mock.calls[0][0].componentId).toBe('editor-1')
    })
  })

  describe('Load Email Template', () => {
    it('loads template and sends loaded message', async () => {
      const loadMessage: EmailTemplateLoadMessage = {
        type: 'emailTemplateLoad',
        componentId: 'editor-1',
        templateId: 'template-123',
        timestamp: Date.now(),
      }

      transport.emit('emailTemplateLoad', loadMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const loadedMessages = transport.sentMessages.filter((m) => m.type === 'emailTemplateLoaded')
      expect(loadedMessages).toHaveLength(1)
      expect(loadedMessages[0].templateId).toBe('template-123')
    })

    it('sends error when template not found', async () => {
      const loadMessage: EmailTemplateLoadMessage = {
        type: 'emailTemplateLoad',
        componentId: 'editor-1',
        templateId: 'non-existent',
        timestamp: Date.now(),
      }

      transport.emit('emailTemplateLoad', loadMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const errorMessages = transport.sentMessages.filter((m) => m.type === 'emailBuilderError')
      expect(errorMessages).toHaveLength(1)
      expect(errorMessages[0].errorCode).toBe('NOT_FOUND')
    })
  })

  describe('Delete Email Template', () => {
    it('deletes template and sends deleted message', async () => {
      const deleteMessage: EmailTemplateDeleteMessage = {
        type: 'emailTemplateDelete',
        componentId: 'list-1',
        templateId: 'template-456',
        timestamp: Date.now(),
      }

      transport.emit('emailTemplateDelete', deleteMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const deletedMessages = transport.sentMessages.filter((m) => m.type === 'emailTemplateDeleted')
      expect(deletedMessages).toHaveLength(1)
      expect(deletedMessages[0].templateId).toBe('template-456')
    })
  })

  describe('List Email Templates', () => {
    it('lists templates with filters', async () => {
      const listMessage: EmailTemplateListMessage = {
        type: 'emailTemplateList',
        componentId: 'list-1',
        category: 'onboarding',
        tags: ['welcome'],
        limit: 20,
        offset: 0,
        timestamp: Date.now(),
      }

      transport.emit('emailTemplateList', listMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const responseMessages = transport.sentMessages.filter(
        (m) => m.type === 'emailTemplateListResponse'
      )
      expect(responseMessages).toHaveLength(1)
      expect(responseMessages[0].templates).toBeDefined()
      expect(responseMessages[0].total).toBeDefined()
    })

    it('supports search query', async () => {
      const listMessage: EmailTemplateListMessage = {
        type: 'emailTemplateList',
        componentId: 'list-1',
        search: 'welcome',
        timestamp: Date.now(),
      }

      transport.emit('emailTemplateList', listMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const responseMessages = transport.sentMessages.filter(
        (m) => m.type === 'emailTemplateListResponse'
      )
      expect(responseMessages).toHaveLength(1)
    })
  })

  describe('Email Block Operations', () => {
    it('adds block to template', async () => {
      // First save a template
      const template = createEmptyEmailTemplate('Test Template')
      const saveMessage: EmailTemplateSaveMessage = {
        type: 'emailTemplateSave',
        componentId: 'editor-1',
        template,
        timestamp: Date.now(),
      }
      transport.emit('emailTemplateSave', saveMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const savedMessages = transport.sentMessages.filter((m) => m.type === 'emailTemplateSaved')
      const templateId = savedMessages[0].templateId

      transport.clearSentMessages()

      // Now add block
      const addMessage: EmailBlockAddMessage = {
        type: 'emailBlockAdd',
        componentId: 'editor-1',
        templateId,
        block: {
          type: 'text',
          id: 'block-1',
          content: 'Hello world',
        },
        position: 0,
        timestamp: Date.now(),
      }

      transport.emit('emailBlockAdd', addMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const addedMessages = transport.sentMessages.filter((m) => m.type === 'emailBlockAdded')
      expect(addedMessages).toHaveLength(1)
      expect(addedMessages[0].block.id).toBe('block-1')
    })

    it('updates existing block', async () => {
      const { templateId } = await createTestTemplate('Test Template')

      const updateMessage: EmailBlockUpdateMessage = {
        type: 'emailBlockUpdate',
        componentId: 'editor-1',
        templateId,
        blockId: 'block-1',
        block: {
          type: 'text',
          id: 'block-1',
          content: 'Updated content',
        },
        timestamp: Date.now(),
      }

      transport.emit('emailBlockUpdate', updateMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const updatedMessages = transport.sentMessages.filter((m) => m.type === 'emailBlockUpdated')
      expect(updatedMessages).toHaveLength(1)
      expect(updatedMessages[0].block.content).toBe('Updated content')
    })

    it('deletes block from template', async () => {
      const deleteMessage: EmailBlockDeleteMessage = {
        type: 'emailBlockDelete',
        componentId: 'editor-1',
        templateId: 'template-1',
        blockId: 'block-1',
        timestamp: Date.now(),
      }

      transport.emit('emailBlockDelete', deleteMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const deletedMessages = transport.sentMessages.filter((m) => m.type === 'emailBlockDeleted')
      expect(deletedMessages).toHaveLength(1)
      expect(deletedMessages[0].blockId).toBe('block-1')
    })

    it('reorders blocks in template', async () => {
      const reorderMessage: EmailBlockReorderMessage = {
        type: 'emailBlockReorder',
        componentId: 'editor-1',
        templateId: 'template-1',
        blockOrder: ['block-3', 'block-1', 'block-2'],
        timestamp: Date.now(),
      }

      transport.emit('emailBlockReorder', reorderMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const reorderedMessages = transport.sentMessages.filter((m) => m.type === 'emailBlockReordered')
      expect(reorderedMessages).toHaveLength(1)
      expect(reorderedMessages[0].blockOrder).toEqual(['block-3', 'block-1', 'block-2'])
    })
  })

  describe('Email Variable Operations', () => {
    it('adds variable to template', async () => {
      const addMessage: EmailVariableAddMessage = {
        type: 'emailVariableAdd',
        componentId: 'vars-1',
        templateId: 'template-1',
        variable: {
          id: 'userName',
          name: 'User Name',
          type: 'text',
          defaultValue: 'User',
        },
        timestamp: Date.now(),
      }

      transport.emit('emailVariableAdd', addMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const addedMessages = transport.sentMessages.filter((m) => m.type === 'emailVariableAdded')
      expect(addedMessages).toHaveLength(1)
      expect(addedMessages[0].variable.id).toBe('userName')
    })

    it('updates existing variable', async () => {
      const updateMessage: EmailVariableUpdateMessage = {
        type: 'emailVariableUpdate',
        componentId: 'vars-1',
        templateId: 'template-1',
        variableId: 'userName',
        variable: {
          id: 'userName',
          name: 'User Full Name',
          type: 'text',
          required: true,
        },
        timestamp: Date.now(),
      }

      transport.emit('emailVariableUpdate', updateMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const updatedMessages = transport.sentMessages.filter((m) => m.type === 'emailVariableUpdated')
      expect(updatedMessages).toHaveLength(1)
      expect(updatedMessages[0].variable.name).toBe('User Full Name')
    })

    it('deletes variable from template', async () => {
      const deleteMessage: EmailVariableDeleteMessage = {
        type: 'emailVariableDelete',
        componentId: 'vars-1',
        templateId: 'template-1',
        variableId: 'userName',
        timestamp: Date.now(),
      }

      transport.emit('emailVariableDelete', deleteMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const deletedMessages = transport.sentMessages.filter((m) => m.type === 'emailVariableDeleted')
      expect(deletedMessages).toHaveLength(1)
      expect(deletedMessages[0].variableId).toBe('userName')
    })
  })

  describe('Email Theme Operations', () => {
    it('updates template theme', async () => {
      const updateMessage: EmailThemeUpdateMessage = {
        type: 'emailThemeUpdate',
        componentId: 'editor-1',
        templateId: 'template-1',
        theme: {
          name: 'Dark Theme',
          mode: 'dark',
          primaryColor: '#3b82f6',
          secondaryColor: '#8b5cf6',
          backgroundColor: '#1f2937',
          textColor: '#f9fafb',
          fontFamily: 'Arial, sans-serif',
          linkColor: '#60a5fa',
          borderColor: '#374151',
        },
        timestamp: Date.now(),
      }

      transport.emit('emailThemeUpdate', updateMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const updatedMessages = transport.sentMessages.filter((m) => m.type === 'emailThemeUpdated')
      expect(updatedMessages).toHaveLength(1)
      expect(updatedMessages[0].theme.mode).toBe('dark')
    })
  })

  describe('Email Template Preview', () => {
    it('generates preview HTML', async () => {
      const template = createEmptyEmailTemplate('Preview Template')
      template.blocks = [
        {
          type: 'text',
          id: 'text-1',
          content: 'Hello {{name}}',
        },
      ]

      const previewMessage: EmailTemplatePreviewMessage = {
        type: 'emailTemplatePreview',
        componentId: 'preview-1',
        template,
        variables: { name: 'John Doe' },
        device: 'desktop',
        returnHtml: true,
        timestamp: Date.now(),
      }

      transport.emit('emailTemplatePreview', previewMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const responseMessages = transport.sentMessages.filter(
        (m) => m.type === 'emailTemplatePreviewResponse'
      )
      expect(responseMessages).toHaveLength(1)
      expect(responseMessages[0].html).toBeDefined()
      expect(responseMessages[0].html).toContain('Hello John Doe')
    })

    it('generates preview for different devices', async () => {
      const template = createEmptyEmailTemplate('Mobile Preview')

      const previewMessage: EmailTemplatePreviewMessage = {
        type: 'emailTemplatePreview',
        componentId: 'preview-1',
        template,
        variables: {},
        device: 'mobile',
        timestamp: Date.now(),
      }

      transport.emit('emailTemplatePreview', previewMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const responseMessages = transport.sentMessages.filter(
        (m) => m.type === 'emailTemplatePreviewResponse'
      )
      expect(responseMessages).toHaveLength(1)
      expect(responseMessages[0].device).toBe('mobile')
    })
  })

  describe('Email Template Validation', () => {
    it('validates template and returns validation result', async () => {
      const template = createEmptyEmailTemplate('Validation Test')

      const validateMessage: EmailTemplateValidateMessage = {
        type: 'emailTemplateValidate',
        componentId: 'editor-1',
        template,
        timestamp: Date.now(),
      }

      transport.emit('emailTemplateValidate', validateMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const responseMessages = transport.sentMessages.filter(
        (m) => m.type === 'emailTemplateValidationResponse'
      )
      expect(responseMessages).toHaveLength(1)
      expect(responseMessages[0].validation).toBeDefined()
      expect(responseMessages[0].validation.valid).toBeDefined()
    })

    it('detects missing subject', async () => {
      const template = createEmptyEmailTemplate('Invalid Template')
      template.subject = '' // Missing subject

      const validateMessage: EmailTemplateValidateMessage = {
        type: 'emailTemplateValidate',
        componentId: 'editor-1',
        template,
        timestamp: Date.now(),
      }

      transport.emit('emailTemplateValidate', validateMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const responseMessages = transport.sentMessages.filter(
        (m) => m.type === 'emailTemplateValidationResponse'
      )
      expect(responseMessages[0].validation.valid).toBe(false)
      expect(responseMessages[0].validation.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Email Template Send', () => {
    it('sends email and returns send result', async () => {
      const sendMessage: EmailTemplateSendMessage = {
        type: 'emailTemplateSend',
        componentId: 'send-1',
        template: 'template-123',
        recipients: [
          { email: 'user1@example.com', name: 'User 1' },
          { email: 'user2@example.com', name: 'User 2' },
        ],
        provider: 'resend',
        priority: 'normal',
        timestamp: Date.now(),
      }

      transport.emit('emailTemplateSend', sendMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const responseMessages = transport.sentMessages.filter(
        (m) => m.type === 'emailTemplateSendResponse'
      )
      expect(responseMessages).toHaveLength(1)
      expect(responseMessages[0].result).toBeDefined()
      expect(responseMessages[0].result.recipientCount).toBe(2)
    })

    it('validates recipients before sending', async () => {
      const sendMessage: EmailTemplateSendMessage = {
        type: 'emailTemplateSend',
        componentId: 'send-1',
        template: 'template-1',
        recipients: [{ email: 'invalid@' }], // Invalid email
        timestamp: Date.now(),
      }

      transport.emit('emailTemplateSend', sendMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const errorMessages = transport.sentMessages.filter((m) => m.type === 'emailBuilderError')
      expect(errorMessages.length).toBeGreaterThan(0)
    })
  })

  describe('Email Template Test Send', () => {
    it('sends test email', async () => {
      const template = createEmptyEmailTemplate('Test Email')

      const testSendMessage: EmailTemplateTestSendMessage = {
        type: 'emailTemplateTestSend',
        componentId: 'send-1',
        template,
        testEmail: 'test@example.com',
        variables: { name: 'Test User' },
        timestamp: Date.now(),
      }

      transport.emit('emailTemplateTestSend', testSendMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const responseMessages = transport.sentMessages.filter(
        (m) => m.type === 'emailTemplateTestSendResponse'
      )
      expect(responseMessages).toHaveLength(1)
      expect(responseMessages[0].result.recipientEmail).toBe('test@example.com')
    })
  })

  describe('Email Template Duplicate', () => {
    it('duplicates template with new name', async () => {
      const duplicateMessage: EmailTemplateDuplicateMessage = {
        type: 'emailTemplateDuplicate',
        componentId: 'list-1',
        templateId: 'template-1',
        newName: 'Template Copy',
        timestamp: Date.now(),
      }

      transport.emit('emailTemplateDuplicate', duplicateMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const duplicatedMessages = transport.sentMessages.filter(
        (m) => m.type === 'emailTemplateDuplicated'
      )
      expect(duplicatedMessages).toHaveLength(1)
      expect(duplicatedMessages[0].newTemplateId).toBeDefined()
      expect(duplicatedMessages[0].newTemplateId).not.toBe('template-1')
      expect(duplicatedMessages[0].template.metadata.name).toBe('Template Copy')
    })
  })

  describe('Auto-save', () => {
    it('auto-saves template after changes when enabled', async () => {
      handler.destroy()
      handler = new EmailBuilderHandler(transport, {
        autoSave: true,
        autoSaveDelay: 100,
      })

      const template = createEmptyEmailTemplate('Auto-save Test')

      const saveMessage: EmailTemplateSaveMessage = {
        type: 'emailTemplateSave',
        componentId: 'editor-1',
        template,
        timestamp: Date.now(),
      }

      transport.emit('emailTemplateSave', saveMessage)
      await new Promise((resolve) => setTimeout(resolve, 150))

      const savedMessages = transport.sentMessages.filter((m) => m.type === 'emailTemplateSaved')
      expect(savedMessages.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('sends error message on operation failure', async () => {
      const loadMessage: EmailTemplateLoadMessage = {
        type: 'emailTemplateLoad',
        componentId: 'editor-1',
        templateId: 'non-existent-template',
        timestamp: Date.now(),
      }

      transport.emit('emailTemplateLoad', loadMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const errorMessages = transport.sentMessages.filter((m) => m.type === 'emailBuilderError')
      expect(errorMessages).toHaveLength(1)
      expect(errorMessages[0].error).toBeDefined()
      expect(errorMessages[0].errorCode).toBeDefined()
    })
  })

  describe('Event Handlers', () => {
    it('registers and calls event handler', async () => {
      const eventHandler = vi.fn()
      handler.on('templateSaved', eventHandler)

      const template = createEmptyEmailTemplate('Event Test')

      const saveMessage: EmailTemplateSaveMessage = {
        type: 'emailTemplateSave',
        componentId: 'editor-1',
        template,
        timestamp: Date.now(),
      }

      transport.emit('emailTemplateSave', saveMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(eventHandler).toHaveBeenCalled()
    })

    it('unregisters event handler', async () => {
      const eventHandler = vi.fn()
      handler.on('templateSaved', eventHandler)
      handler.off('templateSaved', eventHandler)

      const template = createEmptyEmailTemplate('Unregister Test')

      const saveMessage: EmailTemplateSaveMessage = {
        type: 'emailTemplateSave',
        componentId: 'editor-1',
        template,
        timestamp: Date.now(),
      }

      transport.emit('emailTemplateSave', saveMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(eventHandler).not.toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    it('cleans up resources on destroy', () => {
      handler.destroy()
      expect(transport.sentMessages).toBeDefined()
    })
  })
})
