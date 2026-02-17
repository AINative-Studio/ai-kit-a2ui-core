/**
 * A2UI Email Builder Handler (Issue #51)
 * Manages email template building, preview, and sending operations
 */

import type { A2UITransport } from '../transport/index.js'
import type {
  EmailTemplateSaveMessage,
  EmailTemplateSavedMessage,
  EmailTemplateLoadMessage,
  EmailTemplateLoadedMessage,
  EmailTemplateDeleteMessage,
  EmailTemplateDeletedMessage,
  EmailTemplateListMessage,
  EmailTemplateListResponseMessage,
  EmailBlockAddMessage,
  EmailBlockAddedMessage,
  EmailBlockUpdateMessage,
  EmailBlockUpdatedMessage,
  EmailBlockDeleteMessage,
  EmailBlockDeletedMessage,
  EmailBlockReorderMessage,
  EmailBlockReorderedMessage,
  EmailVariableAddMessage,
  EmailVariableAddedMessage,
  EmailVariableUpdateMessage,
  EmailVariableUpdatedMessage,
  EmailVariableDeleteMessage,
  EmailVariableDeletedMessage,
  EmailThemeUpdateMessage,
  EmailThemeUpdatedMessage,
  EmailTemplatePreviewMessage,
  EmailTemplatePreviewResponseMessage,
  EmailTemplateValidateMessage,
  EmailTemplateValidationResponseMessage,
  EmailTemplateSendMessage,
  EmailTemplateSendResponseMessage,
  EmailTemplateTestSendMessage,
  EmailTemplateTestSendResponseMessage,
  EmailTemplateDuplicateMessage,
  EmailTemplateDuplicatedMessage,
  EmailBuilderErrorMessage,
  EmailTemplate,
  EmailTemplateListItem,
  EmailBlock,
  EmailVariable,
  EmailTheme,
  EmailTemplateValidation,
} from '../types/index.js'
import {
  isEmailTemplateSaveMessage,
  isEmailTemplateLoadMessage,
  isEmailTemplateDeleteMessage,
  isEmailTemplateListMessage,
  isEmailBlockAddMessage,
  isEmailBlockUpdateMessage,
  isEmailBlockDeleteMessage,
  isEmailBlockReorderMessage,
  isEmailVariableAddMessage,
  isEmailVariableUpdateMessage,
  isEmailVariableDeleteMessage,
  isEmailThemeUpdateMessage,
  isEmailTemplatePreviewMessage,
  isEmailTemplateValidateMessage,
  isEmailTemplateSendMessage,
  isEmailTemplateTestSendMessage,
  isEmailTemplateDuplicateMessage,
} from '../types/email-builder-messages.js'
import { templateToHtml, isValidEmail } from '../types/email-builder-components.js'

/**
 * Email builder event types
 */
export type EmailBuilderEventType =
  | 'templateSaved'
  | 'templateLoaded'
  | 'templateDeleted'
  | 'blockAdded'
  | 'blockUpdated'
  | 'blockDeleted'
  | 'variableAdded'
  | 'variableUpdated'
  | 'variableDeleted'
  | 'templateValidated'
  | 'emailSent'
  | 'error'

/**
 * Email builder event data
 */
export interface EmailBuilderEventData {
  componentId: string
  templateId?: string
  template?: EmailTemplate
  block?: EmailBlock
  variable?: EmailVariable
  error?: {
    message: string
    code: string
    details?: unknown
  }
}

/**
 * Email builder event handler callback
 */
export type EmailBuilderEventHandler = (data: EmailBuilderEventData) => void

/**
 * Email template storage interface
 */
export interface EmailTemplateStorage {
  save(template: EmailTemplate): Promise<string>
  load(id: string): Promise<EmailTemplate | null>
  delete(id: string): Promise<void>
  list(filters?: {
    category?: string
    tags?: string[]
    search?: string
  }): Promise<EmailTemplateListItem[]>
}

/**
 * Email sender interface
 */
export interface EmailSender {
  send(options: {
    template: string | EmailTemplate
    recipients: Array<{ email: string; name?: string }>
    variables?: Record<string, string | number | boolean>
    provider?: string
  }): Promise<{
    jobId: string
    status: string
    recipientCount: number
    provider: string
  }>
  sendTest(options: {
    template: EmailTemplate
    testEmail: string
    variables?: Record<string, string | number | boolean>
  }): Promise<{
    testId: string
    status: 'success' | 'failed'
    recipientEmail: string
    sentAt: Date
    error?: string
  }>
}

/**
 * Email builder handler options
 */
export interface EmailBuilderHandlerOptions {
  storage?: EmailTemplateStorage
  sender?: EmailSender
  autoSave?: boolean
  autoSaveDelay?: number
  enableValidation?: boolean
}

/**
 * Email Builder Handler
 * Manages email template operations
 */
export class EmailBuilderHandler {
  private readonly transport: A2UITransport
  private readonly options: Required<EmailBuilderHandlerOptions>
  private readonly eventHandlers = new Map<EmailBuilderEventType, Set<EmailBuilderEventHandler>>()
  private readonly templates = new Map<string, EmailTemplate>()
  private autoSaveTimers = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(transport: A2UITransport, options: EmailBuilderHandlerOptions = {}) {
    this.transport = transport
    this.options = {
      storage: options.storage ?? this.createDefaultStorage(),
      sender: options.sender ?? this.createDefaultSender(),
      autoSave: options.autoSave ?? false,
      autoSaveDelay: options.autoSaveDelay ?? 2000,
      enableValidation: options.enableValidation ?? true,
    }
    this.initialize()
  }

  /**
   * Initialize the handler
   */
  private initialize(): void {
    // Register message handlers
    this.transport.on<EmailTemplateSaveMessage>('emailTemplateSave', (msg) => {
      if (isEmailTemplateSaveMessage(msg)) this.handleSave(msg)
    })

    this.transport.on<EmailTemplateLoadMessage>('emailTemplateLoad', (msg) => {
      if (isEmailTemplateLoadMessage(msg)) this.handleLoad(msg)
    })

    this.transport.on<EmailTemplateDeleteMessage>('emailTemplateDelete', (msg) => {
      if (isEmailTemplateDeleteMessage(msg)) this.handleDelete(msg)
    })

    this.transport.on<EmailTemplateListMessage>('emailTemplateList', (msg) => {
      if (isEmailTemplateListMessage(msg)) this.handleList(msg)
    })

    this.transport.on<EmailBlockAddMessage>('emailBlockAdd', (msg) => {
      if (isEmailBlockAddMessage(msg)) this.handleBlockAdd(msg)
    })

    this.transport.on<EmailBlockUpdateMessage>('emailBlockUpdate', (msg) => {
      if (isEmailBlockUpdateMessage(msg)) this.handleBlockUpdate(msg)
    })

    this.transport.on<EmailBlockDeleteMessage>('emailBlockDelete', (msg) => {
      if (isEmailBlockDeleteMessage(msg)) this.handleBlockDelete(msg)
    })

    this.transport.on<EmailBlockReorderMessage>('emailBlockReorder', (msg) => {
      if (isEmailBlockReorderMessage(msg)) this.handleBlockReorder(msg)
    })

    this.transport.on<EmailVariableAddMessage>('emailVariableAdd', (msg) => {
      if (isEmailVariableAddMessage(msg)) this.handleVariableAdd(msg)
    })

    this.transport.on<EmailVariableUpdateMessage>('emailVariableUpdate', (msg) => {
      if (isEmailVariableUpdateMessage(msg)) this.handleVariableUpdate(msg)
    })

    this.transport.on<EmailVariableDeleteMessage>('emailVariableDelete', (msg) => {
      if (isEmailVariableDeleteMessage(msg)) this.handleVariableDelete(msg)
    })

    this.transport.on<EmailThemeUpdateMessage>('emailThemeUpdate', (msg) => {
      if (isEmailThemeUpdateMessage(msg)) this.handleThemeUpdate(msg)
    })

    this.transport.on<EmailTemplatePreviewMessage>('emailTemplatePreview', (msg) => {
      if (isEmailTemplatePreviewMessage(msg)) this.handlePreview(msg)
    })

    this.transport.on<EmailTemplateValidateMessage>('emailTemplateValidate', (msg) => {
      if (isEmailTemplateValidateMessage(msg)) this.handleValidate(msg)
    })

    this.transport.on<EmailTemplateSendMessage>('emailTemplateSend', (msg) => {
      if (isEmailTemplateSendMessage(msg)) this.handleSend(msg)
    })

    this.transport.on<EmailTemplateTestSendMessage>('emailTemplateTestSend', (msg) => {
      if (isEmailTemplateTestSendMessage(msg)) this.handleTestSend(msg)
    })

    this.transport.on<EmailTemplateDuplicateMessage>('emailTemplateDuplicate', (msg) => {
      if (isEmailTemplateDuplicateMessage(msg)) this.handleDuplicate(msg)
    })
  }

  /**
   * Handle template save
   */
  private async handleSave(message: EmailTemplateSaveMessage): Promise<void> {
    try {
      let template = message.template

      // Generate new ID if saveAsNew
      if (message.saveAsNew) {
        const newId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        template = {
          ...template,
          id: newId,
          metadata: {
            ...template.metadata,
            updatedAt: new Date(),
          },
        }
      } else {
        // Update timestamps for existing template
        template.metadata.updatedAt = new Date()
      }

      // Save template
      const templateId = await this.options.storage.save(template)
      this.templates.set(templateId, template)

      // Send saved message
      const savedMessage: EmailTemplateSavedMessage = {
        type: 'emailTemplateSaved',
        componentId: message.componentId,
        templateId,
        template,
        timestamp: Date.now(),
      }
      this.transport.send(savedMessage)

      // Emit event
      this.emit('templateSaved', {
        componentId: message.componentId,
        templateId,
        template,
      })
    } catch (error) {
      this.sendError(message.componentId, 'Failed to save template', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle template load
   */
  private async handleLoad(message: EmailTemplateLoadMessage): Promise<void> {
    try {
      const template = await this.options.storage.load(message.templateId)

      if (!template) {
        this.sendError(message.componentId, 'Template not found', 'NOT_FOUND')
        return
      }

      this.templates.set(message.templateId, template)

      // Send loaded message
      const loadedMessage: EmailTemplateLoadedMessage = {
        type: 'emailTemplateLoaded',
        componentId: message.componentId,
        templateId: message.templateId,
        template,
        timestamp: Date.now(),
      }
      this.transport.send(loadedMessage)

      // Emit event
      this.emit('templateLoaded', {
        componentId: message.componentId,
        templateId: message.templateId,
        template,
      })
    } catch (error) {
      this.sendError(message.componentId, 'Failed to load template', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle template delete
   */
  private async handleDelete(message: EmailTemplateDeleteMessage): Promise<void> {
    try {
      await this.options.storage.delete(message.templateId)
      this.templates.delete(message.templateId)

      // Send deleted message
      const deletedMessage: EmailTemplateDeletedMessage = {
        type: 'emailTemplateDeleted',
        componentId: message.componentId,
        templateId: message.templateId,
        timestamp: Date.now(),
      }
      this.transport.send(deletedMessage)

      // Emit event
      this.emit('templateDeleted', {
        componentId: message.componentId,
        templateId: message.templateId,
      })
    } catch (error) {
      this.sendError(message.componentId, 'Failed to delete template', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle template list
   */
  private async handleList(message: EmailTemplateListMessage): Promise<void> {
    try {
      const filters = {
        category: message.category,
        tags: message.tags,
        search: message.search,
      }

      let templates = await this.options.storage.list(filters)

      // Apply sorting
      if (message.sortBy) {
        templates = this.sortTemplates(templates, message.sortBy, message.sortOrder || 'desc')
      }

      // Apply pagination
      const total = templates.length
      if (message.offset !== undefined) {
        templates = templates.slice(message.offset)
      }
      if (message.limit !== undefined) {
        templates = templates.slice(0, message.limit)
      }

      // Send response
      const responseMessage: EmailTemplateListResponseMessage = {
        type: 'emailTemplateListResponse',
        componentId: message.componentId,
        templates,
        total,
        limit: message.limit,
        offset: message.offset,
        timestamp: Date.now(),
      }
      this.transport.send(responseMessage)
    } catch (error) {
      this.sendError(message.componentId, 'Failed to list templates', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle block add
   */
  private async handleBlockAdd(message: EmailBlockAddMessage): Promise<void> {
    try {
      const template = await this.getTemplate(message.templateId)
      if (!template) {
        this.sendError(message.componentId, 'Template not found', 'NOT_FOUND')
        return
      }

      const position = message.position ?? template.blocks.length
      template.blocks.splice(position, 0, message.block)

      // Send added message
      const addedMessage: EmailBlockAddedMessage = {
        type: 'emailBlockAdded',
        componentId: message.componentId,
        templateId: message.templateId,
        block: message.block,
        position,
        timestamp: Date.now(),
      }
      this.transport.send(addedMessage)

      // Emit event
      this.emit('blockAdded', {
        componentId: message.componentId,
        templateId: message.templateId,
        block: message.block,
      })

      // Auto-save if enabled
      if (this.options.autoSave) {
        this.scheduleAutoSave(message.componentId, template)
      }
    } catch (error) {
      this.sendError(message.componentId, 'Failed to add block', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle block update
   */
  private async handleBlockUpdate(message: EmailBlockUpdateMessage): Promise<void> {
    try {
      const template = await this.getTemplate(message.templateId)
      if (!template) {
        this.sendError(message.componentId, 'Template not found', 'NOT_FOUND')
        return
      }

      const blockIndex = template.blocks.findIndex((b) => b.id === message.blockId)
      if (blockIndex === -1) {
        this.sendError(message.componentId, 'Block not found', 'NOT_FOUND')
        return
      }

      template.blocks[blockIndex] = message.block

      // Send updated message
      const updatedMessage: EmailBlockUpdatedMessage = {
        type: 'emailBlockUpdated',
        componentId: message.componentId,
        templateId: message.templateId,
        blockId: message.blockId,
        block: message.block,
        timestamp: Date.now(),
      }
      this.transport.send(updatedMessage)

      // Emit event
      this.emit('blockUpdated', {
        componentId: message.componentId,
        templateId: message.templateId,
        block: message.block,
      })

      // Auto-save if enabled
      if (this.options.autoSave) {
        this.scheduleAutoSave(message.componentId, template)
      }
    } catch (error) {
      this.sendError(message.componentId, 'Failed to update block', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle block delete
   */
  private async handleBlockDelete(message: EmailBlockDeleteMessage): Promise<void> {
    try {
      const template = await this.getTemplate(message.templateId)
      if (!template) {
        this.sendError(message.componentId, 'Template not found', 'NOT_FOUND')
        return
      }

      template.blocks = template.blocks.filter((b) => b.id !== message.blockId)

      // Send deleted message
      const deletedMessage: EmailBlockDeletedMessage = {
        type: 'emailBlockDeleted',
        componentId: message.componentId,
        templateId: message.templateId,
        blockId: message.blockId,
        timestamp: Date.now(),
      }
      this.transport.send(deletedMessage)

      // Emit event
      this.emit('blockDeleted', {
        componentId: message.componentId,
        templateId: message.templateId,
      })
    } catch (error) {
      this.sendError(message.componentId, 'Failed to delete block', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle block reorder
   */
  private async handleBlockReorder(message: EmailBlockReorderMessage): Promise<void> {
    try {
      const template = await this.getTemplate(message.templateId)
      if (!template) {
        this.sendError(message.componentId, 'Template not found', 'NOT_FOUND')
        return
      }

      // Reorder blocks based on blockOrder array
      const blockMap = new Map(template.blocks.map((b) => [b.id, b]))
      template.blocks = message.blockOrder.map((id) => blockMap.get(id)!).filter(Boolean)

      // Send reordered message
      const reorderedMessage: EmailBlockReorderedMessage = {
        type: 'emailBlockReordered',
        componentId: message.componentId,
        templateId: message.templateId,
        blockOrder: message.blockOrder,
        timestamp: Date.now(),
      }
      this.transport.send(reorderedMessage)
    } catch (error) {
      this.sendError(message.componentId, 'Failed to reorder blocks', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle variable add
   */
  private async handleVariableAdd(message: EmailVariableAddMessage): Promise<void> {
    try {
      const template = await this.getTemplate(message.templateId)
      if (!template) {
        this.sendError(message.componentId, 'Template not found', 'NOT_FOUND')
        return
      }

      template.variables.push(message.variable)

      // Send added message
      const addedMessage: EmailVariableAddedMessage = {
        type: 'emailVariableAdded',
        componentId: message.componentId,
        templateId: message.templateId,
        variable: message.variable,
        timestamp: Date.now(),
      }
      this.transport.send(addedMessage)

      // Emit event
      this.emit('variableAdded', {
        componentId: message.componentId,
        templateId: message.templateId,
        variable: message.variable,
      })
    } catch (error) {
      this.sendError(message.componentId, 'Failed to add variable', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle variable update
   */
  private async handleVariableUpdate(message: EmailVariableUpdateMessage): Promise<void> {
    try {
      const template = await this.getTemplate(message.templateId)
      if (!template) {
        this.sendError(message.componentId, 'Template not found', 'NOT_FOUND')
        return
      }

      const varIndex = template.variables.findIndex((v) => v.id === message.variableId)
      if (varIndex === -1) {
        this.sendError(message.componentId, 'Variable not found', 'NOT_FOUND')
        return
      }

      template.variables[varIndex] = message.variable

      // Send updated message
      const updatedMessage: EmailVariableUpdatedMessage = {
        type: 'emailVariableUpdated',
        componentId: message.componentId,
        templateId: message.templateId,
        variableId: message.variableId,
        variable: message.variable,
        timestamp: Date.now(),
      }
      this.transport.send(updatedMessage)

      // Emit event
      this.emit('variableUpdated', {
        componentId: message.componentId,
        templateId: message.templateId,
        variable: message.variable,
      })
    } catch (error) {
      this.sendError(message.componentId, 'Failed to update variable', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle variable delete
   */
  private async handleVariableDelete(message: EmailVariableDeleteMessage): Promise<void> {
    try {
      const template = await this.getTemplate(message.templateId)
      if (!template) {
        this.sendError(message.componentId, 'Template not found', 'NOT_FOUND')
        return
      }

      template.variables = template.variables.filter((v) => v.id !== message.variableId)

      // Send deleted message
      const deletedMessage: EmailVariableDeletedMessage = {
        type: 'emailVariableDeleted',
        componentId: message.componentId,
        templateId: message.templateId,
        variableId: message.variableId,
        timestamp: Date.now(),
      }
      this.transport.send(deletedMessage)

      // Emit event
      this.emit('variableDeleted', {
        componentId: message.componentId,
        templateId: message.templateId,
      })
    } catch (error) {
      this.sendError(message.componentId, 'Failed to delete variable', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle theme update
   */
  private async handleThemeUpdate(message: EmailThemeUpdateMessage): Promise<void> {
    try {
      const template = await this.getTemplate(message.templateId)
      if (!template) {
        this.sendError(message.componentId, 'Template not found', 'NOT_FOUND')
        return
      }

      template.theme = message.theme

      // Send updated message
      const updatedMessage: EmailThemeUpdatedMessage = {
        type: 'emailThemeUpdated',
        componentId: message.componentId,
        templateId: message.templateId,
        theme: message.theme,
        timestamp: Date.now(),
      }
      this.transport.send(updatedMessage)
    } catch (error) {
      this.sendError(message.componentId, 'Failed to update theme', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle template preview
   */
  private async handlePreview(message: EmailTemplatePreviewMessage): Promise<void> {
    try {
      const html = templateToHtml(message.template, message.variables)

      // Send preview response
      const responseMessage: EmailTemplatePreviewResponseMessage = {
        type: 'emailTemplatePreviewResponse',
        componentId: message.componentId,
        html,
        device: message.device,
        timestamp: Date.now(),
      }
      this.transport.send(responseMessage)
    } catch (error) {
      this.sendError(message.componentId, 'Failed to generate preview', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle template validation
   */
  private async handleValidate(message: EmailTemplateValidateMessage): Promise<void> {
    try {
      const validation = this.validateTemplate(message.template)

      // Send validation response
      const responseMessage: EmailTemplateValidationResponseMessage = {
        type: 'emailTemplateValidationResponse',
        componentId: message.componentId,
        validation,
        timestamp: Date.now(),
      }
      this.transport.send(responseMessage)

      // Emit event
      this.emit('templateValidated', {
        componentId: message.componentId,
        template: message.template,
      })
    } catch (error) {
      this.sendError(message.componentId, 'Failed to validate template', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Handle template send
   */
  private async handleSend(message: EmailTemplateSendMessage): Promise<void> {
    try {
      // Validate recipients
      const invalidEmails = message.recipients.filter((r) => !isValidEmail(r.email))
      if (invalidEmails.length > 0) {
        this.sendError(
          message.componentId,
          `Invalid email addresses: ${invalidEmails.map((r) => r.email).join(', ')}`,
          'INVALID_DATA'
        )
        return
      }

      // Send email
      const result = await this.options.sender.send({
        template: message.template,
        recipients: message.recipients,
        provider: message.provider,
      })

      // Send response
      const responseMessage: EmailTemplateSendResponseMessage = {
        type: 'emailTemplateSendResponse',
        componentId: message.componentId,
        result,
        timestamp: Date.now(),
      }
      this.transport.send(responseMessage)

      // Emit event
      this.emit('emailSent', {
        componentId: message.componentId,
      })
    } catch (error) {
      this.sendError(message.componentId, 'Failed to send email', 'SEND_FAILED', error)
    }
  }

  /**
   * Handle test send
   */
  private async handleTestSend(message: EmailTemplateTestSendMessage): Promise<void> {
    try {
      const result = await this.options.sender.sendTest({
        template: message.template,
        testEmail: message.testEmail,
        variables: message.variables,
      })

      // Send response
      const responseMessage: EmailTemplateTestSendResponseMessage = {
        type: 'emailTemplateTestSendResponse',
        componentId: message.componentId,
        result,
        timestamp: Date.now(),
      }
      this.transport.send(responseMessage)
    } catch (error) {
      this.sendError(message.componentId, 'Failed to send test email', 'SEND_FAILED', error)
    }
  }

  /**
   * Handle template duplicate
   */
  private async handleDuplicate(message: EmailTemplateDuplicateMessage): Promise<void> {
    try {
      const originalTemplate = await this.options.storage.load(message.templateId)
      if (!originalTemplate) {
        this.sendError(message.componentId, 'Template not found', 'NOT_FOUND')
        return
      }

      // Create duplicate with new ID and name
      const duplicateTemplate: EmailTemplate = {
        ...originalTemplate,
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          ...originalTemplate.metadata,
          name: message.newName,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const newTemplateId = await this.options.storage.save(duplicateTemplate)

      // Send duplicated message
      const duplicatedMessage: EmailTemplateDuplicatedMessage = {
        type: 'emailTemplateDuplicated',
        componentId: message.componentId,
        originalTemplateId: message.templateId,
        newTemplateId,
        template: duplicateTemplate,
        timestamp: Date.now(),
      }
      this.transport.send(duplicatedMessage)
    } catch (error) {
      this.sendError(message.componentId, 'Failed to duplicate template', 'OPERATION_FAILED', error)
    }
  }

  /**
   * Validate template
   */
  private validateTemplate(template: EmailTemplate): EmailTemplateValidation {
    const errors: Array<{ field: string; message: string; blockId?: string }> = []
    const warnings: Array<{ field: string; message: string; blockId?: string }> = []

    // Validate subject
    if (!template.subject || template.subject.trim() === '') {
      errors.push({ field: 'subject', message: 'Subject is required' })
    }

    // Check for preheader (warning)
    if (!template.preheader) {
      warnings.push({ field: 'preheader', message: 'Preheader is recommended for better engagement' })
    }

    // Validate blocks
    if (template.blocks.length === 0) {
      warnings.push({ field: 'blocks', message: 'Template has no content blocks' })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Sort templates
   */
  private sortTemplates(
    templates: EmailTemplateListItem[],
    sortBy: 'name' | 'updated' | 'usage' | 'created',
    order: 'asc' | 'desc'
  ): EmailTemplateListItem[] {
    const sorted = [...templates].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'updated':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime()
          break
        case 'usage':
          comparison = (a.usageCount || 0) - (b.usageCount || 0)
          break
      }

      return order === 'asc' ? comparison : -comparison
    })

    return sorted
  }

  /**
   * Schedule auto-save
   */
  private scheduleAutoSave(componentId: string, template: EmailTemplate): void {
    const existingTimer = this.autoSaveTimers.get(template.id)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const timer = setTimeout(async () => {
      try {
        await this.options.storage.save(template)
        this.autoSaveTimers.delete(template.id)
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, this.options.autoSaveDelay)

    this.autoSaveTimers.set(template.id, timer)
  }

  /**
   * Send error message
   */
  private sendError(
    componentId: string,
    message: string,
    code: EmailBuilderErrorMessage['errorCode'],
    details?: unknown
  ): void {
    const errorMessage: EmailBuilderErrorMessage = {
      type: 'emailBuilderError',
      componentId,
      error: message,
      errorCode: code,
      details,
      timestamp: Date.now(),
    }
    this.transport.send(errorMessage)

    this.emit('error', {
      componentId,
      error: {
        message,
        code,
        details,
      },
    })
  }

  /**
   * Get template from memory or load from storage
   */
  private async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    let template = this.templates.get(templateId)
    if (!template) {
      template = await this.options.storage.load(templateId)
      if (template) {
        this.templates.set(templateId, template)
      }
    }
    return template
  }

  /**
   * Register event handler
   */
  public on(event: EmailBuilderEventType, handler: EmailBuilderEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  /**
   * Unregister event handler
   */
  public off(event: EmailBuilderEventType, handler: EmailBuilderEventHandler): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  /**
   * Emit event
   */
  private emit(event: EmailBuilderEventType, data: EmailBuilderEventData): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data)
        } catch (error) {
          console.error('Error in event handler:', error)
        }
      }
    }
  }

  /**
   * Create default storage (in-memory)
   */
  private createDefaultStorage(): EmailTemplateStorage {
    const templates = new Map<string, EmailTemplate>()

    return {
      async save(template: EmailTemplate): Promise<string> {
        templates.set(template.id, template)
        return template.id
      },

      async load(id: string): Promise<EmailTemplate | null> {
        return templates.get(id) || null
      },

      async delete(id: string): Promise<void> {
        templates.delete(id)
      },

      async list(filters?: {
        category?: string
        tags?: string[]
        search?: string
      }): Promise<EmailTemplateListItem[]> {
        let items = Array.from(templates.values()).map((t) => ({
          id: t.id,
          name: t.metadata.name,
          description: t.metadata.description,
          category: t.metadata.category,
          tags: t.metadata.tags,
          previewImage: t.metadata.previewImage,
          updatedAt: t.metadata.updatedAt,
          isFavorite: false,
          usageCount: 0,
        }))

        // Apply filters
        if (filters?.category) {
          items = items.filter((t) => t.category === filters.category)
        }
        if (filters?.tags && filters.tags.length > 0) {
          items = items.filter((t) => t.tags?.some((tag) => filters.tags!.includes(tag)))
        }
        if (filters?.search) {
          const search = filters.search.toLowerCase()
          items = items.filter((t) => t.name.toLowerCase().includes(search))
        }

        return items
      },
    }
  }

  /**
   * Create default sender (mock)
   */
  private createDefaultSender(): EmailSender {
    return {
      async send(options) {
        return {
          jobId: `job_${Date.now()}`,
          status: 'sent',
          recipientCount: options.recipients.length,
          provider: options.provider || 'resend',
        }
      },

      async sendTest(options) {
        return {
          testId: `test_${Date.now()}`,
          status: 'success',
          recipientEmail: options.testEmail,
          sentAt: new Date(),
        }
      },
    }
  }

  /**
   * Destroy the handler
   */
  public destroy(): void {
    // Clear auto-save timers
    for (const timer of this.autoSaveTimers.values()) {
      clearTimeout(timer)
    }
    this.autoSaveTimers.clear()

    // Clear event handlers
    this.eventHandlers.clear()

    // Clear templates
    this.templates.clear()
  }
}
