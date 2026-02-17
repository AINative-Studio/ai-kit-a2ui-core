/**
 * Email Service Client for A2UI
 * Integration with email sending services (Resend, SendGrid, SES, etc.)
 * Issue #51
 */

import type {
  EmailTemplate,
  EmailProvider,
  EmailRecipient,
  EmailSchedule,
  EmailSendResult,
  EmailTestResult,
  EmailAnalytics,
  EmailTemplateValidation,
} from '../types/index.js'
import { templateToHtml, isValidEmail } from '../types/email-builder-components.js'

/**
 * Email service client configuration
 */
export interface EmailServiceClientConfig {
  /** API URL for email service */
  apiUrl: string
  /** API key for authentication */
  apiKey: string
  /** Default email provider */
  defaultProvider?: EmailProvider
  /** Request timeout (ms) */
  timeout?: number
}

/**
 * Send email options
 */
export interface SendEmailOptions {
  /** Template ID or template object */
  template: string | EmailTemplate
  /** Email recipients */
  recipients: EmailRecipient[]
  /** Variable values for template */
  variables?: Record<string, string | number | boolean>
  /** Email provider */
  provider?: EmailProvider
  /** Priority */
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  /** Schedule configuration */
  schedule?: EmailSchedule
  /** Tracking options */
  tracking?: {
    trackOpens?: boolean
    trackClicks?: boolean
  }
}

/**
 * Send test email options
 */
export interface SendTestEmailOptions {
  /** Template object */
  template: EmailTemplate
  /** Test recipient email */
  testEmail: string
  /** Variable values for template */
  variables?: Record<string, string | number | boolean>
  /** Email provider */
  provider?: EmailProvider
}

/**
 * Generate preview options
 */
export interface GeneratePreviewOptions {
  /** Template object */
  template: EmailTemplate
  /** Variable values */
  variables?: Record<string, string | number | boolean>
  /** Device type */
  device?: 'desktop' | 'mobile' | 'tablet'
}

/**
 * Recipients validation result
 */
export interface RecipientsValidationResult {
  /** All recipients valid */
  valid: boolean
  /** List of invalid email addresses */
  invalidEmails: string[]
}

/**
 * Email Service Client
 * Handles communication with email sending services
 */
export class EmailServiceClient {
  private readonly config: Required<EmailServiceClientConfig>

  constructor(config: EmailServiceClientConfig) {
    this.config = {
      ...config,
      defaultProvider: config.defaultProvider || 'resend',
      timeout: config.timeout || 30000,
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: SendEmailOptions): Promise<EmailSendResult> {
    // Validate recipients
    const validationResult = this.validateRecipients(options.recipients)
    if (!validationResult.valid) {
      throw new Error(`Invalid email addresses: ${validationResult.invalidEmails.join(', ')}`)
    }

    // Prepare request body
    const body: Record<string, unknown> = {
      recipients: options.recipients,
      provider: options.provider || this.config.defaultProvider,
      priority: options.priority || 'normal',
    }

    // Handle template
    if (typeof options.template === 'string') {
      body.templateId = options.template
      // For template ID, let server generate HTML
    } else {
      body.template = options.template
      // Only generate HTML if template has required properties
      if (options.template && typeof options.template === 'object' && 'blocks' in options.template && 'metadata' in options.template) {
        body.html = templateToHtml(options.template as any, options.variables)
      }
    }

    // Add optional fields
    if (options.variables) {
      body.variables = options.variables
    }
    if (options.schedule) {
      body.schedule = options.schedule
    }
    if (options.tracking) {
      body.tracking = options.tracking
    }

    // Send request
    const response = await this.request<EmailSendResult>('/email/send', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    return response
  }

  /**
   * Send test email
   */
  async sendTestEmail(options: SendTestEmailOptions): Promise<EmailTestResult> {
    // Validate test email
    if (!this.validateEmail(options.testEmail)) {
      throw new Error(`Invalid test email address: ${options.testEmail}`)
    }

    // Generate HTML
    const html = templateToHtml(options.template, options.variables)

    // Prepare request body
    const body = {
      template: options.template,
      html,
      testEmail: options.testEmail,
      variables: options.variables,
      provider: options.provider || this.config.defaultProvider,
    }

    // Send request
    const response = await this.request<EmailTestResult>('/email/test', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    return response
  }

  /**
   * Get email analytics
   */
  async getAnalytics(
    templateId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<EmailAnalytics> {
    const params = new URLSearchParams({ templateId })

    if (dateFrom) {
      params.append('dateFrom', dateFrom.toISOString())
    }
    if (dateTo) {
      params.append('dateTo', dateTo.toISOString())
    }

    const response = await this.request<EmailAnalytics>(
      `/email/analytics?${params.toString()}`,
      {
        method: 'GET',
      }
    )

    return response
  }

  /**
   * Generate preview
   */
  async generatePreview(options: GeneratePreviewOptions): Promise<{ html: string; text?: string }> {
    const html = templateToHtml(options.template, options.variables)

    // Prepare request body
    const body = {
      template: options.template,
      html,
      variables: options.variables,
      device: options.device || 'desktop',
    }

    // Send request
    const response = await this.request<{ html: string; text?: string }>('/email/preview', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    return response
  }

  /**
   * Validate template
   */
  async validateTemplate(template: EmailTemplate): Promise<EmailTemplateValidation> {
    // Prepare request body
    const body = {
      template,
    }

    // Send request
    const response = await this.request<EmailTemplateValidation>('/email/validate', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    return response
  }

  /**
   * Validate single email address
   */
  validateEmail(email: string): boolean {
    return isValidEmail(email)
  }

  /**
   * Validate list of recipients
   */
  validateRecipients(recipients: EmailRecipient[]): RecipientsValidationResult {
    const invalidEmails: string[] = []

    for (const recipient of recipients) {
      if (!this.validateEmail(recipient.email)) {
        invalidEmails.push(recipient.email)
      }
    }

    return {
      valid: invalidEmails.length === 0,
      invalidEmails,
    }
  }

  /**
   * Make HTTP request
   */
  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${this.config.apiUrl}${endpoint}`

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.apiKey}`,
      ...options.headers,
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data as T
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`)
      }
      throw error
    }
  }
}
