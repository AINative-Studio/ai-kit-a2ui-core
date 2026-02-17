/**
 * Email Template Builder Message Types for A2UI v0.9
 * Messages for email template operations and sending
 * Issue #51
 */

import type { BaseMessage } from './protocol.js'
import type {
  EmailTemplate,
  EmailBlock,
  EmailVariable,
  EmailTheme,
  EmailRecipient,
  EmailSchedule,
  EmailProvider,
  EmailPriority,
  EmailStatus,
  EmailTemplateListItem,
  EmailDeviceType,
} from './email-builder-components.js'

/**
 * Email send result
 */
export interface EmailSendResult {
  /** Send job identifier */
  jobId: string
  /** Status of the send */
  status: EmailStatus
  /** Number of recipients */
  recipientCount: number
  /** Scheduled send time (if scheduled) */
  scheduledAt?: Date
  /** Provider used */
  provider: EmailProvider
  /** Additional details */
  details?: Record<string, unknown>
}

/**
 * Email test result
 */
export interface EmailTestResult {
  /** Test identifier */
  testId: string
  /** Test status */
  status: 'success' | 'failed'
  /** Recipient email */
  recipientEmail: string
  /** Sent timestamp */
  sentAt: Date
  /** Error message if failed */
  error?: string
}

/**
 * Email template validation result
 */
export interface EmailTemplateValidation {
  /** Is template valid */
  valid: boolean
  /** Validation errors */
  errors: Array<{
    field: string
    message: string
    blockId?: string
  }>
  /** Validation warnings */
  warnings: Array<{
    field: string
    message: string
    blockId?: string
  }>
}

/**
 * Email analytics data
 */
export interface EmailAnalytics {
  /** Total sends */
  sends: number
  /** Total opens */
  opens: number
  /** Total clicks */
  clicks: number
  /** Bounces */
  bounces: number
  /** Unsubscribes */
  unsubscribes: number
  /** Open rate */
  openRate: number
  /** Click rate */
  clickRate: number
  /** Bounce rate */
  bounceRate: number
}

/**
 * Save Email Template Message (UI → Agent)
 * Sent to save or update an email template
 */
export interface EmailTemplateSaveMessage extends BaseMessage {
  type: 'emailTemplateSave'
  /** Component identifier */
  componentId: string
  /** Template data */
  template: EmailTemplate
  /** Save as new template */
  saveAsNew?: boolean
}

/**
 * Email Template Saved Message (Agent → UI)
 * Sent when template is successfully saved
 */
export interface EmailTemplateSavedMessage extends BaseMessage {
  type: 'emailTemplateSaved'
  /** Component identifier */
  componentId: string
  /** Saved template ID */
  templateId: string
  /** Saved template */
  template: EmailTemplate
}

/**
 * Load Email Template Message (UI → Agent)
 * Sent to load an email template
 */
export interface EmailTemplateLoadMessage extends BaseMessage {
  type: 'emailTemplateLoad'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
}

/**
 * Email Template Loaded Message (Agent → UI)
 * Sent with loaded template data
 */
export interface EmailTemplateLoadedMessage extends BaseMessage {
  type: 'emailTemplateLoaded'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** Template data */
  template: EmailTemplate
}

/**
 * Delete Email Template Message (UI → Agent)
 * Sent to delete an email template
 */
export interface EmailTemplateDeleteMessage extends BaseMessage {
  type: 'emailTemplateDelete'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
}

/**
 * Email Template Deleted Message (Agent → UI)
 * Sent when template is successfully deleted
 */
export interface EmailTemplateDeletedMessage extends BaseMessage {
  type: 'emailTemplateDeleted'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
}

/**
 * List Email Templates Message (UI → Agent)
 * Sent to request list of email templates
 */
export interface EmailTemplateListMessage extends BaseMessage {
  type: 'emailTemplateList'
  /** Component identifier */
  componentId: string
  /** Category filter */
  category?: string
  /** Tags filter */
  tags?: string[]
  /** Search query */
  search?: string
  /** Sort by */
  sortBy?: 'name' | 'updated' | 'usage' | 'created'
  /** Sort order */
  sortOrder?: 'asc' | 'desc'
  /** Limit */
  limit?: number
  /** Offset */
  offset?: number
}

/**
 * Email Template List Response Message (Agent → UI)
 * Sent with list of email templates
 */
export interface EmailTemplateListResponseMessage extends BaseMessage {
  type: 'emailTemplateListResponse'
  /** Component identifier */
  componentId: string
  /** Template list */
  templates: EmailTemplateListItem[]
  /** Total count */
  total: number
  /** Limit */
  limit?: number
  /** Offset */
  offset?: number
}

/**
 * Update Email Block Message (UI → Agent)
 * Sent to update a specific block in the template
 */
export interface EmailBlockUpdateMessage extends BaseMessage {
  type: 'emailBlockUpdate'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** Block identifier */
  blockId: string
  /** Updated block data */
  block: EmailBlock
}

/**
 * Email Block Updated Message (Agent → UI)
 * Sent when block is successfully updated
 */
export interface EmailBlockUpdatedMessage extends BaseMessage {
  type: 'emailBlockUpdated'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** Block identifier */
  blockId: string
  /** Updated block data */
  block: EmailBlock
}

/**
 * Add Email Block Message (UI → Agent)
 * Sent to add a new block to the template
 */
export interface EmailBlockAddMessage extends BaseMessage {
  type: 'emailBlockAdd'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** Block data */
  block: EmailBlock
  /** Insert position (index) */
  position?: number
}

/**
 * Email Block Added Message (Agent → UI)
 * Sent when block is successfully added
 */
export interface EmailBlockAddedMessage extends BaseMessage {
  type: 'emailBlockAdded'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** Block data */
  block: EmailBlock
  /** Position where block was added */
  position: number
}

/**
 * Delete Email Block Message (UI → Agent)
 * Sent to delete a block from the template
 */
export interface EmailBlockDeleteMessage extends BaseMessage {
  type: 'emailBlockDelete'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** Block identifier */
  blockId: string
}

/**
 * Email Block Deleted Message (Agent → UI)
 * Sent when block is successfully deleted
 */
export interface EmailBlockDeletedMessage extends BaseMessage {
  type: 'emailBlockDeleted'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** Block identifier */
  blockId: string
}

/**
 * Reorder Email Blocks Message (UI → Agent)
 * Sent to reorder blocks in the template
 */
export interface EmailBlockReorderMessage extends BaseMessage {
  type: 'emailBlockReorder'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** New block order (array of block IDs) */
  blockOrder: string[]
}

/**
 * Email Blocks Reordered Message (Agent → UI)
 * Sent when blocks are successfully reordered
 */
export interface EmailBlockReorderedMessage extends BaseMessage {
  type: 'emailBlockReordered'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** New block order */
  blockOrder: string[]
}

/**
 * Update Email Variable Message (UI → Agent)
 * Sent to update a variable definition
 */
export interface EmailVariableUpdateMessage extends BaseMessage {
  type: 'emailVariableUpdate'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** Variable identifier */
  variableId: string
  /** Updated variable data */
  variable: EmailVariable
}

/**
 * Email Variable Updated Message (Agent → UI)
 * Sent when variable is successfully updated
 */
export interface EmailVariableUpdatedMessage extends BaseMessage {
  type: 'emailVariableUpdated'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** Variable identifier */
  variableId: string
  /** Updated variable data */
  variable: EmailVariable
}

/**
 * Add Email Variable Message (UI → Agent)
 * Sent to add a new variable to the template
 */
export interface EmailVariableAddMessage extends BaseMessage {
  type: 'emailVariableAdd'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** Variable data */
  variable: EmailVariable
}

/**
 * Email Variable Added Message (Agent → UI)
 * Sent when variable is successfully added
 */
export interface EmailVariableAddedMessage extends BaseMessage {
  type: 'emailVariableAdded'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** Variable data */
  variable: EmailVariable
}

/**
 * Delete Email Variable Message (UI → Agent)
 * Sent to delete a variable from the template
 */
export interface EmailVariableDeleteMessage extends BaseMessage {
  type: 'emailVariableDelete'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** Variable identifier */
  variableId: string
}

/**
 * Email Variable Deleted Message (Agent → UI)
 * Sent when variable is successfully deleted
 */
export interface EmailVariableDeletedMessage extends BaseMessage {
  type: 'emailVariableDeleted'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** Variable identifier */
  variableId: string
}

/**
 * Update Email Theme Message (UI → Agent)
 * Sent to update the template theme
 */
export interface EmailThemeUpdateMessage extends BaseMessage {
  type: 'emailThemeUpdate'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** Theme data */
  theme: EmailTheme
}

/**
 * Email Theme Updated Message (Agent → UI)
 * Sent when theme is successfully updated
 */
export interface EmailThemeUpdatedMessage extends BaseMessage {
  type: 'emailThemeUpdated'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** Updated theme data */
  theme: EmailTheme
}

/**
 * Email Template Preview Message (UI → Agent)
 * Sent to generate a preview of the template
 */
export interface EmailTemplatePreviewMessage extends BaseMessage {
  type: 'emailTemplatePreview'
  /** Component identifier */
  componentId: string
  /** Template data */
  template: EmailTemplate
  /** Variable values */
  variables: Record<string, string | number | boolean>
  /** Device type */
  device: EmailDeviceType
  /** Return HTML */
  returnHtml?: boolean
}

/**
 * Email Template Preview Response Message (Agent → UI)
 * Sent with preview HTML
 */
export interface EmailTemplatePreviewResponseMessage extends BaseMessage {
  type: 'emailTemplatePreviewResponse'
  /** Component identifier */
  componentId: string
  /** Preview HTML */
  html: string
  /** Plain text version */
  text?: string
  /** Device type */
  device: EmailDeviceType
}

/**
 * Email Template Validate Message (UI → Agent)
 * Sent to validate a template
 */
export interface EmailTemplateValidateMessage extends BaseMessage {
  type: 'emailTemplateValidate'
  /** Component identifier */
  componentId: string
  /** Template data */
  template: EmailTemplate
}

/**
 * Email Template Validation Response Message (Agent → UI)
 * Sent with validation results
 */
export interface EmailTemplateValidationResponseMessage extends BaseMessage {
  type: 'emailTemplateValidationResponse'
  /** Component identifier */
  componentId: string
  /** Validation result */
  validation: EmailTemplateValidation
}

/**
 * Email Template Send Message (UI → Agent)
 * Sent to send or schedule an email
 */
export interface EmailTemplateSendMessage extends BaseMessage {
  type: 'emailTemplateSend'
  /** Component identifier */
  componentId: string
  /** Template identifier or template data */
  template: string | EmailTemplate
  /** Recipients */
  recipients: EmailRecipient[]
  /** Email provider */
  provider?: EmailProvider
  /** Priority */
  priority?: EmailPriority
  /** Schedule configuration */
  schedule?: EmailSchedule
  /** Tracking options */
  tracking?: {
    trackOpens?: boolean
    trackClicks?: boolean
  }
}

/**
 * Email Template Send Response Message (Agent → UI)
 * Sent with send result
 */
export interface EmailTemplateSendResponseMessage extends BaseMessage {
  type: 'emailTemplateSendResponse'
  /** Component identifier */
  componentId: string
  /** Send result */
  result: EmailSendResult
}

/**
 * Email Template Test Send Message (UI → Agent)
 * Sent to send a test email
 */
export interface EmailTemplateTestSendMessage extends BaseMessage {
  type: 'emailTemplateTestSend'
  /** Component identifier */
  componentId: string
  /** Template data */
  template: EmailTemplate
  /** Test recipient email */
  testEmail: string
  /** Variable values */
  variables?: Record<string, string | number | boolean>
  /** Email provider */
  provider?: EmailProvider
}

/**
 * Email Template Test Send Response Message (Agent → UI)
 * Sent with test result
 */
export interface EmailTemplateTestSendResponseMessage extends BaseMessage {
  type: 'emailTemplateTestSendResponse'
  /** Component identifier */
  componentId: string
  /** Test result */
  result: EmailTestResult
}

/**
 * Email Template Analytics Message (UI → Agent)
 * Sent to request analytics for a template
 */
export interface EmailTemplateAnalyticsMessage extends BaseMessage {
  type: 'emailTemplateAnalytics'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** Date range start */
  dateFrom?: Date
  /** Date range end */
  dateTo?: Date
}

/**
 * Email Template Analytics Response Message (Agent → UI)
 * Sent with analytics data
 */
export interface EmailTemplateAnalyticsResponseMessage extends BaseMessage {
  type: 'emailTemplateAnalyticsResponse'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** Analytics data */
  analytics: EmailAnalytics
  /** Date range */
  dateRange?: {
    from: Date
    to: Date
  }
}

/**
 * Email Template Export Message (UI → Agent)
 * Sent to export a template
 */
export interface EmailTemplateExportMessage extends BaseMessage {
  type: 'emailTemplateExport'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** Export format */
  format: 'html' | 'json' | 'mjml'
  /** Include variables */
  includeVariables?: boolean
}

/**
 * Email Template Export Response Message (Agent → UI)
 * Sent with exported data
 */
export interface EmailTemplateExportResponseMessage extends BaseMessage {
  type: 'emailTemplateExportResponse'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** Export format */
  format: 'html' | 'json' | 'mjml'
  /** Exported content */
  content: string
  /** Download filename */
  filename: string
}

/**
 * Email Template Import Message (UI → Agent)
 * Sent to import a template
 */
export interface EmailTemplateImportMessage extends BaseMessage {
  type: 'emailTemplateImport'
  /** Component identifier */
  componentId: string
  /** Import format */
  format: 'html' | 'json' | 'mjml'
  /** Import content */
  content: string
  /** Template name */
  name: string
}

/**
 * Email Template Import Response Message (Agent → UI)
 * Sent with imported template
 */
export interface EmailTemplateImportResponseMessage extends BaseMessage {
  type: 'emailTemplateImportResponse'
  /** Component identifier */
  componentId: string
  /** Imported template */
  template: EmailTemplate
}

/**
 * Email Template Duplicate Message (UI → Agent)
 * Sent to duplicate a template
 */
export interface EmailTemplateDuplicateMessage extends BaseMessage {
  type: 'emailTemplateDuplicate'
  /** Component identifier */
  componentId: string
  /** Template identifier */
  templateId: string
  /** New template name */
  newName: string
}

/**
 * Email Template Duplicated Message (Agent → UI)
 * Sent when template is successfully duplicated
 */
export interface EmailTemplateDuplicatedMessage extends BaseMessage {
  type: 'emailTemplateDuplicated'
  /** Component identifier */
  componentId: string
  /** Original template ID */
  originalTemplateId: string
  /** New template ID */
  newTemplateId: string
  /** Duplicated template */
  template: EmailTemplate
}

/**
 * Email Builder Error Message (Agent → UI)
 * Sent when an email operation fails
 */
export interface EmailBuilderErrorMessage extends BaseMessage {
  type: 'emailBuilderError'
  /** Component identifier */
  componentId: string
  /** Error message */
  error: string
  /** Error code */
  errorCode:
    | 'NOT_FOUND'
    | 'INVALID_DATA'
    | 'VALIDATION_ERROR'
    | 'SEND_FAILED'
    | 'PROVIDER_ERROR'
    | 'PERMISSION_DENIED'
    | 'OPERATION_FAILED'
    | 'SERVICE_UNAVAILABLE'
  /** Optional error details */
  details?: unknown
  /** Related operation type */
  operation?: string
}

/**
 * Union of all email builder message types
 */
export type EmailBuilderMessage =
  | EmailTemplateSaveMessage
  | EmailTemplateSavedMessage
  | EmailTemplateLoadMessage
  | EmailTemplateLoadedMessage
  | EmailTemplateDeleteMessage
  | EmailTemplateDeletedMessage
  | EmailTemplateListMessage
  | EmailTemplateListResponseMessage
  | EmailBlockUpdateMessage
  | EmailBlockUpdatedMessage
  | EmailBlockAddMessage
  | EmailBlockAddedMessage
  | EmailBlockDeleteMessage
  | EmailBlockDeletedMessage
  | EmailBlockReorderMessage
  | EmailBlockReorderedMessage
  | EmailVariableUpdateMessage
  | EmailVariableUpdatedMessage
  | EmailVariableAddMessage
  | EmailVariableAddedMessage
  | EmailVariableDeleteMessage
  | EmailVariableDeletedMessage
  | EmailThemeUpdateMessage
  | EmailThemeUpdatedMessage
  | EmailTemplatePreviewMessage
  | EmailTemplatePreviewResponseMessage
  | EmailTemplateValidateMessage
  | EmailTemplateValidationResponseMessage
  | EmailTemplateSendMessage
  | EmailTemplateSendResponseMessage
  | EmailTemplateTestSendMessage
  | EmailTemplateTestSendResponseMessage
  | EmailTemplateAnalyticsMessage
  | EmailTemplateAnalyticsResponseMessage
  | EmailTemplateExportMessage
  | EmailTemplateExportResponseMessage
  | EmailTemplateImportMessage
  | EmailTemplateImportResponseMessage
  | EmailTemplateDuplicateMessage
  | EmailTemplateDuplicatedMessage
  | EmailBuilderErrorMessage

/**
 * Type guards for message discrimination
 */
export function isEmailTemplateSaveMessage(msg: unknown): msg is EmailTemplateSaveMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailTemplateSave'
}

export function isEmailTemplateLoadMessage(msg: unknown): msg is EmailTemplateLoadMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailTemplateLoad'
}

export function isEmailTemplateDeleteMessage(msg: unknown): msg is EmailTemplateDeleteMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailTemplateDelete'
}

export function isEmailTemplateListMessage(msg: unknown): msg is EmailTemplateListMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailTemplateList'
}

export function isEmailBlockUpdateMessage(msg: unknown): msg is EmailBlockUpdateMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailBlockUpdate'
}

export function isEmailBlockAddMessage(msg: unknown): msg is EmailBlockAddMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailBlockAdd'
}

export function isEmailBlockDeleteMessage(msg: unknown): msg is EmailBlockDeleteMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailBlockDelete'
}

export function isEmailBlockReorderMessage(msg: unknown): msg is EmailBlockReorderMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailBlockReorder'
}

export function isEmailVariableUpdateMessage(msg: unknown): msg is EmailVariableUpdateMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailVariableUpdate'
}

export function isEmailVariableAddMessage(msg: unknown): msg is EmailVariableAddMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailVariableAdd'
}

export function isEmailVariableDeleteMessage(msg: unknown): msg is EmailVariableDeleteMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailVariableDelete'
}

export function isEmailThemeUpdateMessage(msg: unknown): msg is EmailThemeUpdateMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailThemeUpdate'
}

export function isEmailTemplatePreviewMessage(msg: unknown): msg is EmailTemplatePreviewMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailTemplatePreview'
}

export function isEmailTemplateValidateMessage(msg: unknown): msg is EmailTemplateValidateMessage {
  return (
    typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailTemplateValidate'
  )
}

export function isEmailTemplateSendMessage(msg: unknown): msg is EmailTemplateSendMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailTemplateSend'
}

export function isEmailTemplateTestSendMessage(msg: unknown): msg is EmailTemplateTestSendMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailTemplateTestSend'
}

export function isEmailTemplateAnalyticsMessage(msg: unknown): msg is EmailTemplateAnalyticsMessage {
  return (
    typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailTemplateAnalytics'
  )
}

export function isEmailTemplateExportMessage(msg: unknown): msg is EmailTemplateExportMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailTemplateExport'
}

export function isEmailTemplateImportMessage(msg: unknown): msg is EmailTemplateImportMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailTemplateImport'
}

export function isEmailTemplateDuplicateMessage(msg: unknown): msg is EmailTemplateDuplicateMessage {
  return (
    typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailTemplateDuplicate'
  )
}

export function isEmailBuilderErrorMessage(msg: unknown): msg is EmailBuilderErrorMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'emailBuilderError'
}

/**
 * Helper to create email template save message
 */
export function createEmailTemplateSaveMessage(
  componentId: string,
  template: EmailTemplate,
  saveAsNew?: boolean
): EmailTemplateSaveMessage {
  return {
    type: 'emailTemplateSave',
    componentId,
    template,
    saveAsNew,
    timestamp: Date.now(),
  }
}

/**
 * Helper to create email template send message
 */
export function createEmailTemplateSendMessage(
  componentId: string,
  template: string | EmailTemplate,
  recipients: EmailRecipient[],
  options?: {
    provider?: EmailProvider
    priority?: EmailPriority
    schedule?: EmailSchedule
    tracking?: { trackOpens?: boolean; trackClicks?: boolean }
  }
): EmailTemplateSendMessage {
  return {
    type: 'emailTemplateSend',
    componentId,
    template,
    recipients,
    ...options,
    timestamp: Date.now(),
  }
}

/**
 * Helper to create email template preview message
 */
export function createEmailTemplatePreviewMessage(
  componentId: string,
  template: EmailTemplate,
  variables: Record<string, string | number | boolean>,
  device: EmailDeviceType = 'desktop'
): EmailTemplatePreviewMessage {
  return {
    type: 'emailTemplatePreview',
    componentId,
    template,
    variables,
    device,
    timestamp: Date.now(),
  }
}
