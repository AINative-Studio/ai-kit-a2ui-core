/**
 * A2UI Authentication Message Type Definitions (Issue #48)
 * Comprehensive auth message types for authentication flow operations
 */

import type { AuthProvider } from './auth-components.js'

/**
 * User data structure for authentication responses
 */
export interface AuthUser {
  id: string
  email: string
  name?: string
  username?: string
  firstName?: string
  lastName?: string
  avatar?: string
  phone?: string
}

/**
 * Authentication error codes
 */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'account_locked'
  | 'mfa_required'
  | 'account_not_verified'
  | 'email_already_exists'
  | 'username_taken'
  | 'weak_password'
  | 'invalid_token'
  | 'token_expired'
  | 'invalid_code'
  | 'session_not_found'
  | 'permission_denied'
  | 'rate_limit_exceeded'
  | 'server_error'
  | 'network_error'

/**
 * Session information structure
 */
export interface Session {
  sessionId: string
  deviceId: string
  deviceName?: string
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'other'
  browser?: string
  os?: string
  location?: {
    city?: string
    country?: string
    ip?: string
  }
  createdAt: string
  lastActiveAt: string
  expiresAt?: string
  isCurrent?: boolean
}

/**
 * OAuth configuration structure
 */
export interface OAuthConfig {
  clientId: string
  redirectUri: string
  scopes?: string[]
  state?: string
}

// ============================================================================
// LOGIN MESSAGES
// ============================================================================

/**
 * Login request message (UI → Agent)
 */
export interface AuthLoginMessage {
  type: 'authLogin'
  componentId: string
  provider: AuthProvider
  credentials?: {
    email?: string
    password?: string
  }
  oauthToken?: string
  rememberMe?: boolean
  metadata?: Record<string, any>
}

/**
 * Login success response message (Agent → UI)
 */
export interface AuthLoginSuccessMessage {
  type: 'authLoginSuccess'
  componentId: string
  user: AuthUser
  accessToken: string
  refreshToken?: string
  expiresIn: number
  requiresMFA?: boolean
  mfaToken?: string
  session?: Session
}

/**
 * Login error response message (Agent → UI)
 */
export interface AuthLoginErrorMessage {
  type: 'authLoginError'
  componentId: string
  error: {
    code: AuthErrorCode
    message: string
    details?: any
  }
}

// ============================================================================
// SIGNUP MESSAGES
// ============================================================================

/**
 * Signup request message (UI → Agent)
 */
export interface AuthSignupMessage {
  type: 'authSignup'
  componentId: string
  provider: AuthProvider
  data: {
    email: string
    password?: string
    username?: string
    firstName?: string
    lastName?: string
    phone?: string
    company?: string
    website?: string
    bio?: string
    termsAccepted: boolean
    privacyAccepted?: boolean
  }
  oauthToken?: string
  metadata?: Record<string, any>
}

/**
 * Signup success response message (Agent → UI)
 */
export interface AuthSignupSuccessMessage {
  type: 'authSignupSuccess'
  componentId: string
  user: AuthUser
  requiresVerification: boolean
  verificationMethod?: 'email' | 'sms'
  verificationSentTo?: string
  accessToken?: string
  refreshToken?: string
  expiresIn?: number
}

/**
 * Signup error response message (Agent → UI)
 */
export interface AuthSignupErrorMessage {
  type: 'authSignupError'
  componentId: string
  error: {
    code: AuthErrorCode
    message: string
    fieldErrors?: Record<string, string>
    details?: any
  }
}

// ============================================================================
// PASSWORD RESET MESSAGES
// ============================================================================

/**
 * Password reset request message (UI → Agent)
 */
export interface AuthPasswordResetRequestMessage {
  type: 'authPasswordResetRequest'
  componentId: string
  email: string
  method: 'email' | 'sms'
  metadata?: Record<string, any>
}

/**
 * Password reset request success response (Agent → UI)
 */
export interface AuthPasswordResetRequestSuccessMessage {
  type: 'authPasswordResetRequestSuccess'
  componentId: string
  sentTo: string
  expiresIn: number
}

/**
 * Password reset verify code message (UI → Agent)
 */
export interface AuthPasswordResetVerifyMessage {
  type: 'authPasswordResetVerify'
  componentId: string
  code: string
  token: string
}

/**
 * Password reset verify success response (Agent → UI)
 */
export interface AuthPasswordResetVerifySuccessMessage {
  type: 'authPasswordResetVerifySuccess'
  componentId: string
  verified: boolean
  resetToken: string
}

/**
 * Password reset complete message (UI → Agent)
 */
export interface AuthPasswordResetCompleteMessage {
  type: 'authPasswordResetComplete'
  componentId: string
  resetToken: string
  newPassword: string
}

/**
 * Password reset complete success response (Agent → UI)
 */
export interface AuthPasswordResetCompleteSuccessMessage {
  type: 'authPasswordResetCompleteSuccess'
  componentId: string
  success: boolean
}

/**
 * Password reset error response (Agent → UI)
 */
export interface AuthPasswordResetErrorMessage {
  type: 'authPasswordResetError'
  componentId: string
  error: {
    code: AuthErrorCode
    message: string
    details?: any
  }
}

// ============================================================================
// PROFILE MESSAGES
// ============================================================================

/**
 * Profile update request message (UI → Agent)
 */
export interface AuthProfileUpdateMessage {
  type: 'authProfileUpdate'
  componentId: string
  updates: {
    email?: string
    username?: string
    firstName?: string
    lastName?: string
    phone?: string
    avatar?: string
    bio?: string
    company?: string
    website?: string
  }
  metadata?: Record<string, any>
}

/**
 * Profile update success response (Agent → UI)
 */
export interface AuthProfileUpdateSuccessMessage {
  type: 'authProfileUpdateSuccess'
  componentId: string
  user: AuthUser
  requiresVerification?: boolean
  verificationSentTo?: string
}

/**
 * Profile update error response (Agent → UI)
 */
export interface AuthProfileUpdateErrorMessage {
  type: 'authProfileUpdateError'
  componentId: string
  error: {
    code: AuthErrorCode
    message: string
    fieldErrors?: Record<string, string>
    details?: any
  }
}

/**
 * Password change request message (UI → Agent)
 */
export interface AuthPasswordChangeMessage {
  type: 'authPasswordChange'
  componentId: string
  currentPassword: string
  newPassword: string
}

/**
 * Password change success response (Agent → UI)
 */
export interface AuthPasswordChangeSuccessMessage {
  type: 'authPasswordChangeSuccess'
  componentId: string
  success: boolean
}

/**
 * Password change error response (Agent → UI)
 */
export interface AuthPasswordChangeErrorMessage {
  type: 'authPasswordChangeError'
  componentId: string
  error: {
    code: AuthErrorCode
    message: string
    details?: any
  }
}

// ============================================================================
// SESSION MESSAGES
// ============================================================================

/**
 * Session list request message (UI → Agent)
 */
export interface AuthSessionListMessage {
  type: 'authSessionList'
  componentId: string
}

/**
 * Session list response message (Agent → UI)
 */
export interface AuthSessionListResponseMessage {
  type: 'authSessionListResponse'
  componentId: string
  sessions: Session[]
  currentSessionId: string
}

/**
 * Session terminate request message (UI → Agent)
 */
export interface AuthSessionTerminateMessage {
  type: 'authSessionTerminate'
  componentId: string
  sessionId: string
}

/**
 * Session terminate success response (Agent → UI)
 */
export interface AuthSessionTerminateSuccessMessage {
  type: 'authSessionTerminateSuccess'
  componentId: string
  sessionId: string
}

/**
 * Session error response (Agent → UI)
 */
export interface AuthSessionErrorMessage {
  type: 'authSessionError'
  componentId: string
  error: {
    code: AuthErrorCode
    message: string
    details?: any
  }
}

// ============================================================================
// TWO-FACTOR AUTHENTICATION MESSAGES
// ============================================================================

/**
 * 2FA setup request message (UI → Agent)
 */
export interface Auth2FASetupMessage {
  type: 'auth2FASetup'
  componentId: string
  method: 'totp' | 'sms' | 'email'
}

/**
 * 2FA setup response message (Agent → UI)
 */
export interface Auth2FASetupResponseMessage {
  type: 'auth2FASetupResponse'
  componentId: string
  method: 'totp' | 'sms' | 'email'
  secret?: string
  qrCode?: string
  backupCodes?: string[]
}

/**
 * 2FA verify request message (UI → Agent)
 */
export interface Auth2FAVerifyMessage {
  type: 'auth2FAVerify'
  componentId: string
  code: string
  secret?: string
  method?: 'totp' | 'sms' | 'email'
}

/**
 * 2FA verify success response (Agent → UI)
 */
export interface Auth2FAVerifySuccessMessage {
  type: 'auth2FAVerifySuccess'
  componentId: string
  verified: boolean
  accessToken?: string
  refreshToken?: string
  expiresIn?: number
}

/**
 * 2FA disable request message (UI → Agent)
 */
export interface Auth2FADisableMessage {
  type: 'auth2FADisable'
  componentId: string
  password: string
}

/**
 * 2FA disable success response (Agent → UI)
 */
export interface Auth2FADisableSuccessMessage {
  type: 'auth2FADisableSuccess'
  componentId: string
  success: boolean
}

/**
 * 2FA error response (Agent → UI)
 */
export interface Auth2FAErrorMessage {
  type: 'auth2FAError'
  componentId: string
  error: {
    code: AuthErrorCode
    message: string
    details?: any
  }
}

// ============================================================================
// OAUTH MESSAGES
// ============================================================================

/**
 * OAuth initiate request message (UI → Agent)
 */
export interface AuthOAuthInitiateMessage {
  type: 'authOAuthInitiate'
  componentId: string
  provider: AuthProvider
  redirectUrl: string
  state?: string
  scopes?: string[]
}

/**
 * OAuth initiate response message (Agent → UI)
 */
export interface AuthOAuthInitiateResponseMessage {
  type: 'authOAuthInitiateResponse'
  componentId: string
  authUrl: string
  state: string
}

/**
 * OAuth callback message (UI → Agent)
 */
export interface AuthOAuthCallbackMessage {
  type: 'authOAuthCallback'
  componentId: string
  provider: AuthProvider
  code: string
  state?: string
}

/**
 * OAuth callback success response (Agent → UI)
 */
export interface AuthOAuthCallbackSuccessMessage {
  type: 'authOAuthCallbackSuccess'
  componentId: string
  user: AuthUser
  accessToken: string
  refreshToken?: string
  expiresIn: number
  session?: Session
}

/**
 * OAuth error response (Agent → UI)
 */
export interface AuthOAuthErrorMessage {
  type: 'authOAuthError'
  componentId: string
  error: {
    code: AuthErrorCode
    message: string
    details?: any
  }
}

// ============================================================================
// LOGOUT MESSAGES
// ============================================================================

/**
 * Logout request message (UI → Agent)
 */
export interface AuthLogoutMessage {
  type: 'authLogout'
  componentId: string
  allSessions?: boolean
}

/**
 * Logout success response (Agent → UI)
 */
export interface AuthLogoutSuccessMessage {
  type: 'authLogoutSuccess'
  componentId: string
  success: boolean
}

/**
 * Logout error response (Agent → UI)
 */
export interface AuthLogoutErrorMessage {
  type: 'authLogoutError'
  componentId: string
  error: {
    code: AuthErrorCode
    message: string
    details?: any
  }
}

// ============================================================================
// EMAIL VERIFICATION MESSAGES
// ============================================================================

/**
 * Email verification request message (UI → Agent)
 */
export interface AuthEmailVerificationRequestMessage {
  type: 'authEmailVerificationRequest'
  componentId: string
  email: string
}

/**
 * Email verification verify message (UI → Agent)
 */
export interface AuthEmailVerificationVerifyMessage {
  type: 'authEmailVerificationVerify'
  componentId: string
  code: string
  token: string
}

/**
 * Email verification success response (Agent → UI)
 */
export interface AuthEmailVerificationSuccessMessage {
  type: 'authEmailVerificationSuccess'
  componentId: string
  verified: boolean
}

// ============================================================================
// TOKEN REFRESH MESSAGES
// ============================================================================

/**
 * Token refresh request message (UI → Agent)
 */
export interface AuthTokenRefreshMessage {
  type: 'authTokenRefresh'
  componentId: string
  refreshToken: string
}

/**
 * Token refresh success response (Agent → UI)
 */
export interface AuthTokenRefreshSuccessMessage {
  type: 'authTokenRefreshSuccess'
  componentId: string
  accessToken: string
  refreshToken?: string
  expiresIn: number
}

// ============================================================================
// UNION TYPES & TYPE GUARDS
// ============================================================================

/**
 * Union type of all auth messages
 */
export type AuthMessage =
  | AuthLoginMessage
  | AuthLoginSuccessMessage
  | AuthLoginErrorMessage
  | AuthSignupMessage
  | AuthSignupSuccessMessage
  | AuthSignupErrorMessage
  | AuthPasswordResetRequestMessage
  | AuthPasswordResetRequestSuccessMessage
  | AuthPasswordResetVerifyMessage
  | AuthPasswordResetVerifySuccessMessage
  | AuthPasswordResetCompleteMessage
  | AuthPasswordResetCompleteSuccessMessage
  | AuthPasswordResetErrorMessage
  | AuthProfileUpdateMessage
  | AuthProfileUpdateSuccessMessage
  | AuthProfileUpdateErrorMessage
  | AuthPasswordChangeMessage
  | AuthPasswordChangeSuccessMessage
  | AuthPasswordChangeErrorMessage
  | AuthSessionListMessage
  | AuthSessionListResponseMessage
  | AuthSessionTerminateMessage
  | AuthSessionTerminateSuccessMessage
  | AuthSessionErrorMessage
  | Auth2FASetupMessage
  | Auth2FASetupResponseMessage
  | Auth2FAVerifyMessage
  | Auth2FAVerifySuccessMessage
  | Auth2FADisableMessage
  | Auth2FADisableSuccessMessage
  | Auth2FAErrorMessage
  | AuthOAuthInitiateMessage
  | AuthOAuthInitiateResponseMessage
  | AuthOAuthCallbackMessage
  | AuthOAuthCallbackSuccessMessage
  | AuthOAuthErrorMessage
  | AuthLogoutMessage
  | AuthLogoutSuccessMessage
  | AuthLogoutErrorMessage
  | AuthEmailVerificationRequestMessage
  | AuthEmailVerificationVerifyMessage
  | AuthEmailVerificationSuccessMessage
  | AuthTokenRefreshMessage
  | AuthTokenRefreshSuccessMessage

/**
 * Type guards for message discrimination
 */
export function isAuthLoginMessage(msg: any): msg is AuthLoginMessage {
  return msg?.type === 'authLogin'
}

export function isAuthLoginSuccessMessage(msg: any): msg is AuthLoginSuccessMessage {
  return msg?.type === 'authLoginSuccess'
}

export function isAuthLoginErrorMessage(msg: any): msg is AuthLoginErrorMessage {
  return msg?.type === 'authLoginError'
}

export function isAuthSignupMessage(msg: any): msg is AuthSignupMessage {
  return msg?.type === 'authSignup'
}

export function isAuthSignupSuccessMessage(msg: any): msg is AuthSignupSuccessMessage {
  return msg?.type === 'authSignupSuccess'
}

export function isAuthSignupErrorMessage(msg: any): msg is AuthSignupErrorMessage {
  return msg?.type === 'authSignupError'
}

export function isAuthPasswordResetRequestMessage(msg: any): msg is AuthPasswordResetRequestMessage {
  return msg?.type === 'authPasswordResetRequest'
}

export function isAuthPasswordResetVerifyMessage(msg: any): msg is AuthPasswordResetVerifyMessage {
  return msg?.type === 'authPasswordResetVerify'
}

export function isAuthPasswordResetCompleteMessage(msg: any): msg is AuthPasswordResetCompleteMessage {
  return msg?.type === 'authPasswordResetComplete'
}

export function isAuthProfileUpdateMessage(msg: any): msg is AuthProfileUpdateMessage {
  return msg?.type === 'authProfileUpdate'
}

export function isAuthPasswordChangeMessage(msg: any): msg is AuthPasswordChangeMessage {
  return msg?.type === 'authPasswordChange'
}

export function isAuthSessionListMessage(msg: any): msg is AuthSessionListMessage {
  return msg?.type === 'authSessionList'
}

export function isAuthSessionTerminateMessage(msg: any): msg is AuthSessionTerminateMessage {
  return msg?.type === 'authSessionTerminate'
}

export function isAuth2FASetupMessage(msg: any): msg is Auth2FASetupMessage {
  return msg?.type === 'auth2FASetup'
}

export function isAuth2FAVerifyMessage(msg: any): msg is Auth2FAVerifyMessage {
  return msg?.type === 'auth2FAVerify'
}

export function isAuth2FADisableMessage(msg: any): msg is Auth2FADisableMessage {
  return msg?.type === 'auth2FADisable'
}

export function isAuthOAuthInitiateMessage(msg: any): msg is AuthOAuthInitiateMessage {
  return msg?.type === 'authOAuthInitiate'
}

export function isAuthOAuthCallbackMessage(msg: any): msg is AuthOAuthCallbackMessage {
  return msg?.type === 'authOAuthCallback'
}

export function isAuthLogoutMessage(msg: any): msg is AuthLogoutMessage {
  return msg?.type === 'authLogout'
}

export function isAuthTokenRefreshMessage(msg: any): msg is AuthTokenRefreshMessage {
  return msg?.type === 'authTokenRefresh'
}
