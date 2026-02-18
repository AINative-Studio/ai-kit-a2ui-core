import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendEmailAction } from '../../src/actions/send-email'
import { ActionExecutionError } from '@ainative/a2ui-runtime'

vi.mock('../../src/lib/email-service', () => ({
  emailService: {
    send: vi.fn(),
  },
}))

import { emailService as mockEmailService } from '../../src/lib/email-service'

describe('sendEmailAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Action Definition', () => {
    it('should have correct name', () => {
      expect(sendEmailAction.name).toBe('sendEmail')
    })

    it('should have description', () => {
      expect(sendEmailAction.description).toBeTruthy()
    })
  })

  describe('Parameter Validation', () => {
    it('should require to parameter', () => {
      const result = sendEmailAction.parameters.safeParse({ subject: 'Test', body: 'Test' })
      expect(result.success).toBe(false)
    })

    it('should require subject parameter', () => {
      const result = sendEmailAction.parameters.safeParse({ to: 'test@example.com', body: 'Test' })
      expect(result.success).toBe(false)
    })

    it('should require body parameter', () => {
      const result = sendEmailAction.parameters.safeParse({ to: 'test@example.com', subject: 'Test' })
      expect(result.success).toBe(false)
    })

    it('should validate email format', () => {
      const result = sendEmailAction.parameters.safeParse({
        to: 'invalid-email',
        subject: 'Test',
        body: 'Test',
      })
      expect(result.success).toBe(false)
    })

    it('should accept valid parameters', () => {
      const result = sendEmailAction.parameters.safeParse({
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      })
      expect(result.success).toBe(true)
    })

    it('should accept optional cc field', () => {
      const result = sendEmailAction.parameters.safeParse({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
        cc: 'cc@example.com',
      })
      expect(result.success).toBe(true)
    })

    it('should accept optional bcc field', () => {
      const result = sendEmailAction.parameters.safeParse({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
        bcc: 'bcc@example.com',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Email Sending', () => {
    it('should send email with correct parameters', async () => {
      mockEmailService.send.mockResolvedValue({ messageId: 'msg-123' })

      const params = {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      }

      await sendEmailAction.handler(params)

      expect(mockEmailService.send).toHaveBeenCalledWith(params)
    })

    it('should return success response', async () => {
      mockEmailService.send.mockResolvedValue({ messageId: 'msg-123' })

      const result = await sendEmailAction.handler({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('msg-123')
    })

    it('should handle cc and bcc fields', async () => {
      mockEmailService.send.mockResolvedValue({ messageId: 'msg-123' })

      const params = {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
      }

      await sendEmailAction.handler(params)

      expect(mockEmailService.send).toHaveBeenCalledWith(expect.objectContaining({
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
      }))
    })
  })

  describe('Error Handling', () => {
    it('should throw ActionExecutionError on email service failure', async () => {
      mockEmailService.send.mockRejectedValue(new Error('SMTP connection failed'))

      await expect(
        sendEmailAction.handler({
          to: 'test@example.com',
          subject: 'Test',
          body: 'Test',
        })
      ).rejects.toThrow(ActionExecutionError)
    })

    it('should include error message', async () => {
      mockEmailService.send.mockRejectedValue(new Error('Invalid API key'))

      await expect(
        sendEmailAction.handler({
          to: 'test@example.com',
          subject: 'Test',
          body: 'Test',
        })
      ).rejects.toThrow(/Invalid API key/)
    })
  })
})
