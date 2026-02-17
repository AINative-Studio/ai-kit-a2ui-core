/**
 * Email Builder Message Tests
 * Comprehensive tests for email builder message types and helpers
 * Issue #51
 */

import { describe, it, expect } from 'vitest'
import type {
  EmailTemplateSaveMessage,
  EmailTemplateLoadMessage,
  EmailTemplateDeleteMessage,
  EmailTemplateListMessage,
  EmailTemplateSendMessage,
  EmailTemplateTestSendMessage,
  EmailTemplatePreviewMessage,
  EmailBlockAddMessage,
  EmailBlockUpdateMessage,
  EmailBlockDeleteMessage,
  EmailVariableAddMessage,
  EmailBuilderMessage,
} from '../../src/types/index.js'
import {
  isEmailTemplateSaveMessage,
  isEmailTemplateLoadMessage,
  isEmailTemplateDeleteMessage,
  isEmailTemplateListMessage,
  isEmailTemplateSendMessage,
  isEmailTemplateTestSendMessage,
  isEmailTemplatePreviewMessage,
  isEmailBlockAddMessage,
  isEmailBlockUpdateMessage,
  isEmailBlockDeleteMessage,
  isEmailVariableAddMessage,
  isEmailBuilderErrorMessage,
  createEmailTemplateSaveMessage,
  createEmailTemplateSendMessage,
  createEmailTemplatePreviewMessage,
} from '../../src/types/email-builder-messages.js'
import { createEmptyEmailTemplate } from '../../src/types/email-builder-components.js'

describe('Email Builder Message Types', () => {
  describe('Email Template Save Messages', () => {
    it('creates email template save message', () => {
      const template = createEmptyEmailTemplate('Test Template')

      const message: EmailTemplateSaveMessage = {
        type: 'emailTemplateSave',
        componentId: 'editor-1',
        template,
        saveAsNew: false,
        timestamp: Date.now(),
      }

      expect(message.type).toBe('emailTemplateSave')
      expect(message.componentId).toBe('editor-1')
      expect(message.template).toBe(template)
      expect(message.saveAsNew).toBe(false)
    })

    it('creates save as new template message', () => {
      const template = createEmptyEmailTemplate('Copy Template')

      const message: EmailTemplateSaveMessage = {
        type: 'emailTemplateSave',
        componentId: 'editor-1',
        template,
        saveAsNew: true,
        timestamp: Date.now(),
      }

      expect(message.saveAsNew).toBe(true)
    })
  })

  describe('Email Template Load Messages', () => {
    it('creates email template load message', () => {
      const message: EmailTemplateLoadMessage = {
        type: 'emailTemplateLoad',
        componentId: 'editor-1',
        templateId: 'template-123',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('emailTemplateLoad')
      expect(message.templateId).toBe('template-123')
    })
  })

  describe('Email Template Delete Messages', () => {
    it('creates email template delete message', () => {
      const message: EmailTemplateDeleteMessage = {
        type: 'emailTemplateDelete',
        componentId: 'list-1',
        templateId: 'template-456',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('emailTemplateDelete')
      expect(message.templateId).toBe('template-456')
    })
  })

  describe('Email Template List Messages', () => {
    it('creates email template list message with filters', () => {
      const message: EmailTemplateListMessage = {
        type: 'emailTemplateList',
        componentId: 'list-1',
        category: 'onboarding',
        tags: ['welcome', 'new-user'],
        search: 'welcome',
        sortBy: 'updated',
        sortOrder: 'desc',
        limit: 20,
        offset: 0,
        timestamp: Date.now(),
      }

      expect(message.type).toBe('emailTemplateList')
      expect(message.category).toBe('onboarding')
      expect(message.tags).toHaveLength(2)
      expect(message.search).toBe('welcome')
    })

    it('creates list message with pagination', () => {
      const message: EmailTemplateListMessage = {
        type: 'emailTemplateList',
        componentId: 'list-1',
        limit: 50,
        offset: 100,
        timestamp: Date.now(),
      }

      expect(message.limit).toBe(50)
      expect(message.offset).toBe(100)
    })
  })

  describe('Email Block Messages', () => {
    it('creates email block add message', () => {
      const message: EmailBlockAddMessage = {
        type: 'emailBlockAdd',
        componentId: 'editor-1',
        templateId: 'template-1',
        block: {
          type: 'text',
          id: 'block-1',
          content: 'Hello world',
        },
        position: 0,
        timestamp: Date.now(),
      }

      expect(message.type).toBe('emailBlockAdd')
      expect(message.block.type).toBe('text')
      expect(message.position).toBe(0)
    })

    it('creates email block update message', () => {
      const message: EmailBlockUpdateMessage = {
        type: 'emailBlockUpdate',
        componentId: 'editor-1',
        templateId: 'template-1',
        blockId: 'block-1',
        block: {
          type: 'heading',
          id: 'block-1',
          level: 1,
          content: 'Updated heading',
        },
        timestamp: Date.now(),
      }

      expect(message.type).toBe('emailBlockUpdate')
      expect(message.blockId).toBe('block-1')
      expect(message.block.type).toBe('heading')
    })

    it('creates email block delete message', () => {
      const message: EmailBlockDeleteMessage = {
        type: 'emailBlockDelete',
        componentId: 'editor-1',
        templateId: 'template-1',
        blockId: 'block-2',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('emailBlockDelete')
      expect(message.blockId).toBe('block-2')
    })
  })

  describe('Email Variable Messages', () => {
    it('creates email variable add message', () => {
      const message: EmailVariableAddMessage = {
        type: 'emailVariableAdd',
        componentId: 'vars-1',
        templateId: 'template-1',
        variable: {
          id: 'userName',
          name: 'User Name',
          type: 'text',
          defaultValue: 'User',
          required: true,
        },
        timestamp: Date.now(),
      }

      expect(message.type).toBe('emailVariableAdd')
      expect(message.variable.id).toBe('userName')
      expect(message.variable.required).toBe(true)
    })
  })

  describe('Email Template Preview Messages', () => {
    it('creates email template preview message', () => {
      const template = createEmptyEmailTemplate('Preview Template')

      const message: EmailTemplatePreviewMessage = {
        type: 'emailTemplatePreview',
        componentId: 'preview-1',
        template,
        variables: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        device: 'desktop',
        returnHtml: true,
        timestamp: Date.now(),
      }

      expect(message.type).toBe('emailTemplatePreview')
      expect(message.device).toBe('desktop')
      expect(message.variables.name).toBe('John Doe')
      expect(message.returnHtml).toBe(true)
    })

    it('creates preview message for mobile device', () => {
      const template = createEmptyEmailTemplate('Mobile Preview')

      const message: EmailTemplatePreviewMessage = {
        type: 'emailTemplatePreview',
        componentId: 'preview-1',
        template,
        variables: {},
        device: 'mobile',
        timestamp: Date.now(),
      }

      expect(message.device).toBe('mobile')
    })
  })

  describe('Email Template Send Messages', () => {
    it('creates email template send message with template ID', () => {
      const message: EmailTemplateSendMessage = {
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

      expect(message.type).toBe('emailTemplateSend')
      expect(message.template).toBe('template-123')
      expect(message.recipients).toHaveLength(2)
      expect(message.provider).toBe('resend')
    })

    it('creates send message with template object', () => {
      const template = createEmptyEmailTemplate('Send Template')

      const message: EmailTemplateSendMessage = {
        type: 'emailTemplateSend',
        componentId: 'send-1',
        template,
        recipients: [{ email: 'test@example.com' }],
        timestamp: Date.now(),
      }

      expect(typeof message.template).toBe('object')
      expect(message.recipients).toHaveLength(1)
    })

    it('creates send message with schedule', () => {
      const message: EmailTemplateSendMessage = {
        type: 'emailTemplateSend',
        componentId: 'send-1',
        template: 'template-1',
        recipients: [{ email: 'user@example.com' }],
        schedule: {
          sendAt: new Date('2025-01-01T10:00:00Z'),
          timezone: 'America/New_York',
          batchSize: 100,
          batchDelay: 5000,
        },
        timestamp: Date.now(),
      }

      expect(message.schedule?.sendAt).toBeInstanceOf(Date)
      expect(message.schedule?.timezone).toBe('America/New_York')
      expect(message.schedule?.batchSize).toBe(100)
    })

    it('creates send message with tracking options', () => {
      const message: EmailTemplateSendMessage = {
        type: 'emailTemplateSend',
        componentId: 'send-1',
        template: 'template-1',
        recipients: [{ email: 'user@example.com' }],
        tracking: {
          trackOpens: true,
          trackClicks: true,
        },
        timestamp: Date.now(),
      }

      expect(message.tracking?.trackOpens).toBe(true)
      expect(message.tracking?.trackClicks).toBe(true)
    })
  })

  describe('Email Template Test Send Messages', () => {
    it('creates email template test send message', () => {
      const template = createEmptyEmailTemplate('Test Template')

      const message: EmailTemplateTestSendMessage = {
        type: 'emailTemplateTestSend',
        componentId: 'send-1',
        template,
        testEmail: 'test@example.com',
        variables: {
          name: 'Test User',
          orderTotal: 99.99,
        },
        provider: 'resend',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('emailTemplateTestSend')
      expect(message.testEmail).toBe('test@example.com')
      expect(message.variables?.name).toBe('Test User')
    })
  })

  describe('Type Guards', () => {
    it('identifies email template save message', () => {
      const template = createEmptyEmailTemplate('Test')
      const message: EmailTemplateSaveMessage = {
        type: 'emailTemplateSave',
        componentId: 'editor-1',
        template,
        timestamp: Date.now(),
      }

      expect(isEmailTemplateSaveMessage(message)).toBe(true)
      expect(isEmailTemplateLoadMessage(message)).toBe(false)
    })

    it('identifies email template load message', () => {
      const message: EmailTemplateLoadMessage = {
        type: 'emailTemplateLoad',
        componentId: 'editor-1',
        templateId: 'template-1',
        timestamp: Date.now(),
      }

      expect(isEmailTemplateLoadMessage(message)).toBe(true)
      expect(isEmailTemplateSaveMessage(message)).toBe(false)
    })

    it('identifies email template delete message', () => {
      const message: EmailTemplateDeleteMessage = {
        type: 'emailTemplateDelete',
        componentId: 'list-1',
        templateId: 'template-1',
        timestamp: Date.now(),
      }

      expect(isEmailTemplateDeleteMessage(message)).toBe(true)
      expect(isEmailTemplateListMessage(message)).toBe(false)
    })

    it('identifies email template list message', () => {
      const message: EmailTemplateListMessage = {
        type: 'emailTemplateList',
        componentId: 'list-1',
        timestamp: Date.now(),
      }

      expect(isEmailTemplateListMessage(message)).toBe(true)
      expect(isEmailTemplateDeleteMessage(message)).toBe(false)
    })

    it('identifies email template send message', () => {
      const message: EmailTemplateSendMessage = {
        type: 'emailTemplateSend',
        componentId: 'send-1',
        template: 'template-1',
        recipients: [{ email: 'test@example.com' }],
        timestamp: Date.now(),
      }

      expect(isEmailTemplateSendMessage(message)).toBe(true)
      expect(isEmailTemplateTestSendMessage(message)).toBe(false)
    })

    it('identifies email template test send message', () => {
      const template = createEmptyEmailTemplate('Test')
      const message: EmailTemplateTestSendMessage = {
        type: 'emailTemplateTestSend',
        componentId: 'send-1',
        template,
        testEmail: 'test@example.com',
        timestamp: Date.now(),
      }

      expect(isEmailTemplateTestSendMessage(message)).toBe(true)
      expect(isEmailTemplateSendMessage(message)).toBe(false)
    })

    it('identifies email template preview message', () => {
      const template = createEmptyEmailTemplate('Preview')
      const message: EmailTemplatePreviewMessage = {
        type: 'emailTemplatePreview',
        componentId: 'preview-1',
        template,
        variables: {},
        device: 'desktop',
        timestamp: Date.now(),
      }

      expect(isEmailTemplatePreviewMessage(message)).toBe(true)
      expect(isEmailTemplateSendMessage(message)).toBe(false)
    })

    it('identifies email block add message', () => {
      const message: EmailBlockAddMessage = {
        type: 'emailBlockAdd',
        componentId: 'editor-1',
        templateId: 'template-1',
        block: {
          type: 'text',
          id: 'block-1',
          content: 'Test',
        },
        timestamp: Date.now(),
      }

      expect(isEmailBlockAddMessage(message)).toBe(true)
      expect(isEmailBlockUpdateMessage(message)).toBe(false)
    })

    it('identifies email block update message', () => {
      const message: EmailBlockUpdateMessage = {
        type: 'emailBlockUpdate',
        componentId: 'editor-1',
        templateId: 'template-1',
        blockId: 'block-1',
        block: {
          type: 'text',
          id: 'block-1',
          content: 'Updated',
        },
        timestamp: Date.now(),
      }

      expect(isEmailBlockUpdateMessage(message)).toBe(true)
      expect(isEmailBlockDeleteMessage(message)).toBe(false)
    })

    it('identifies email block delete message', () => {
      const message: EmailBlockDeleteMessage = {
        type: 'emailBlockDelete',
        componentId: 'editor-1',
        templateId: 'template-1',
        blockId: 'block-1',
        timestamp: Date.now(),
      }

      expect(isEmailBlockDeleteMessage(message)).toBe(true)
      expect(isEmailBlockAddMessage(message)).toBe(false)
    })

    it('identifies email variable add message', () => {
      const message: EmailVariableAddMessage = {
        type: 'emailVariableAdd',
        componentId: 'vars-1',
        templateId: 'template-1',
        variable: {
          id: 'test',
          name: 'Test',
          type: 'text',
        },
        timestamp: Date.now(),
      }

      expect(isEmailVariableAddMessage(message)).toBe(true)
      expect(isEmailBlockAddMessage(message)).toBe(false)
    })

    it('identifies email builder error message', () => {
      const message = {
        type: 'emailBuilderError',
        componentId: 'editor-1',
        error: 'Failed to save template',
        errorCode: 'OPERATION_FAILED',
        timestamp: Date.now(),
      }

      expect(isEmailBuilderErrorMessage(message)).toBe(true)
      expect(isEmailTemplateSaveMessage(message)).toBe(false)
    })

    it('returns false for non-message objects', () => {
      const notAMessage = { foo: 'bar' }

      expect(isEmailTemplateSaveMessage(notAMessage)).toBe(false)
      expect(isEmailTemplateLoadMessage(notAMessage)).toBe(false)
      expect(isEmailTemplateSendMessage(notAMessage)).toBe(false)
    })

    it('returns false for null and undefined', () => {
      expect(isEmailTemplateSaveMessage(null)).toBe(false)
      expect(isEmailTemplateSaveMessage(undefined)).toBe(false)
    })
  })

  describe('Message Helpers', () => {
    it('creates email template save message with helper', () => {
      const template = createEmptyEmailTemplate('Test Template')
      const message = createEmailTemplateSaveMessage('editor-1', template, false)

      expect(message.type).toBe('emailTemplateSave')
      expect(message.componentId).toBe('editor-1')
      expect(message.template).toBe(template)
      expect(message.saveAsNew).toBe(false)
      expect(message.timestamp).toBeDefined()
    })

    it('creates email template send message with helper', () => {
      const recipients = [
        { email: 'user1@example.com', name: 'User 1' },
        { email: 'user2@example.com', name: 'User 2' },
      ]

      const message = createEmailTemplateSendMessage('send-1', 'template-123', recipients, {
        provider: 'sendgrid',
        priority: 'high',
      })

      expect(message.type).toBe('emailTemplateSend')
      expect(message.componentId).toBe('send-1')
      expect(message.template).toBe('template-123')
      expect(message.recipients).toHaveLength(2)
      expect(message.provider).toBe('sendgrid')
      expect(message.priority).toBe('high')
    })

    it('creates email template preview message with helper', () => {
      const template = createEmptyEmailTemplate('Preview')
      const variables = { name: 'John', email: 'john@example.com' }

      const message = createEmailTemplatePreviewMessage('preview-1', template, variables, 'mobile')

      expect(message.type).toBe('emailTemplatePreview')
      expect(message.componentId).toBe('preview-1')
      expect(message.template).toBe(template)
      expect(message.variables).toEqual(variables)
      expect(message.device).toBe('mobile')
      expect(message.timestamp).toBeDefined()
    })

    it('creates preview message with default device', () => {
      const template = createEmptyEmailTemplate('Preview')
      const message = createEmailTemplatePreviewMessage('preview-1', template, {})

      expect(message.device).toBe('desktop')
    })
  })

  describe('Email Send Result', () => {
    it('validates email send result structure', () => {
      const result = {
        jobId: 'job-123',
        status: 'sent' as const,
        recipientCount: 100,
        provider: 'resend' as const,
      }

      expect(result.jobId).toBe('job-123')
      expect(result.status).toBe('sent')
      expect(result.recipientCount).toBe(100)
    })

    it('validates scheduled send result', () => {
      const result = {
        jobId: 'job-456',
        status: 'scheduled' as const,
        recipientCount: 50,
        scheduledAt: new Date('2025-01-01T10:00:00Z'),
        provider: 'sendgrid' as const,
      }

      expect(result.status).toBe('scheduled')
      expect(result.scheduledAt).toBeInstanceOf(Date)
    })
  })

  describe('Email Test Result', () => {
    it('validates email test result structure', () => {
      const result = {
        testId: 'test-123',
        status: 'success' as const,
        recipientEmail: 'test@example.com',
        sentAt: new Date(),
      }

      expect(result.testId).toBe('test-123')
      expect(result.status).toBe('success')
      expect(result.recipientEmail).toBe('test@example.com')
      expect(result.sentAt).toBeInstanceOf(Date)
    })

    it('validates failed test result', () => {
      const result = {
        testId: 'test-456',
        status: 'failed' as const,
        recipientEmail: 'invalid@',
        sentAt: new Date(),
        error: 'Invalid email address',
      }

      expect(result.status).toBe('failed')
      expect(result.error).toBe('Invalid email address')
    })
  })

  describe('Email Template Validation', () => {
    it('validates template validation result structure', () => {
      const validation = {
        valid: false,
        errors: [
          {
            field: 'subject',
            message: 'Subject is required',
          },
          {
            field: 'block',
            message: 'Invalid block configuration',
            blockId: 'block-1',
          },
        ],
        warnings: [
          {
            field: 'preheader',
            message: 'Preheader is recommended',
          },
        ],
      }

      expect(validation.valid).toBe(false)
      expect(validation.errors).toHaveLength(2)
      expect(validation.warnings).toHaveLength(1)
      expect(validation.errors[1].blockId).toBe('block-1')
    })
  })

  describe('Email Analytics', () => {
    it('validates email analytics structure', () => {
      const analytics = {
        sends: 1000,
        opens: 750,
        clicks: 450,
        bounces: 25,
        unsubscribes: 10,
        openRate: 0.75,
        clickRate: 0.45,
        bounceRate: 0.025,
      }

      expect(analytics.sends).toBe(1000)
      expect(analytics.openRate).toBe(0.75)
      expect(analytics.clickRate).toBe(0.45)
    })
  })

  describe('Message Union Type', () => {
    it('accepts all email builder message types', () => {
      const messages: EmailBuilderMessage[] = [
        {
          type: 'emailTemplateSave',
          componentId: 'editor-1',
          template: createEmptyEmailTemplate('Test'),
          timestamp: Date.now(),
        },
        {
          type: 'emailTemplateLoad',
          componentId: 'editor-1',
          templateId: 'template-1',
          timestamp: Date.now(),
        },
        {
          type: 'emailTemplateDelete',
          componentId: 'list-1',
          templateId: 'template-1',
          timestamp: Date.now(),
        },
        {
          type: 'emailTemplateSend',
          componentId: 'send-1',
          template: 'template-1',
          recipients: [{ email: 'test@example.com' }],
          timestamp: Date.now(),
        },
      ]

      expect(messages).toHaveLength(4)
      expect(messages[0].type).toBe('emailTemplateSave')
      expect(messages[1].type).toBe('emailTemplateLoad')
      expect(messages[2].type).toBe('emailTemplateDelete')
      expect(messages[3].type).toBe('emailTemplateSend')
    })
  })
})
