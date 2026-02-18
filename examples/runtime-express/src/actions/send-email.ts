import { z } from 'zod'
import { emailService } from '../lib/email-service'

import type { Action } from '@ainative/a2ui-runtime'
import { ActionExecutionError } from '@ainative/a2ui-runtime'

function defineAction<T extends z.ZodType>(config: {
  name: string
  description: string
  parameters: T
  handler: (params: z.infer<T>, context?: unknown) => Promise<unknown>
}): Action {
  return config as Action
}

/**
 * Send email action using email service integration
 */
export const sendEmailAction = defineAction({
  name: 'sendEmail',
  description: 'Send an email using configured email service (Resend, SendGrid, AWS SES)',

  parameters: z.object({
    to: z.string().email().describe('Recipient email address'),
    subject: z.string().min(1).describe('Email subject'),
    body: z.string().min(1).describe('Email body (HTML or plain text)'),
    cc: z.string().email().optional().describe('CC email address'),
    bcc: z.string().email().optional().describe('BCC email address'),
    from: z.string().email().optional().describe('Sender email address'),
  }),

  handler: async (params: { to: string; subject: string; body: string; cc?: string; bcc?: string; from?: string }) => {
    try {
      const result = await emailService.send(params)

      return {
        success: true,
        messageId: result.messageId,
      }
    } catch (error) {
      throw new ActionExecutionError(
        `Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'sendEmail'
      )
    }
  },
})
