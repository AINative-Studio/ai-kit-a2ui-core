/**
 * Email service interface
 * This is a simplified mock implementation for the example
 * In production, use Resend, SendGrid, AWS SES, or SMTP
 */

export interface EmailParams {
  to: string
  subject: string
  body: string
  cc?: string
  bcc?: string
  from?: string
}

export interface EmailResult {
  messageId: string
}

/**
 * Mock email service implementation
 * Replace with actual Resend/SendGrid/SES integration
 */
class EmailService {
  /**
   * Send an email
   */
  async send(_params: EmailParams): Promise<EmailResult> {
    // This is a mock implementation
    // In production, this would:
    // 1. Connect to email service (Resend, SendGrid, SES, SMTP)
    // 2. Send email with proper error handling
    // 3. Return message ID for tracking

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100))

    return {
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
  }
}

export const emailService = new EmailService()
