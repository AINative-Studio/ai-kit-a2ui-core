/**
 * Client Action Message Types for A2UI v0.9
 * Message types for common browser API interactions and client-side actions
 *
 * This module provides type-safe definitions for 30+ client actions organized by category:
 * - Navigation: navigate, goBack, goForward, refresh, scrollTo
 * - UI Feedback: showToast, showModal, closeModal, showDialog, closeDialog, showNotification
 * - Data: copyToClipboard, downloadFile, uploadFile, shareContent
 * - Print: printPage
 * - Storage: setLocalStorage, getLocalStorage, removeLocalStorage, clearLocalStorage
 * - Permissions: requestPermission
 * - Media: getUserMedia, openCamera, openGallery
 * - Device: vibrate
 * - Analytics: trackEvent, trackPageView, setUserProperty
 * - External: openUrl, sendEmail, makePhoneCall, openMap
 */

import type { BaseMessage } from './protocol.js'

/**
 * Permission types that may be required for client actions
 */
export type PermissionType =
  | 'camera'
  | 'microphone'
  | 'geolocation'
  | 'notifications'
  | 'clipboard-write'
  | 'clipboard-read'
  | 'storage'
  | 'media-devices'

/**
 * All available client action types
 */
export type ClientActionType =
  // Navigation
  | 'navigate'
  | 'goBack'
  | 'goForward'
  | 'refresh'
  | 'scrollTo'
  // UI Feedback
  | 'showToast'
  | 'showModal'
  | 'closeModal'
  | 'showDialog'
  | 'closeDialog'
  | 'showNotification'
  // Data Operations
  | 'copyToClipboard'
  | 'downloadFile'
  | 'uploadFile'
  | 'shareContent'
  // Print
  | 'printPage'
  // Storage
  | 'setLocalStorage'
  | 'getLocalStorage'
  | 'removeLocalStorage'
  | 'clearLocalStorage'
  // Permissions
  | 'requestPermission'
  // Media
  | 'getUserMedia'
  | 'openCamera'
  | 'openGallery'
  // Device
  | 'vibrate'
  // Analytics
  | 'trackEvent'
  | 'trackPageView'
  | 'setUserProperty'
  // External
  | 'openUrl'
  | 'sendEmail'
  | 'makePhoneCall'
  | 'openMap'

// ============================================================================
// Navigation Actions
// ============================================================================

/**
 * Navigate to a URL
 * @example
 * ```typescript
 * const action: NavigateAction = {
 *   type: 'navigate',
 *   url: '/dashboard',
 *   target: '_self',
 *   replace: false
 * }
 * ```
 */
export interface NavigateAction {
  type: 'navigate'
  /** URL to navigate to */
  url: string
  /** Target window/frame (_self, _blank, _parent, _top) */
  target?: '_self' | '_blank' | '_parent' | '_top'
  /** Replace current history entry instead of adding new one */
  replace?: boolean
}

/**
 * Navigate back in history
 * @example
 * ```typescript
 * const action: GoBackAction = {
 *   type: 'goBack',
 *   steps: 1
 * }
 * ```
 */
export interface GoBackAction {
  type: 'goBack'
  /** Number of steps to go back (default: 1) */
  steps?: number
}

/**
 * Navigate forward in history
 * @example
 * ```typescript
 * const action: GoForwardAction = {
 *   type: 'goForward',
 *   steps: 1
 * }
 * ```
 */
export interface GoForwardAction {
  type: 'goForward'
  /** Number of steps to go forward (default: 1) */
  steps?: number
}

/**
 * Refresh the current page
 * @example
 * ```typescript
 * const action: RefreshAction = {
 *   type: 'refresh',
 *   forceReload: true
 * }
 * ```
 */
export interface RefreshAction {
  type: 'refresh'
  /** Force reload from server (bypass cache) */
  forceReload?: boolean
}

/**
 * Scroll to a position or element
 * @example
 * ```typescript
 * const action: ScrollToAction = {
 *   type: 'scrollTo',
 *   elementId: 'section-2',
 *   behavior: 'smooth'
 * }
 * ```
 */
export interface ScrollToAction {
  type: 'scrollTo'
  /** Element ID to scroll to */
  elementId?: string
  /** X coordinate (if not using elementId) */
  x?: number
  /** Y coordinate (if not using elementId) */
  y?: number
  /** Scroll behavior */
  behavior?: 'auto' | 'smooth' | 'instant'
}

// ============================================================================
// UI Feedback Actions
// ============================================================================

/**
 * Show a toast notification
 * @example
 * ```typescript
 * const action: ShowToastAction = {
 *   type: 'showToast',
 *   message: 'File saved successfully',
 *   variant: 'success',
 *   duration: 3000
 * }
 * ```
 */
export interface ShowToastAction {
  type: 'showToast'
  /** Toast message */
  message: string
  /** Toast variant */
  variant?: 'success' | 'error' | 'warning' | 'info'
  /** Duration in milliseconds (0 = permanent until dismissed) */
  duration?: number
  /** Position on screen */
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Optional action button */
  action?: {
    label: string
    actionId: string
  }
}

/**
 * Show a modal dialog
 * @example
 * ```typescript
 * const action: ShowModalAction = {
 *   type: 'showModal',
 *   modalId: 'confirmation-modal',
 *   title: 'Confirm Action',
 *   content: 'Are you sure you want to proceed?'
 * }
 * ```
 */
export interface ShowModalAction {
  type: 'showModal'
  /** Unique modal identifier */
  modalId: string
  /** Modal title */
  title?: string
  /** Modal content (HTML or plain text) */
  content: string
  /** Modal size */
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
  /** Can user close by clicking outside? */
  dismissible?: boolean
  /** Show close button */
  showCloseButton?: boolean
}

/**
 * Close a modal dialog
 * @example
 * ```typescript
 * const action: CloseModalAction = {
 *   type: 'closeModal',
 *   modalId: 'confirmation-modal'
 * }
 * ```
 */
export interface CloseModalAction {
  type: 'closeModal'
  /** Modal identifier to close */
  modalId: string
}

/**
 * Show a native browser dialog (alert, confirm, prompt)
 * @example
 * ```typescript
 * const action: ShowDialogAction = {
 *   type: 'showDialog',
 *   dialogType: 'confirm',
 *   message: 'Delete this item?'
 * }
 * ```
 */
export interface ShowDialogAction {
  type: 'showDialog'
  /** Dialog type */
  dialogType: 'alert' | 'confirm' | 'prompt'
  /** Dialog message */
  message: string
  /** Default value for prompt */
  defaultValue?: string
}

/**
 * Close any open dialogs
 * @example
 * ```typescript
 * const action: CloseDialogAction = {
 *   type: 'closeDialog'
 * }
 * ```
 */
export interface CloseDialogAction {
  type: 'closeDialog'
}

/**
 * Show a browser notification (requires permission)
 * Requires: notifications permission
 * @example
 * ```typescript
 * const action: ShowNotificationAction = {
 *   type: 'showNotification',
 *   title: 'New Message',
 *   body: 'You have a new message from John',
 *   icon: '/icons/message.png'
 * }
 * ```
 */
export interface ShowNotificationAction {
  type: 'showNotification'
  /** Notification title */
  title: string
  /** Notification body */
  body?: string
  /** Icon URL */
  icon?: string
  /** Badge URL */
  badge?: string
  /** Image URL */
  image?: string
  /** Tag for grouping/replacing notifications */
  tag?: string
  /** Require user interaction to dismiss */
  requireInteraction?: boolean
  /** Auto-close timeout in milliseconds */
  timeout?: number
  /** Notification actions */
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

// ============================================================================
// Data Operations
// ============================================================================

/**
 * Copy text to clipboard (requires permission)
 * Requires: clipboard-write permission
 * @example
 * ```typescript
 * const action: CopyToClipboardAction = {
 *   type: 'copyToClipboard',
 *   text: 'Hello, World!'
 * }
 * ```
 */
export interface CopyToClipboardAction {
  type: 'copyToClipboard'
  /** Text to copy */
  text: string
}

/**
 * Download a file
 * @example
 * ```typescript
 * const action: DownloadFileAction = {
 *   type: 'downloadFile',
 *   url: '/api/files/report.pdf',
 *   filename: 'monthly-report.pdf'
 * }
 * ```
 */
export interface DownloadFileAction {
  type: 'downloadFile'
  /** File URL or data URL */
  url: string
  /** Suggested filename */
  filename?: string
  /** MIME type */
  mimeType?: string
}

/**
 * Trigger file upload dialog
 * @example
 * ```typescript
 * const action: UploadFileAction = {
 *   type: 'uploadFile',
 *   accept: 'image/*',
 *   multiple: true
 * }
 * ```
 */
export interface UploadFileAction {
  type: 'uploadFile'
  /** Accepted file types (MIME types or extensions) */
  accept?: string
  /** Allow multiple files */
  multiple?: boolean
  /** Max file size in bytes */
  maxSize?: number
  /** Max number of files */
  maxFiles?: number
}

/**
 * Share content using Web Share API
 * @example
 * ```typescript
 * const action: ShareContentAction = {
 *   type: 'shareContent',
 *   title: 'Check this out',
 *   text: 'Amazing content!',
 *   url: 'https://example.com'
 * }
 * ```
 */
export interface ShareContentAction {
  type: 'shareContent'
  /** Title to share */
  title?: string
  /** Text content to share */
  text?: string
  /** URL to share */
  url?: string
  /** Files to share */
  files?: Array<{
    name: string
    type: string
    url: string
  }>
}

// ============================================================================
// Print Actions
// ============================================================================

/**
 * Print the current page or content
 * @example
 * ```typescript
 * const action: PrintPageAction = {
 *   type: 'printPage',
 *   elementId: 'printable-content'
 * }
 * ```
 */
export interface PrintPageAction {
  type: 'printPage'
  /** Optional element ID to print (if not provided, prints entire page) */
  elementId?: string
}

// ============================================================================
// Storage Actions
// ============================================================================

/**
 * Set localStorage item
 * @example
 * ```typescript
 * const action: SetLocalStorageAction = {
 *   type: 'setLocalStorage',
 *   key: 'user-preferences',
 *   value: { theme: 'dark', language: 'en' }
 * }
 * ```
 */
export interface SetLocalStorageAction {
  type: 'setLocalStorage'
  /** Storage key */
  key: string
  /** Value to store (will be JSON.stringify'd) */
  value: unknown
}

/**
 * Get localStorage item
 * @example
 * ```typescript
 * const action: GetLocalStorageAction = {
 *   type: 'getLocalStorage',
 *   key: 'user-preferences'
 * }
 * ```
 */
export interface GetLocalStorageAction {
  type: 'getLocalStorage'
  /** Storage key to retrieve */
  key: string
}

/**
 * Remove localStorage item
 * @example
 * ```typescript
 * const action: RemoveLocalStorageAction = {
 *   type: 'removeLocalStorage',
 *   key: 'old-data'
 * }
 * ```
 */
export interface RemoveLocalStorageAction {
  type: 'removeLocalStorage'
  /** Storage key to remove */
  key: string
}

/**
 * Clear all localStorage
 * @example
 * ```typescript
 * const action: ClearLocalStorageAction = {
 *   type: 'clearLocalStorage',
 *   confirm: true
 * }
 * ```
 */
export interface ClearLocalStorageAction {
  type: 'clearLocalStorage'
  /** Require confirmation before clearing */
  confirm?: boolean
}

// ============================================================================
// Permission Actions
// ============================================================================

/**
 * Request browser permission
 * @example
 * ```typescript
 * const action: RequestPermissionAction = {
 *   type: 'requestPermission',
 *   permission: 'camera',
 *   rationale: 'We need camera access to take profile photos'
 * }
 * ```
 */
export interface RequestPermissionAction {
  type: 'requestPermission'
  /** Permission to request */
  permission: PermissionType
  /** Optional rationale to show user */
  rationale?: string
}

// ============================================================================
// Media Actions
// ============================================================================

/**
 * Get user media (camera/microphone access)
 * Requires: camera and/or microphone permission
 * @example
 * ```typescript
 * const action: GetUserMediaAction = {
 *   type: 'getUserMedia',
 *   audio: true,
 *   video: { width: 1280, height: 720 }
 * }
 * ```
 */
export interface GetUserMediaAction {
  type: 'getUserMedia'
  /** Request audio stream */
  audio?: boolean | MediaTrackConstraints
  /** Request video stream */
  video?: boolean | MediaTrackConstraints
}

/**
 * Open camera for photo/video capture
 * Requires: camera permission
 * @example
 * ```typescript
 * const action: OpenCameraAction = {
 *   type: 'openCamera',
 *   mode: 'photo',
 *   facingMode: 'user'
 * }
 * ```
 */
export interface OpenCameraAction {
  type: 'openCamera'
  /** Capture mode */
  mode?: 'photo' | 'video'
  /** Camera facing mode */
  facingMode?: 'user' | 'environment'
  /** Video max duration in seconds */
  maxDuration?: number
}

/**
 * Open gallery/file picker for media selection
 * @example
 * ```typescript
 * const action: OpenGalleryAction = {
 *   type: 'openGallery',
 *   mediaType: 'image',
 *   multiple: true
 * }
 * ```
 */
export interface OpenGalleryAction {
  type: 'openGallery'
  /** Media type to select */
  mediaType?: 'image' | 'video' | 'audio' | 'all'
  /** Allow multiple selection */
  multiple?: boolean
  /** Max number of selections */
  maxSelections?: number
}

// ============================================================================
// Device Actions
// ============================================================================

/**
 * Vibrate the device
 * @example
 * ```typescript
 * const action: VibrateAction = {
 *   type: 'vibrate',
 *   pattern: [100, 50, 100]
 * }
 * ```
 */
export interface VibrateAction {
  type: 'vibrate'
  /** Vibration pattern (duration or [duration, pause, duration, ...]) */
  pattern?: number | number[]
}

// ============================================================================
// Analytics Actions
// ============================================================================

/**
 * Track an analytics event
 * @example
 * ```typescript
 * const action: TrackEventAction = {
 *   type: 'trackEvent',
 *   eventName: 'button_click',
 *   properties: { button_id: 'submit', page: 'checkout' }
 * }
 * ```
 */
export interface TrackEventAction {
  type: 'trackEvent'
  /** Event name */
  eventName: string
  /** Event properties */
  properties?: Record<string, unknown>
  /** Event value (for conversion tracking) */
  value?: number
}

/**
 * Track a page view
 * @example
 * ```typescript
 * const action: TrackPageViewAction = {
 *   type: 'trackPageView',
 *   page: '/dashboard',
 *   title: 'Dashboard'
 * }
 * ```
 */
export interface TrackPageViewAction {
  type: 'trackPageView'
  /** Page path */
  page: string
  /** Page title */
  title?: string
  /** Additional properties */
  properties?: Record<string, unknown>
}

/**
 * Set a user property for analytics
 * @example
 * ```typescript
 * const action: SetUserPropertyAction = {
 *   type: 'setUserProperty',
 *   property: 'plan',
 *   value: 'premium'
 * }
 * ```
 */
export interface SetUserPropertyAction {
  type: 'setUserProperty'
  /** Property name */
  property: string
  /** Property value */
  value: unknown
}

// ============================================================================
// External Actions
// ============================================================================

/**
 * Open external URL
 * @example
 * ```typescript
 * const action: OpenUrlAction = {
 *   type: 'openUrl',
 *   url: 'https://example.com',
 *   target: '_blank'
 * }
 * ```
 */
export interface OpenUrlAction {
  type: 'openUrl'
  /** URL to open */
  url: string
  /** Target window */
  target?: '_blank' | '_self'
}

/**
 * Send email using mailto: protocol
 * @example
 * ```typescript
 * const action: SendEmailAction = {
 *   type: 'sendEmail',
 *   to: 'support@example.com',
 *   subject: 'Help Request',
 *   body: 'I need help with...'
 * }
 * ```
 */
export interface SendEmailAction {
  type: 'sendEmail'
  /** Recipient email address */
  to: string
  /** Email subject */
  subject?: string
  /** Email body */
  body?: string
  /** CC recipients */
  cc?: string[]
  /** BCC recipients */
  bcc?: string[]
}

/**
 * Make phone call using tel: protocol
 * @example
 * ```typescript
 * const action: MakePhoneCallAction = {
 *   type: 'makePhoneCall',
 *   phoneNumber: '+1-555-0100'
 * }
 * ```
 */
export interface MakePhoneCallAction {
  type: 'makePhoneCall'
  /** Phone number to call */
  phoneNumber: string
}

/**
 * Open maps application with location or directions
 * @example
 * ```typescript
 * const action: OpenMapAction = {
 *   type: 'openMap',
 *   address: '1600 Amphitheatre Parkway, Mountain View, CA'
 * }
 * ```
 */
export interface OpenMapAction {
  type: 'openMap'
  /** Address to show */
  address?: string
  /** Latitude coordinate */
  latitude?: number
  /** Longitude coordinate */
  longitude?: number
  /** Destination address for directions */
  destination?: string
  /** Travel mode for directions */
  travelMode?: 'driving' | 'walking' | 'bicycling' | 'transit'
}

// ============================================================================
// Union Types
// ============================================================================

/**
 * Union of all specific client action types
 */
export type SpecificClientAction =
  // Navigation
  | NavigateAction
  | GoBackAction
  | GoForwardAction
  | RefreshAction
  | ScrollToAction
  // UI Feedback
  | ShowToastAction
  | ShowModalAction
  | CloseModalAction
  | ShowDialogAction
  | CloseDialogAction
  | ShowNotificationAction
  // Data
  | CopyToClipboardAction
  | DownloadFileAction
  | UploadFileAction
  | ShareContentAction
  // Print
  | PrintPageAction
  // Storage
  | SetLocalStorageAction
  | GetLocalStorageAction
  | RemoveLocalStorageAction
  | ClearLocalStorageAction
  // Permissions
  | RequestPermissionAction
  // Media
  | GetUserMediaAction
  | OpenCameraAction
  | OpenGalleryAction
  // Device
  | VibrateAction
  // Analytics
  | TrackEventAction
  | TrackPageViewAction
  | SetUserPropertyAction
  // External
  | OpenUrlAction
  | SendEmailAction
  | MakePhoneCallAction
  | OpenMapAction

// ============================================================================
// Message Types
// ============================================================================

/**
 * Client Action Message (Agent → UI)
 * Instructs the UI to perform a client-side action
 * @example
 * ```typescript
 * const message: ClientActionMessage = {
 *   type: 'clientAction',
 *   surfaceId: 'main-surface',
 *   actionId: 'action-123',
 *   actionType: 'navigate',
 *   action: {
 *     type: 'navigate',
 *     url: '/dashboard',
 *     target: '_self'
 *   },
 *   timestamp: Date.now()
 * }
 * ```
 */
export interface ClientActionMessage extends BaseMessage {
  type: 'clientAction'
  /** Surface identifier */
  surfaceId: string
  /** Unique action identifier for tracking response */
  actionId: string
  /** Type of client action */
  actionType: ClientActionType
  /** Specific action details */
  action: SpecificClientAction
  /** Whether this action requires explicit permission */
  requiresPermission?: boolean
  /** Permission type required (if requiresPermission is true) */
  permissionType?: PermissionType
}

/**
 * Client Action Response Message (UI → Agent)
 * Reports the result of a client action
 * @example
 * ```typescript
 * const response: ClientActionResponseMessage = {
 *   type: 'clientActionResponse',
 *   actionId: 'action-123',
 *   success: true,
 *   result: { navigated: true },
 *   timestamp: Date.now()
 * }
 * ```
 */
export interface ClientActionResponseMessage extends BaseMessage {
  type: 'clientActionResponse'
  /** Action identifier from the original request */
  actionId: string
  /** Whether the action succeeded */
  success: boolean
  /** Result data (varies by action type) */
  result?: unknown
  /** Error message if action failed */
  error?: string
  /** Error code for programmatic handling */
  errorCode?: string
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for ClientActionMessage
 */
export function isClientActionMessage(msg: unknown): msg is ClientActionMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as BaseMessage).type === 'clientAction' &&
    'surfaceId' in msg &&
    'actionId' in msg &&
    'actionType' in msg &&
    'action' in msg
  )
}

/**
 * Type guard for ClientActionResponseMessage
 */
export function isClientActionResponseMessage(msg: unknown): msg is ClientActionResponseMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as BaseMessage).type === 'clientActionResponse' &&
    'actionId' in msg &&
    'success' in msg
  )
}

// Navigation action type guards
export function isNavigateAction(action: SpecificClientAction): action is NavigateAction {
  return action.type === 'navigate'
}

export function isGoBackAction(action: SpecificClientAction): action is GoBackAction {
  return action.type === 'goBack'
}

export function isGoForwardAction(action: SpecificClientAction): action is GoForwardAction {
  return action.type === 'goForward'
}

export function isRefreshAction(action: SpecificClientAction): action is RefreshAction {
  return action.type === 'refresh'
}

export function isScrollToAction(action: SpecificClientAction): action is ScrollToAction {
  return action.type === 'scrollTo'
}

// UI Feedback action type guards
export function isShowToastAction(action: SpecificClientAction): action is ShowToastAction {
  return action.type === 'showToast'
}

export function isShowModalAction(action: SpecificClientAction): action is ShowModalAction {
  return action.type === 'showModal'
}

export function isCloseModalAction(action: SpecificClientAction): action is CloseModalAction {
  return action.type === 'closeModal'
}

export function isShowDialogAction(action: SpecificClientAction): action is ShowDialogAction {
  return action.type === 'showDialog'
}

export function isCloseDialogAction(action: SpecificClientAction): action is CloseDialogAction {
  return action.type === 'closeDialog'
}

export function isShowNotificationAction(action: SpecificClientAction): action is ShowNotificationAction {
  return action.type === 'showNotification'
}

// Data operation type guards
export function isCopyToClipboardAction(action: SpecificClientAction): action is CopyToClipboardAction {
  return action.type === 'copyToClipboard'
}

export function isDownloadFileAction(action: SpecificClientAction): action is DownloadFileAction {
  return action.type === 'downloadFile'
}

export function isUploadFileAction(action: SpecificClientAction): action is UploadFileAction {
  return action.type === 'uploadFile'
}

export function isShareContentAction(action: SpecificClientAction): action is ShareContentAction {
  return action.type === 'shareContent'
}

// Print action type guard
export function isPrintPageAction(action: SpecificClientAction): action is PrintPageAction {
  return action.type === 'printPage'
}

// Storage action type guards
export function isSetLocalStorageAction(action: SpecificClientAction): action is SetLocalStorageAction {
  return action.type === 'setLocalStorage'
}

export function isGetLocalStorageAction(action: SpecificClientAction): action is GetLocalStorageAction {
  return action.type === 'getLocalStorage'
}

export function isRemoveLocalStorageAction(action: SpecificClientAction): action is RemoveLocalStorageAction {
  return action.type === 'removeLocalStorage'
}

export function isClearLocalStorageAction(action: SpecificClientAction): action is ClearLocalStorageAction {
  return action.type === 'clearLocalStorage'
}

// Permission action type guard
export function isRequestPermissionAction(action: SpecificClientAction): action is RequestPermissionAction {
  return action.type === 'requestPermission'
}

// Media action type guards
export function isGetUserMediaAction(action: SpecificClientAction): action is GetUserMediaAction {
  return action.type === 'getUserMedia'
}

export function isOpenCameraAction(action: SpecificClientAction): action is OpenCameraAction {
  return action.type === 'openCamera'
}

export function isOpenGalleryAction(action: SpecificClientAction): action is OpenGalleryAction {
  return action.type === 'openGallery'
}

// Device action type guard
export function isVibrateAction(action: SpecificClientAction): action is VibrateAction {
  return action.type === 'vibrate'
}

// Analytics action type guards
export function isTrackEventAction(action: SpecificClientAction): action is TrackEventAction {
  return action.type === 'trackEvent'
}

export function isTrackPageViewAction(action: SpecificClientAction): action is TrackPageViewAction {
  return action.type === 'trackPageView'
}

export function isSetUserPropertyAction(action: SpecificClientAction): action is SetUserPropertyAction {
  return action.type === 'setUserProperty'
}

// External action type guards
export function isOpenUrlAction(action: SpecificClientAction): action is OpenUrlAction {
  return action.type === 'openUrl'
}

export function isSendEmailAction(action: SpecificClientAction): action is SendEmailAction {
  return action.type === 'sendEmail'
}

export function isMakePhoneCallAction(action: SpecificClientAction): action is MakePhoneCallAction {
  return action.type === 'makePhoneCall'
}

export function isOpenMapAction(action: SpecificClientAction): action is OpenMapAction {
  return action.type === 'openMap'
}
