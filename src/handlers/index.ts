/**
 * A2UI Protocol Handlers
 * Event-driven handlers for protocol messages
 */

export {
  ProgressHandler,
  type ProgressEventType,
  type ProgressEventData,
  type ProgressEventHandler,
  type ProgressSyncStrategy,
  type ProgressHandlerOptions,
} from './progress-handler.js'

export {
  NotificationHandler,
  type NotificationEventType,
  type NotificationEventData,
  type NotificationEventHandler,
  type NotificationService,
  type NotificationStorage,
  type NotificationHandlerOptions,
} from './notification-handler.js'

export {
  AuthHandler,
  type AuthService,
  type AuthResult,
  type SignupData,
  type SignupResult,
  type PasswordResetRequestResult,
  type PasswordResetVerifyResult,
  type ProfileUpdates,
  type TwoFactorSetupResult,
  type TwoFactorVerifyResult,
  type OAuthInitiateResult,
  type TokenRefreshResult,
  type AuthHandlerOptions,
  type AuthEventType,
  type AuthEventHandler,
} from './auth-handler.js'

export {
  CollaborationHandler,
  type CollaborationEventType,
  type CollaborationEventData,
  type CollaborationEventHandler,
  type CollaborationHandlerOptions,
} from './collaboration-handler.js'

export {
  OfflineHandler,
  offlineHandler,
} from './offline-handler.js'

export {
  EmailBuilderHandler,
  type EmailBuilderEventType,
  type EmailBuilderEventData,
  type EmailBuilderEventHandler,
  type EmailTemplateStorage,
  type EmailSender,
  type EmailBuilderHandlerOptions,
} from './email-builder-handler.js'
