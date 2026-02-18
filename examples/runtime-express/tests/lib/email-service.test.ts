import { describe, it, expect } from 'vitest'
import { emailService } from '../../src/lib/email-service'

describe('EmailService', () => {
  describe('send', () => {
    it('should send email successfully', async () => {
      const result = await emailService.send({
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      })

      expect(result).toHaveProperty('messageId')
      expect(typeof result.messageId).toBe('string')
      expect(result.messageId.length).toBeGreaterThan(0)
    })

    it('should include cc and bcc', async () => {
      const result = await emailService.send({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
      })

      expect(result.messageId).toBeDefined()
    })

    it('should include from field', async () => {
      const result = await emailService.send({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
        from: 'sender@example.com',
      })

      expect(result.messageId).toBeDefined()
    })

    it('should return unique message IDs', async () => {
      const result1 = await emailService.send({
        to: 'test@example.com',
        subject: 'Test 1',
        body: 'Test',
      })

      const result2 = await emailService.send({
        to: 'test@example.com',
        subject: 'Test 2',
        body: 'Test',
      })

      expect(result1.messageId).not.toBe(result2.messageId)
    })
  })
})
