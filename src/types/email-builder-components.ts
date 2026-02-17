/**
 * Email Template Builder Component Type Definitions for A2UI v0.9
 * Provides comprehensive email template building with WYSIWYG editor and preview
 * Issue #51
 */

import type { A2UIComponent } from './components.js'

/**
 * Email block types
 */
export type EmailBlockType =
  | 'text'
  | 'heading'
  | 'image'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'social'
  | 'video'
  | 'code'
  | 'html'
  | 'columns'
  | 'footer'

/**
 * Email variable types
 */
export type EmailVariableType = 'text' | 'number' | 'date' | 'boolean' | 'url' | 'email'

/**
 * Email alignment options
 */
export type EmailAlignment = 'left' | 'center' | 'right' | 'justify'

/**
 * Email provider types
 */
export type EmailProvider = 'resend' | 'sendgrid' | 'ses' | 'smtp' | 'mailgun' | 'postmark'

/**
 * Email theme modes
 */
export type EmailThemeMode = 'light' | 'dark' | 'auto'

/**
 * Email device preview types
 */
export type EmailDeviceType = 'desktop' | 'mobile' | 'tablet'

/**
 * Email send priority
 */
export type EmailPriority = 'low' | 'normal' | 'high' | 'urgent'

/**
 * Email status
 */
export type EmailStatus = 'draft' | 'scheduled' | 'sent' | 'failed' | 'cancelled'

/**
 * Email styles configuration
 */
export interface EmailStyles {
  /** Background color */
  backgroundColor?: string
  /** Text color */
  color?: string
  /** Font family */
  fontFamily?: string
  /** Font size */
  fontSize?: string
  /** Font weight */
  fontWeight?: string | number
  /** Line height */
  lineHeight?: string | number
  /** Text alignment */
  textAlign?: EmailAlignment
  /** Padding */
  padding?: string
  /** Margin */
  margin?: string
  /** Border */
  border?: string
  /** Border radius */
  borderRadius?: string
  /** Width */
  width?: string
  /** Height */
  height?: string
  /** Max width */
  maxWidth?: string
  /** Custom CSS properties */
  custom?: Record<string, string>
}

/**
 * Email variable definition
 */
export interface EmailVariable {
  /** Variable identifier */
  id: string
  /** Variable name for display */
  name: string
  /** Variable type */
  type: EmailVariableType
  /** Default value */
  defaultValue?: string | number | boolean
  /** Variable description */
  description?: string
  /** Whether variable is required */
  required?: boolean
  /** Validation pattern for text types */
  pattern?: string
  /** Example value */
  example?: string
}

/**
 * Email block base interface
 */
export interface EmailBlockBase {
  /** Block type */
  type: EmailBlockType
  /** Unique block identifier */
  id: string
  /** Block styles */
  styles?: EmailStyles
  /** Whether block is visible */
  visible?: boolean
  /** Conditional rendering expression */
  condition?: string
  /** Custom attributes */
  attributes?: Record<string, string>
}

/**
 * Text block
 */
export interface EmailTextBlock extends EmailBlockBase {
  type: 'text'
  /** Text content (supports variables) */
  content: string
  /** HTML content */
  html?: string
}

/**
 * Heading block
 */
export interface EmailHeadingBlock extends EmailBlockBase {
  type: 'heading'
  /** Heading level (1-6) */
  level: 1 | 2 | 3 | 4 | 5 | 6
  /** Heading content */
  content: string
}

/**
 * Image block
 */
export interface EmailImageBlock extends EmailBlockBase {
  type: 'image'
  /** Image URL */
  src: string
  /** Alt text */
  alt: string
  /** Link URL */
  href?: string
  /** Image width */
  width?: string | number
  /** Image height */
  height?: string | number
  /** Link target */
  target?: '_blank' | '_self'
}

/**
 * Button block
 */
export interface EmailButtonBlock extends EmailBlockBase {
  type: 'button'
  /** Button text */
  text: string
  /** Button link URL */
  href: string
  /** Link target */
  target?: '_blank' | '_self'
  /** Button background color */
  backgroundColor?: string
  /** Button text color */
  textColor?: string
}

/**
 * Divider block
 */
export interface EmailDividerBlock extends EmailBlockBase {
  type: 'divider'
  /** Divider color */
  color?: string
  /** Divider height */
  height?: string | number
}

/**
 * Spacer block
 */
export interface EmailSpacerBlock extends EmailBlockBase {
  type: 'spacer'
  /** Spacer height */
  height: string | number
}

/**
 * Social media link
 */
export interface SocialLink {
  /** Social platform */
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'github' | 'custom'
  /** Profile URL */
  url: string
  /** Custom icon URL (for custom platform) */
  icon?: string
  /** Custom icon alt text */
  alt?: string
}

/**
 * Social block
 */
export interface EmailSocialBlock extends EmailBlockBase {
  type: 'social'
  /** Social media links */
  links: SocialLink[]
  /** Icon size */
  iconSize?: string | number
  /** Space between icons */
  spacing?: string | number
}

/**
 * Video block
 */
export interface EmailVideoBlock extends EmailBlockBase {
  type: 'video'
  /** Video URL */
  src: string
  /** Video thumbnail URL */
  thumbnail: string
  /** Alt text */
  alt: string
  /** Video width */
  width?: string | number
  /** Video height */
  height?: string | number
}

/**
 * Code block
 */
export interface EmailCodeBlock extends EmailBlockBase {
  type: 'code'
  /** Code content */
  code: string
  /** Programming language */
  language?: string
  /** Show line numbers */
  lineNumbers?: boolean
}

/**
 * HTML block
 */
export interface EmailHtmlBlock extends EmailBlockBase {
  type: 'html'
  /** Raw HTML content */
  html: string
}

/**
 * Column configuration
 */
export interface EmailColumn {
  /** Column identifier */
  id: string
  /** Column width (e.g., '50%', '1/3') */
  width: string
  /** Blocks in this column */
  blocks: EmailBlock[]
  /** Column styles */
  styles?: EmailStyles
}

/**
 * Columns block
 */
export interface EmailColumnsBlock extends EmailBlockBase {
  type: 'columns'
  /** Column definitions */
  columns: EmailColumn[]
  /** Stack on mobile */
  stackOnMobile?: boolean
}

/**
 * Footer block
 */
export interface EmailFooterBlock extends EmailBlockBase {
  type: 'footer'
  /** Footer content */
  content: string
  /** Company name */
  companyName?: string
  /** Company address */
  companyAddress?: string
  /** Unsubscribe link */
  unsubscribeLink?: string
  /** Social links */
  socialLinks?: SocialLink[]
}

/**
 * Union of all email block types
 */
export type EmailBlock =
  | EmailTextBlock
  | EmailHeadingBlock
  | EmailImageBlock
  | EmailButtonBlock
  | EmailDividerBlock
  | EmailSpacerBlock
  | EmailSocialBlock
  | EmailVideoBlock
  | EmailCodeBlock
  | EmailHtmlBlock
  | EmailColumnsBlock
  | EmailFooterBlock

/**
 * Email theme configuration
 */
export interface EmailTheme {
  /** Theme name */
  name: string
  /** Theme mode */
  mode: EmailThemeMode
  /** Primary color */
  primaryColor: string
  /** Secondary color */
  secondaryColor: string
  /** Background color */
  backgroundColor: string
  /** Text color */
  textColor: string
  /** Font family */
  fontFamily: string
  /** Link color */
  linkColor: string
  /** Border color */
  borderColor: string
  /** Button styles */
  button?: {
    backgroundColor?: string
    textColor?: string
    borderRadius?: string
  }
  /** Container max width */
  containerMaxWidth?: string
}

/**
 * Email template metadata
 */
export interface EmailTemplateMetadata {
  /** Template name */
  name: string
  /** Template description */
  description?: string
  /** Template category */
  category?: string
  /** Template tags */
  tags?: string[]
  /** Template author */
  author?: string
  /** Creation timestamp */
  createdAt: Date
  /** Last updated timestamp */
  updatedAt: Date
  /** Template version */
  version?: string
  /** Is template public */
  isPublic?: boolean
  /** Preview image URL */
  previewImage?: string
}

/**
 * Email template definition
 */
export interface EmailTemplate {
  /** Template identifier */
  id: string
  /** Email subject line */
  subject: string
  /** Email preheader text */
  preheader?: string
  /** Email blocks */
  blocks: EmailBlock[]
  /** Available variables */
  variables: EmailVariable[]
  /** Template theme */
  theme?: EmailTheme
  /** Template metadata */
  metadata: EmailTemplateMetadata
  /** Template settings */
  settings?: EmailTemplateSettings
}

/**
 * Email template settings
 */
export interface EmailTemplateSettings {
  /** Enable tracking */
  tracking?: boolean
  /** Enable open tracking */
  trackOpens?: boolean
  /** Enable click tracking */
  trackClicks?: boolean
  /** Enable unsubscribe link */
  includeUnsubscribe?: boolean
  /** Custom headers */
  headers?: Record<string, string>
  /** Reply-to address */
  replyTo?: string
  /** From name */
  fromName?: string
  /** From email */
  fromEmail?: string
}

/**
 * Email recipient
 */
export interface EmailRecipient {
  /** Recipient email address */
  email: string
  /** Recipient name */
  name?: string
  /** Custom variables for this recipient */
  variables?: Record<string, string | number | boolean>
}

/**
 * Email schedule configuration
 */
export interface EmailSchedule {
  /** Scheduled send time */
  sendAt: Date
  /** Timezone for scheduling */
  timezone?: string
  /** Batch size for sending */
  batchSize?: number
  /** Delay between batches (ms) */
  batchDelay?: number
}

/**
 * Email Template Editor Component Properties
 */
export interface EmailTemplateEditorProperties {
  /** Current template */
  template?: EmailTemplate
  /** Available blocks */
  availableBlocks?: EmailBlockType[]
  /** Available themes */
  themes?: EmailTheme[]
  /** Current theme */
  currentTheme?: EmailTheme
  /** Available variables */
  variables?: EmailVariable[]
  /** Read-only mode */
  readonly?: boolean
  /** Auto-save enabled */
  autoSave?: boolean
  /** Auto-save delay (ms) */
  autoSaveDelay?: number
  /** Show block toolbar */
  showBlockToolbar?: boolean
  /** Show variable picker */
  showVariablePicker?: boolean
  /** Enable drag and drop */
  enableDragDrop?: boolean
  /** Enable undo/redo */
  enableUndo?: boolean
  /** Maximum undo history */
  maxUndoHistory?: number
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Email Template Editor Component
 */
export interface EmailTemplateEditorComponent extends A2UIComponent {
  type: 'emailTemplateEditor'
  properties?: EmailTemplateEditorProperties
}

/**
 * Email Template Preview Component Properties
 */
export interface EmailTemplatePreviewProperties {
  /** Template to preview */
  template: EmailTemplate
  /** Preview device type */
  device?: EmailDeviceType
  /** Variable values for preview */
  variables?: Record<string, string | number | boolean>
  /** Enable device switching */
  enableDeviceSwitch?: boolean
  /** Show HTML source */
  showHtmlSource?: boolean
  /** Show text version */
  showTextVersion?: boolean
  /** Enable interactive mode */
  interactive?: boolean
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Email Template Preview Component
 */
export interface EmailTemplatePreviewComponent extends A2UIComponent {
  type: 'emailTemplatePreview'
  properties: EmailTemplatePreviewProperties
}

/**
 * Email Template Send Component Properties
 */
export interface EmailTemplateSendProperties {
  /** Template to send */
  template: EmailTemplate
  /** Email provider */
  provider?: EmailProvider
  /** Recipients */
  recipients?: EmailRecipient[]
  /** Maximum recipients */
  maxRecipients?: number
  /** Enable scheduling */
  enableScheduling?: boolean
  /** Schedule configuration */
  schedule?: EmailSchedule
  /** Enable test send */
  enableTestSend?: boolean
  /** Test recipient email */
  testEmail?: string
  /** Priority */
  priority?: EmailPriority
  /** Show send confirmation */
  showConfirmation?: boolean
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Email Template Send Component
 */
export interface EmailTemplateSendComponent extends A2UIComponent {
  type: 'emailTemplateSend'
  properties: EmailTemplateSendProperties
}

/**
 * Email Template List Item
 */
export interface EmailTemplateListItem {
  /** Template identifier */
  id: string
  /** Template name */
  name: string
  /** Template description */
  description?: string
  /** Template category */
  category?: string
  /** Template tags */
  tags?: string[]
  /** Preview image URL */
  previewImage?: string
  /** Last updated */
  updatedAt: Date
  /** Is favorite */
  isFavorite?: boolean
  /** Usage count */
  usageCount?: number
}

/**
 * Email Template List Component Properties
 */
export interface EmailTemplateListProperties {
  /** Template list */
  templates?: EmailTemplateListItem[]
  /** Enable search */
  enableSearch?: boolean
  /** Enable filtering */
  enableFiltering?: boolean
  /** Available categories */
  categories?: string[]
  /** Available tags */
  tags?: string[]
  /** Sort options */
  sortBy?: 'name' | 'updated' | 'usage' | 'created'
  /** Sort order */
  sortOrder?: 'asc' | 'desc'
  /** Enable favorites */
  enableFavorites?: boolean
  /** Show preview on hover */
  showPreviewOnHover?: boolean
  /** Grid/List view */
  viewMode?: 'grid' | 'list'
  /** Items per page */
  itemsPerPage?: number
  /** Enable pagination */
  enablePagination?: boolean
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Email Template List Component
 */
export interface EmailTemplateListComponent extends A2UIComponent {
  type: 'emailTemplateList'
  properties?: EmailTemplateListProperties
}

/**
 * Email Template Variables Component Properties
 */
export interface EmailTemplateVariablesProperties {
  /** Available variables */
  variables: EmailVariable[]
  /** Current variable values */
  values?: Record<string, string | number | boolean>
  /** Enable variable creation */
  enableCreation?: boolean
  /** Enable variable editing */
  enableEditing?: boolean
  /** Enable variable deletion */
  enableDeletion?: boolean
  /** Show variable examples */
  showExamples?: boolean
  /** Group variables by type */
  groupByType?: boolean
  /** Enable variable testing */
  enableTesting?: boolean
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Email Template Variables Component
 */
export interface EmailTemplateVariablesComponent extends A2UIComponent {
  type: 'emailTemplateVariables'
  properties: EmailTemplateVariablesProperties
}

/**
 * Default email theme
 */
export const DEFAULT_EMAIL_THEME: EmailTheme = {
  name: 'Default',
  mode: 'light',
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  linkColor: '#3b82f6',
  borderColor: '#e5e7eb',
  button: {
    backgroundColor: '#3b82f6',
    textColor: '#ffffff',
    borderRadius: '6px',
  },
  containerMaxWidth: '600px',
}

/**
 * Default email template metadata
 */
export const DEFAULT_EMAIL_TEMPLATE_METADATA: Partial<EmailTemplateMetadata> = {
  category: 'general',
  tags: [],
  version: '1.0',
  isPublic: false,
}

/**
 * Default email template editor properties
 */
export const DEFAULT_EMAIL_TEMPLATE_EDITOR_PROPERTIES: Partial<EmailTemplateEditorProperties> = {
  availableBlocks: ['text', 'heading', 'image', 'button', 'divider', 'spacer', 'social', 'footer'],
  readonly: false,
  autoSave: true,
  autoSaveDelay: 2000,
  showBlockToolbar: true,
  showVariablePicker: true,
  enableDragDrop: true,
  enableUndo: true,
  maxUndoHistory: 50,
}

/**
 * Default email template preview properties
 */
export const DEFAULT_EMAIL_TEMPLATE_PREVIEW_PROPERTIES: Partial<EmailTemplatePreviewProperties> = {
  device: 'desktop',
  enableDeviceSwitch: true,
  showHtmlSource: false,
  showTextVersion: false,
  interactive: false,
}

/**
 * Default email template send properties
 */
export const DEFAULT_EMAIL_TEMPLATE_SEND_PROPERTIES: Partial<EmailTemplateSendProperties> = {
  provider: 'resend',
  maxRecipients: 1000,
  enableScheduling: true,
  enableTestSend: true,
  priority: 'normal',
  showConfirmation: true,
}

/**
 * Default email template list properties
 */
export const DEFAULT_EMAIL_TEMPLATE_LIST_PROPERTIES: Partial<EmailTemplateListProperties> = {
  enableSearch: true,
  enableFiltering: true,
  sortBy: 'updated',
  sortOrder: 'desc',
  enableFavorites: true,
  showPreviewOnHover: true,
  viewMode: 'grid',
  itemsPerPage: 20,
  enablePagination: true,
}

/**
 * Type guard for EmailTemplateEditorComponent
 */
export function isEmailTemplateEditorComponent(
  component: A2UIComponent
): component is EmailTemplateEditorComponent {
  return component.type === 'emailTemplateEditor'
}

/**
 * Type guard for EmailTemplatePreviewComponent
 */
export function isEmailTemplatePreviewComponent(
  component: A2UIComponent
): component is EmailTemplatePreviewComponent {
  return component.type === 'emailTemplatePreview'
}

/**
 * Type guard for EmailTemplateSendComponent
 */
export function isEmailTemplateSendComponent(
  component: A2UIComponent
): component is EmailTemplateSendComponent {
  return component.type === 'emailTemplateSend'
}

/**
 * Type guard for EmailTemplateListComponent
 */
export function isEmailTemplateListComponent(
  component: A2UIComponent
): component is EmailTemplateListComponent {
  return component.type === 'emailTemplateList'
}

/**
 * Type guard for EmailTemplateVariablesComponent
 */
export function isEmailTemplateVariablesComponent(
  component: A2UIComponent
): component is EmailTemplateVariablesComponent {
  return component.type === 'emailTemplateVariables'
}

/**
 * Helper to create email template editor component
 */
export function createEmailTemplateEditor(
  id: string,
  template?: EmailTemplate,
  properties?: Partial<EmailTemplateEditorProperties>
): EmailTemplateEditorComponent {
  return {
    id,
    type: 'emailTemplateEditor',
    properties: {
      ...DEFAULT_EMAIL_TEMPLATE_EDITOR_PROPERTIES,
      template,
      ...properties,
    },
  }
}

/**
 * Helper to create email template preview component
 */
export function createEmailTemplatePreview(
  id: string,
  template: EmailTemplate,
  properties?: Partial<EmailTemplatePreviewProperties>
): EmailTemplatePreviewComponent {
  return {
    id,
    type: 'emailTemplatePreview',
    properties: {
      ...DEFAULT_EMAIL_TEMPLATE_PREVIEW_PROPERTIES,
      template,
      ...properties,
    },
  }
}

/**
 * Helper to create email template send component
 */
export function createEmailTemplateSend(
  id: string,
  template: EmailTemplate,
  properties?: Partial<EmailTemplateSendProperties>
): EmailTemplateSendComponent {
  return {
    id,
    type: 'emailTemplateSend',
    properties: {
      ...DEFAULT_EMAIL_TEMPLATE_SEND_PROPERTIES,
      template,
      ...properties,
    },
  }
}

/**
 * Helper to create email template list component
 */
export function createEmailTemplateList(
  id: string,
  templates?: EmailTemplateListItem[],
  properties?: Partial<EmailTemplateListProperties>
): EmailTemplateListComponent {
  return {
    id,
    type: 'emailTemplateList',
    properties: {
      ...DEFAULT_EMAIL_TEMPLATE_LIST_PROPERTIES,
      templates,
      ...properties,
    },
  }
}

/**
 * Helper to create email template variables component
 */
export function createEmailTemplateVariables(
  id: string,
  variables: EmailVariable[],
  properties?: Partial<EmailTemplateVariablesProperties>
): EmailTemplateVariablesComponent {
  return {
    id,
    type: 'emailTemplateVariables',
    properties: {
      variables,
      enableCreation: true,
      enableEditing: true,
      enableDeletion: true,
      showExamples: true,
      groupByType: false,
      enableTesting: true,
      ...properties,
    },
  }
}

/**
 * Helper to create empty email template
 */
export function createEmptyEmailTemplate(name: string): EmailTemplate {
  return {
    id: `template_${Date.now()}`,
    subject: '',
    preheader: '',
    blocks: [],
    variables: [],
    theme: DEFAULT_EMAIL_THEME,
    metadata: {
      name,
      ...DEFAULT_EMAIL_TEMPLATE_METADATA,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as EmailTemplateMetadata,
  }
}

/**
 * Helper to validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Helper to replace variables in text
 */
export function replaceVariables(
  text: string,
  variables: Record<string, string | number | boolean>
): string {
  let result = text
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    result = result.replace(regex, String(value))
  }
  return result
}

/**
 * Helper to extract variables from text
 */
export function extractVariables(text: string): string[] {
  const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g
  const variables: string[] = []
  let match
  while ((match = regex.exec(text)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1])
    }
  }
  return variables
}

/**
 * Helper to convert template to HTML
 */
export function templateToHtml(
  template: EmailTemplate,
  variables?: Record<string, string | number | boolean>
): string {
  const theme = template.theme || DEFAULT_EMAIL_THEME
  const varValues = variables || {}

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${replaceVariables(template.subject, varValues)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: ${theme.fontFamily};
      background-color: ${theme.backgroundColor};
      color: ${theme.textColor};
    }
    .email-container {
      max-width: ${theme.containerMaxWidth};
      margin: 0 auto;
      padding: 20px;
    }
    a {
      color: ${theme.linkColor};
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
`

  for (const block of template.blocks) {
    html += blockToHtml(block, theme, varValues)
  }

  html += `
  </div>
</body>
</html>
`

  return html
}

/**
 * Helper to convert block to HTML
 */
function blockToHtml(
  block: EmailBlock,
  theme: EmailTheme,
  variables: Record<string, string | number | boolean>
): string {
  if (!block.visible && block.visible !== undefined) {
    return ''
  }

  const styles = block.styles || {}
  const styleString = Object.entries(styles)
    .map(([key, value]) => `${camelToKebab(key)}: ${value}`)
    .join('; ')

  switch (block.type) {
    case 'text':
      return `<p style="${styleString}">${replaceVariables(block.content, variables)}</p>`

    case 'heading':
      return `<h${block.level} style="${styleString}">${replaceVariables(block.content, variables)}</h${block.level}>`

    case 'image':
      const imgHtml = `<img src="${block.src}" alt="${block.alt}" style="${styleString}" />`
      return block.href ? `<a href="${block.href}" target="${block.target || '_blank'}">${imgHtml}</a>` : imgHtml

    case 'button':
      return `<a href="${block.href}" target="${block.target || '_blank'}" style="display: inline-block; padding: 12px 24px; background-color: ${block.backgroundColor || theme.button?.backgroundColor}; color: ${block.textColor || theme.button?.textColor}; border-radius: ${theme.button?.borderRadius}; ${styleString}">${block.text}</a>`

    case 'divider':
      return `<hr style="border: none; border-top: ${block.height || '1px'} solid ${block.color || theme.borderColor}; margin: 20px 0; ${styleString}" />`

    case 'spacer':
      return `<div style="height: ${typeof block.height === 'number' ? block.height + 'px' : block.height}; ${styleString}"></div>`

    case 'html':
      return block.html

    default:
      return ''
  }
}

/**
 * Helper to convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}
