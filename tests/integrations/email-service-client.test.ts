/**
 * Email Service Client Tests
 * Comprehensive tests for EmailServiceClient integration
 * Issue #51
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EmailServiceClient } from '../../src/integrations/email-service-client.js'
import { createEmptyEmailTemplate } from '../../src/types/email-builder-components.js'
import type {
  EmailTemplate,
  EmailProvider,
  EmailRecipient,
  EmailSchedule,
} from '../../src/types/index.js'

// Mock fetch for testing
global.fetch = vi.fn()

describe('EmailServiceClient', () => {
  let client: EmailServiceClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = new EmailServiceClient({
      apiUrl: 'https://api.example.com',
      apiKey: 'test-api-key',
      defaultProvider: 'resend',
    })
  })

  describe('Send Email', () => {
    it('sends email with template ID', async () => {
      const mockResponse = {
        jobId: 'job-123',
        status: 'sent',
        recipientCount: 2,
        provider: 'resend',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.sendEmail({
        templateId: 'template-123',
        recipients: [
          { email: 'user1@example.com', name: 'User 1' },
          { email: 'user2@example.com', name: 'User 2' },
        ],
        provider: 'resend',
      })

      expect(result.jobId).toBe('job-123')
      expect(result.recipientCount).toBe(2)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/email/send',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('sends email with template object', async () => {
      const template = createEmptyEmailTemplate('Test Template')
      template.subject = 'Test Subject'

      const mockResponse = {
        jobId: 'job-456',
        status: 'sent',
        recipientCount: 1,
        provider: 'resend',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.sendEmail({
        template,
        recipients: [{ email: 'test@example.com' }],
      })

      expect(result.jobId).toBe('job-456')
      expect(result.recipientCount).toBe(1)
    })

    it('sends scheduled email', async () => {
      const schedule: EmailSchedule = {
        sendAt: new Date('2025-01-01T10:00:00Z'),
        timezone: 'America/New_York',
        batchSize: 100,
        batchDelay: 5000,
      }

      const mockResponse = {
        jobId: 'job-789',
        status: 'scheduled',
        recipientCount: 50,
        scheduledAt: schedule.sendAt,
        provider: 'resend',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.sendEmail({
        templateId: 'template-1',
        recipients: Array(50)
          .fill(null)
          .map((_, i) => ({ email: `user${i}@example.com` })),
        schedule,
      })

      expect(result.status).toBe('scheduled')
      expect(result.scheduledAt).toBeDefined()
    })

    it('sends with different providers', async () => {
      const providers: EmailProvider[] = ['resend', 'sendgrid', 'ses', 'smtp']

      for (const provider of providers) {
        const mockResponse = {
          jobId: `job-${provider}`,
          status: 'sent',
          recipientCount: 1,
          provider,
        }

        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })

        const result = await client.sendEmail({
          templateId: 'template-1',
          recipients: [{ email: 'test@example.com' }],
          provider,
        })

        expect(result.provider).toBe(provider)
      }
    })

    it('sends with tracking options', async () => {
      const mockResponse = {
        jobId: 'job-track',
        status: 'sent',
        recipientCount: 1,
        provider: 'resend',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await client.sendEmail({
        templateId: 'template-1',
        recipients: [{ email: 'test@example.com' }],
        tracking: {
          trackOpens: true,
          trackClicks: true,
        },
      })

      const callArgs = (global.fetch as any).mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.tracking.trackOpens).toBe(true)
      expect(body.tracking.trackClicks).toBe(true)
    })

    it('handles send error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid template' }),
      })

      await expect(
        client.sendEmail({
          templateId: 'invalid',
          recipients: [{ email: 'test@example.com' }],
        })
      ).rejects.toThrow()
    })
  })

  describe('Send Test Email', () => {
    it('sends test email successfully', async () => {
      const template = createEmptyEmailTemplate('Test Template')

      const mockResponse = {
        testId: 'test-123',
        status: 'success',
        recipientEmail: 'test@example.com',
        sentAt: new Date(),
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.sendTestEmail({
        template,
        testEmail: 'test@example.com',
        variables: { name: 'Test User' },
      })

      expect(result.testId).toBe('test-123')
      expect(result.status).toBe('success')
      expect(result.recipientEmail).toBe('test@example.com')
    })

    it('handles test send failure', async () => {
      const template = createEmptyEmailTemplate('Test')

      const mockResponse = {
        testId: 'test-456',
        status: 'failed',
        recipientEmail: 'invalid@',
        sentAt: new Date(),
        error: 'Invalid email address',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.sendTestEmail({
        template,
        testEmail: 'invalid@',
      })

      expect(result.status).toBe('failed')
      expect(result.error).toBe('Invalid email address')
    })
  })

  describe('Get Email Analytics', () => {
    it('fetches email analytics for template', async () => {
      const mockResponse = {
        sends: 1000,
        opens: 750,
        clicks: 450,
        bounces: 25,
        unsubscribes: 10,
        openRate: 0.75,
        clickRate: 0.45,
        bounceRate: 0.025,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const analytics = await client.getAnalytics('template-123')

      expect(analytics.sends).toBe(1000)
      expect(analytics.openRate).toBe(0.75)
      expect(analytics.clickRate).toBe(0.45)
    })

    it('fetches analytics with date range', async () => {
      const mockResponse = {
        sends: 500,
        opens: 400,
        clicks: 250,
        bounces: 10,
        unsubscribes: 5,
        openRate: 0.8,
        clickRate: 0.5,
        bounceRate: 0.02,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const dateFrom = new Date('2024-01-01')
      const dateTo = new Date('2024-12-31')

      const analytics = await client.getAnalytics('template-123', dateFrom, dateTo)

      expect(analytics.sends).toBe(500)
    })
  })

  describe('Validate Email Addresses', () => {
    it('validates correct email addresses', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
      ]

      validEmails.forEach((email) => {
        expect(client.validateEmail(email)).toBe(true)
      })
    })

    it('rejects invalid email addresses', () => {
      const invalidEmails = [
        'invalid@',
        '@example.com',
        'user @example.com',
        'user@',
        'user',
        'user@example',
      ]

      invalidEmails.forEach((email) => {
        expect(client.validateEmail(email)).toBe(false)
      })
    })
  })

  describe('Validate Recipients', () => {
    it('validates list of recipients', () => {
      const recipients: EmailRecipient[] = [
        { email: 'user1@example.com', name: 'User 1' },
        { email: 'user2@example.com', name: 'User 2' },
      ]

      const result = client.validateRecipients(recipients)

      expect(result.valid).toBe(true)
      expect(result.invalidEmails).toHaveLength(0)
    })

    it('detects invalid recipients', () => {
      const recipients: EmailRecipient[] = [
        { email: 'user1@example.com', name: 'User 1' },
        { email: 'invalid@', name: 'Invalid' },
        { email: 'user2@example.com', name: 'User 2' },
      ]

      const result = client.validateRecipients(recipients)

      expect(result.valid).toBe(false)
      expect(result.invalidEmails).toHaveLength(1)
      expect(result.invalidEmails[0]).toBe('invalid@')
    })
  })

  describe('Generate Preview', () => {
    it('generates preview HTML', async () => {
      const template = createEmptyEmailTemplate('Preview Test')
      template.blocks = [
        {
          type: 'text',
          id: 'text-1',
          content: 'Hello {{name}}',
        },
      ]

      const mockResponse = {
        html: '<html><body>Hello John Doe</body></html>',
        text: 'Hello John Doe',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.generatePreview({
        template,
        variables: { name: 'John Doe' },
        device: 'desktop',
      })

      expect(result.html).toBeDefined()
      expect(result.html).toContain('Hello John Doe')
    })
  })

  describe('Validate Template', () => {
    it('validates complete template', async () => {
      const template = createEmptyEmailTemplate('Valid Template')
      template.subject = 'Test Subject'

      const mockResponse = {
        valid: true,
        errors: [],
        warnings: [],
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const validation = await client.validateTemplate(template)

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('detects validation errors', async () => {
      const template = createEmptyEmailTemplate('Invalid Template')
      template.subject = '' // Missing subject

      const mockResponse = {
        valid: false,
        errors: [
          { field: 'subject', message: 'Subject is required' },
        ],
        warnings: [],
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const validation = await client.validateTemplate(template)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toHaveLength(1)
      expect(validation.errors[0].field).toBe('subject')
    })

    it('detects warnings', async () => {
      const template = createEmptyEmailTemplate('Template with Warnings')
      template.subject = 'Test'

      const mockResponse = {
        valid: true,
        errors: [],
        warnings: [
          { field: 'preheader', message: 'Preheader is recommended for better engagement' },
        ],
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const validation = await client.validateTemplate(template)

      expect(validation.valid).toBe(true)
      expect(validation.warnings).toHaveLength(1)
    })
  })

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await expect(
        client.sendEmail({
          templateId: 'template-1',
          recipients: [{ email: 'test@example.com' }],
        })
      ).rejects.toThrow('Network error')
    })

    it('handles API errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      })

      await expect(
        client.sendEmail({
          templateId: 'template-1',
          recipients: [{ email: 'test@example.com' }],
        })
      ).rejects.toThrow()
    })

    it('handles rate limiting', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Map([['Retry-After', '60']]),
        json: async () => ({ error: 'Rate limit exceeded' }),
      })

      await expect(
        client.sendEmail({
          templateId: 'template-1',
          recipients: [{ email: 'test@example.com' }],
        })
      ).rejects.toThrow()
    })
  })

  describe('Configuration', () => {
    it('uses custom API URL', () => {
      const customClient = new EmailServiceClient({
        apiUrl: 'https://custom-api.example.com',
        apiKey: 'custom-key',
      })

      expect(customClient).toBeDefined()
    })

    it('uses default provider', async () => {
      const mockResponse = {
        jobId: 'job-default',
        status: 'sent',
        recipientCount: 1,
        provider: 'resend',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.sendEmail({
        templateId: 'template-1',
        recipients: [{ email: 'test@example.com' }],
      })

      expect(result.provider).toBe('resend')
    })

    it('overrides default provider', async () => {
      const mockResponse = {
        jobId: 'job-override',
        status: 'sent',
        recipientCount: 1,
        provider: 'sendgrid',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.sendEmail({
        templateId: 'template-1',
        recipients: [{ email: 'test@example.com' }],
        provider: 'sendgrid',
      })

      expect(result.provider).toBe('sendgrid')
    })
  })

  describe('Batch Operations', () => {
    it('handles large recipient lists with batching', async () => {
      const largeRecipientList: EmailRecipient[] = Array(1000)
        .fill(null)
        .map((_, i) => ({
          email: `user${i}@example.com`,
          name: `User ${i}`,
        }))

      const mockResponse = {
        jobId: 'job-batch',
        status: 'sent',
        recipientCount: 1000,
        provider: 'resend',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.sendEmail({
        templateId: 'template-1',
        recipients: largeRecipientList,
      })

      expect(result.recipientCount).toBe(1000)
    })
  })
})
