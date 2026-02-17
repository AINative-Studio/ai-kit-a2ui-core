/**
 * A2UI Authentication Handler (Issue #48)
 * Manages authentication operations with AINative auth service integration
 */

import type {
  AuthLoginMessage,
  AuthLoginSuccessMessage,
  AuthLoginErrorMessage,
  AuthSignupMessage,
  AuthSignupSuccessMessage,
  AuthSignupErrorMessage,
  AuthPasswordResetRequestMessage,
  AuthPasswordResetRequestSuccessMessage,
  AuthPasswordResetVerifyMessage,
  AuthPasswordResetVerifySuccessMessage,
  AuthPasswordResetCompleteMessage,
  AuthPasswordResetCompleteSuccessMessage,
  AuthPasswordResetErrorMessage,
  AuthProfileUpdateMessage,
  AuthProfileUpdateSuccessMessage,
  AuthProfileUpdateErrorMessage,
  AuthPasswordChangeMessage,
  AuthPasswordChangeSuccessMessage,
  AuthPasswordChangeErrorMessage,
  AuthSessionListMessage,
  AuthSessionListResponseMessage,
  AuthSessionTerminateMessage,
  AuthSessionTerminateSuccessMessage,
  AuthSessionErrorMessage,
  Auth2FASetupMessage,
  Auth2FASetupResponseMessage,
  Auth2FAVerifyMessage,
  Auth2FAVerifySuccessMessage,
  Auth2FADisableMessage,
  Auth2FADisableSuccessMessage,
  Auth2FAErrorMessage,
  AuthOAuthInitiateMessage,
  AuthOAuthInitiateResponseMessage,
  AuthOAuthCallbackMessage,
  AuthOAuthCallbackSuccessMessage,
  AuthOAuthErrorMessage,
  AuthLogoutMessage,
  AuthLogoutSuccessMessage,
  AuthLogoutErrorMessage,
  AuthTokenRefreshMessage,
  AuthTokenRefreshSuccessMessage,
  AuthUser,
  Session,
  AuthErrorCode,
} from '../types/auth-messages.js'
import type { AuthProvider, PasswordRequirements } from '../types/auth-components.js'
import { validatePassword, validateEmail, validateUsername, validatePhoneNumber } from '../types/auth-components.js'

/**
 * Authentication service interface for backend integration
 */
export interface AuthService {
  // Login operations
  login(email: string, password: string): Promise<AuthResult>
  oauthLogin(provider: AuthProvider, token: string): Promise<AuthResult>

  // Signup operations
  signup(data: SignupData): Promise<SignupResult>

  // Password reset operations
  requestPasswordReset(email: string, method: 'email' | 'sms'): Promise<PasswordResetRequestResult>
  verifyPasswordResetCode(code: string, token: string): Promise<PasswordResetVerifyResult>
  completePasswordReset(resetToken: string, newPassword: string): Promise<void>

  // Profile operations
  updateProfile(userId: string, updates: ProfileUpdates): Promise<AuthUser>
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>

  // Session operations
  getSessions(userId: string): Promise<Session[]>
  terminateSession(userId: string, sessionId: string): Promise<void>

  // 2FA operations
  setup2FA(userId: string, method: 'totp' | 'sms' | 'email'): Promise<TwoFactorSetupResult>
  verify2FA(userId: string, code: string, secret?: string): Promise<TwoFactorVerifyResult>
  disable2FA(userId: string, password: string): Promise<void>

  // OAuth operations
  initiateOAuth(provider: AuthProvider, redirectUrl: string, state?: string, scopes?: string[]): Promise<OAuthInitiateResult>
  handleOAuthCallback(provider: AuthProvider, code: string, state?: string): Promise<AuthResult>

  // Logout operations
  logout(userId: string, sessionId: string, allSessions?: boolean): Promise<void>

  // Token operations
  refreshToken(refreshToken: string): Promise<TokenRefreshResult>
}

/**
 * Authentication result structure
 */
export interface AuthResult {
  user: AuthUser
  accessToken: string
  refreshToken?: string
  expiresIn: number
  requiresMFA?: boolean
  mfaToken?: string
  session?: Session
}

/**
 * Signup data structure
 */
export interface SignupData {
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

/**
 * Signup result structure
 */
export interface SignupResult {
  user: AuthUser
  requiresVerification: boolean
  verificationMethod?: 'email' | 'sms'
  verificationSentTo?: string
  accessToken?: string
  refreshToken?: string
  expiresIn?: number
}

/**
 * Password reset request result
 */
export interface PasswordResetRequestResult {
  sentTo: string
  expiresIn: number
}

/**
 * Password reset verify result
 */
export interface PasswordResetVerifyResult {
  verified: boolean
  resetToken: string
}

/**
 * Profile updates structure
 */
export interface ProfileUpdates {
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

/**
 * Two-factor setup result
 */
export interface TwoFactorSetupResult {
  method: 'totp' | 'sms' | 'email'
  secret?: string
  qrCode?: string
  backupCodes?: string[]
}

/**
 * Two-factor verify result
 */
export interface TwoFactorVerifyResult {
  verified: boolean
  accessToken?: string
  refreshToken?: string
  expiresIn?: number
}

/**
 * OAuth initiate result
 */
export interface OAuthInitiateResult {
  authUrl: string
  state: string
}

/**
 * Token refresh result
 */
export interface TokenRefreshResult {
  accessToken: string
  refreshToken?: string
  expiresIn: number
}

/**
 * OAuth provider configuration
 */
export interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

/**
 * Authentication handler options
 */
export interface AuthHandlerOptions {
  // AINative auth service integration
  authServiceUrl?: string
  apiKey?: string
  authService?: AuthService

  // OAuth providers configuration
  oauth?: {
    google?: OAuthConfig
    github?: OAuthConfig
    apple?: OAuthConfig
    microsoft?: OAuthConfig
  }

  // Password policy
  passwordPolicy?: PasswordRequirements

  // Session configuration
  sessionDuration?: number
  allowMultipleSessions?: boolean

  // 2FA configuration
  require2FA?: boolean
  allowed2FAMethods?: Array<'totp' | 'sms' | 'email'>

  // Rate limiting
  rateLimitEnabled?: boolean
  maxLoginAttempts?: number
  lockoutDuration?: number

  // Email verification
  requireEmailVerification?: boolean

  // Security
  enableCsrfProtection?: boolean
  enableXssProtection?: boolean
}

/**
 * Authentication event types
 */
export type AuthEventType =
  | 'loginSuccess'
  | 'loginError'
  | 'signupSuccess'
  | 'signupError'
  | 'passwordResetRequested'
  | 'passwordResetCompleted'
  | 'profileUpdated'
  | 'passwordChanged'
  | 'sessionTerminated'
  | '2faEnabled'
  | '2faDisabled'
  | 'logoutSuccess'

/**
 * Authentication event handler type
 */
export type AuthEventHandler = (data: any) => void

/**
 * Authentication Handler class
 */
export class AuthHandler {
  private readonly authService: AuthService
  private readonly options: Required<AuthHandlerOptions>
  private readonly eventHandlers = new Map<AuthEventType, Set<AuthEventHandler>>()
  private readonly loginAttempts = new Map<string, { count: number; lockedUntil?: number }>()

  constructor(authService: AuthService, options: AuthHandlerOptions = {}) {
    this.authService = authService
    this.options = {
      authServiceUrl: options.authServiceUrl || '',
      apiKey: options.apiKey || '',
      authService: authService,
      oauth: options.oauth || {},
      passwordPolicy: options.passwordPolicy || {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
      },
      sessionDuration: options.sessionDuration || 86400,
      allowMultipleSessions: options.allowMultipleSessions ?? true,
      require2FA: options.require2FA ?? false,
      allowed2FAMethods: options.allowed2FAMethods || ['totp', 'sms', 'email'],
      rateLimitEnabled: options.rateLimitEnabled ?? true,
      maxLoginAttempts: options.maxLoginAttempts || 5,
      lockoutDuration: options.lockoutDuration || 900000,
      requireEmailVerification: options.requireEmailVerification ?? true,
      enableCsrfProtection: options.enableCsrfProtection ?? true,
      enableXssProtection: options.enableXssProtection ?? true,
    }
  }

  // ============================================================================
  // LOGIN OPERATIONS
  // ============================================================================

  async handleLogin(message: AuthLoginMessage): Promise<AuthLoginSuccessMessage | AuthLoginErrorMessage> {
    try {
      // Check rate limiting
      if (this.options.rateLimitEnabled && message.credentials?.email) {
        const isLocked = this.checkRateLimit(message.credentials.email)
        if (isLocked) {
          return this.createLoginErrorMessage(message.componentId, 'account_locked', 'Too many login attempts. Please try again later.')
        }
      }

      // Validate credentials
      if (message.provider === 'email' && message.credentials) {
        const { email, password } = message.credentials

        if (!email || !password) {
          return this.createLoginErrorMessage(message.componentId, 'invalid_credentials', 'Email and password are required')
        }

        if (!validateEmail(email)) {
          return this.createLoginErrorMessage(message.componentId, 'invalid_credentials', 'Invalid email format')
        }

        // Attempt login
        const result = await this.authService.login(email, password)

        // Clear login attempts on success
        if (this.options.rateLimitEnabled) {
          this.loginAttempts.delete(email)
        }

        this.emit('loginSuccess', { user: result.user })

        return {
          type: 'authLoginSuccess',
          componentId: message.componentId,
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
          requiresMFA: result.requiresMFA,
          mfaToken: result.mfaToken,
          session: result.session,
        }
      }

      // OAuth login
      if (message.oauthToken) {
        const result = await this.authService.oauthLogin(message.provider, message.oauthToken)

        this.emit('loginSuccess', { user: result.user })

        return {
          type: 'authLoginSuccess',
          componentId: message.componentId,
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
          session: result.session,
        }
      }

      return this.createLoginErrorMessage(message.componentId, 'invalid_credentials', 'Invalid login method')
    } catch (error: any) {
      // Increment login attempts on failure
      if (this.options.rateLimitEnabled && message.credentials?.email) {
        this.incrementLoginAttempts(message.credentials.email)
      }

      this.emit('loginError', { error })
      return this.createLoginErrorMessage(
        message.componentId,
        error.code || 'server_error',
        error.message || 'Login failed'
      )
    }
  }

  async handleOAuthInitiate(message: AuthOAuthInitiateMessage): Promise<AuthOAuthInitiateResponseMessage | AuthOAuthErrorMessage> {
    try {
      const result = await this.authService.initiateOAuth(
        message.provider,
        message.redirectUrl,
        message.state,
        message.scopes
      )

      return {
        type: 'authOAuthInitiateResponse',
        componentId: message.componentId,
        authUrl: result.authUrl,
        state: result.state,
      }
    } catch (error: any) {
      return this.createOAuthErrorMessage(
        message.componentId,
        error.code || 'server_error',
        error.message || 'OAuth initiation failed'
      )
    }
  }

  async handleOAuthCallback(message: AuthOAuthCallbackMessage): Promise<AuthOAuthCallbackSuccessMessage | AuthOAuthErrorMessage> {
    try {
      const result = await this.authService.handleOAuthCallback(
        message.provider,
        message.code,
        message.state
      )

      this.emit('loginSuccess', { user: result.user })

      return {
        type: 'authOAuthCallbackSuccess',
        componentId: message.componentId,
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        session: result.session,
      }
    } catch (error: any) {
      return this.createOAuthErrorMessage(
        message.componentId,
        error.code || 'server_error',
        error.message || 'OAuth callback failed'
      )
    }
  }

  // ============================================================================
  // SIGNUP OPERATIONS
  // ============================================================================

  async handleSignup(message: AuthSignupMessage): Promise<AuthSignupSuccessMessage | AuthSignupErrorMessage> {
    try {
      // Validate email
      if (!validateEmail(message.data.email)) {
        return this.createSignupErrorMessage(
          message.componentId,
          'invalid_credentials',
          'Invalid email format',
          { email: 'Invalid email format' }
        )
      }

      // Validate username if provided
      if (message.data.username) {
        const usernameValidation = validateUsername(message.data.username)
        if (!usernameValidation.valid) {
          return this.createSignupErrorMessage(
            message.componentId,
            'invalid_credentials',
            usernameValidation.error || 'Invalid username',
            { username: usernameValidation.error }
          )
        }
      }

      // Validate password if provided (email signup)
      if (message.provider === 'email' && message.data.password) {
        const passwordValidation = validatePassword(message.data.password, this.options.passwordPolicy)
        if (!passwordValidation.valid) {
          return this.createSignupErrorMessage(
            message.componentId,
            'weak_password',
            'Password does not meet requirements',
            { password: passwordValidation.errors.join(', ') }
          )
        }
      }

      // Validate phone if provided
      if (message.data.phone && !validatePhoneNumber(message.data.phone)) {
        return this.createSignupErrorMessage(
          message.componentId,
          'invalid_credentials',
          'Invalid phone number format',
          { phone: 'Invalid phone number format' }
        )
      }

      // Validate terms accepted
      if (!message.data.termsAccepted) {
        return this.createSignupErrorMessage(
          message.componentId,
          'invalid_credentials',
          'You must accept the terms and conditions'
        )
      }

      // Attempt signup
      const result = await this.authService.signup(message.data)

      this.emit('signupSuccess', { user: result.user })

      return {
        type: 'authSignupSuccess',
        componentId: message.componentId,
        user: result.user,
        requiresVerification: result.requiresVerification,
        verificationMethod: result.verificationMethod,
        verificationSentTo: result.verificationSentTo,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      }
    } catch (error: any) {
      this.emit('signupError', { error })
      return this.createSignupErrorMessage(
        message.componentId,
        error.code || 'server_error',
        error.message || 'Signup failed',
        error.fieldErrors
      )
    }
  }

  // ============================================================================
  // PASSWORD RESET OPERATIONS
  // ============================================================================

  async handlePasswordResetRequest(message: AuthPasswordResetRequestMessage): Promise<AuthPasswordResetRequestSuccessMessage | AuthPasswordResetErrorMessage> {
    try {
      if (!validateEmail(message.email)) {
        return this.createPasswordResetErrorMessage(
          message.componentId,
          'invalid_credentials',
          'Invalid email format'
        )
      }

      const result = await this.authService.requestPasswordReset(message.email, message.method)

      this.emit('passwordResetRequested', { email: message.email })

      return {
        type: 'authPasswordResetRequestSuccess',
        componentId: message.componentId,
        sentTo: result.sentTo,
        expiresIn: result.expiresIn,
      }
    } catch (error: any) {
      return this.createPasswordResetErrorMessage(
        message.componentId,
        error.code || 'server_error',
        error.message || 'Password reset request failed'
      )
    }
  }

  async handlePasswordResetVerify(message: AuthPasswordResetVerifyMessage): Promise<AuthPasswordResetVerifySuccessMessage | AuthPasswordResetErrorMessage> {
    try {
      const result = await this.authService.verifyPasswordResetCode(message.code, message.token)

      return {
        type: 'authPasswordResetVerifySuccess',
        componentId: message.componentId,
        verified: result.verified,
        resetToken: result.resetToken,
      }
    } catch (error: any) {
      return this.createPasswordResetErrorMessage(
        message.componentId,
        error.code || 'invalid_code',
        error.message || 'Invalid or expired verification code'
      )
    }
  }

  async handlePasswordResetComplete(message: AuthPasswordResetCompleteMessage): Promise<AuthPasswordResetCompleteSuccessMessage | AuthPasswordResetErrorMessage> {
    try {
      // Validate new password
      const passwordValidation = validatePassword(message.newPassword, this.options.passwordPolicy)
      if (!passwordValidation.valid) {
        return this.createPasswordResetErrorMessage(
          message.componentId,
          'weak_password',
          passwordValidation.errors.join(', ')
        )
      }

      await this.authService.completePasswordReset(message.resetToken, message.newPassword)

      this.emit('passwordResetCompleted', { resetToken: message.resetToken })

      return {
        type: 'authPasswordResetCompleteSuccess',
        componentId: message.componentId,
        success: true,
      }
    } catch (error: any) {
      return this.createPasswordResetErrorMessage(
        message.componentId,
        error.code || 'server_error',
        error.message || 'Password reset failed'
      )
    }
  }

  // ============================================================================
  // PROFILE OPERATIONS
  // ============================================================================

  async handleProfileUpdate(message: AuthProfileUpdateMessage): Promise<AuthProfileUpdateSuccessMessage | AuthProfileUpdateErrorMessage> {
    try {
      const fieldErrors: Record<string, string> = {}

      // Validate email if being updated
      if (message.updates.email && !validateEmail(message.updates.email)) {
        fieldErrors.email = 'Invalid email format'
      }

      // Validate username if being updated
      if (message.updates.username) {
        const usernameValidation = validateUsername(message.updates.username)
        if (!usernameValidation.valid) {
          fieldErrors.username = usernameValidation.error || 'Invalid username'
        }
      }

      // Validate phone if being updated
      if (message.updates.phone && !validatePhoneNumber(message.updates.phone)) {
        fieldErrors.phone = 'Invalid phone number format'
      }

      if (Object.keys(fieldErrors).length > 0) {
        return this.createProfileUpdateErrorMessage(
          message.componentId,
          'invalid_credentials',
          'Validation errors',
          fieldErrors
        )
      }

      // Extract userId from message metadata or require it to be passed
      const userId = (message.metadata as any)?.userId
      if (!userId) {
        return this.createProfileUpdateErrorMessage(
          message.componentId,
          'permission_denied',
          'User ID required'
        )
      }

      const user = await this.authService.updateProfile(userId, message.updates)

      this.emit('profileUpdated', { user })

      return {
        type: 'authProfileUpdateSuccess',
        componentId: message.componentId,
        user,
        requiresVerification: !!message.updates.email,
        verificationSentTo: message.updates.email,
      }
    } catch (error: any) {
      return this.createProfileUpdateErrorMessage(
        message.componentId,
        error.code || 'server_error',
        error.message || 'Profile update failed',
        error.fieldErrors
      )
    }
  }

  async handlePasswordChange(message: AuthPasswordChangeMessage): Promise<AuthPasswordChangeSuccessMessage | AuthPasswordChangeErrorMessage> {
    try {
      // Validate new password
      const passwordValidation = validatePassword(message.newPassword, this.options.passwordPolicy)
      if (!passwordValidation.valid) {
        return this.createPasswordChangeErrorMessage(
          message.componentId,
          'weak_password',
          passwordValidation.errors.join(', ')
        )
      }

      // Extract userId from message metadata
      const userId = (message as any).metadata?.userId
      if (!userId) {
        return this.createPasswordChangeErrorMessage(
          message.componentId,
          'permission_denied',
          'User ID required'
        )
      }

      await this.authService.changePassword(userId, message.currentPassword, message.newPassword)

      this.emit('passwordChanged', { userId })

      return {
        type: 'authPasswordChangeSuccess',
        componentId: message.componentId,
        success: true,
      }
    } catch (error: any) {
      return this.createPasswordChangeErrorMessage(
        message.componentId,
        error.code || 'server_error',
        error.message || 'Password change failed'
      )
    }
  }

  // ============================================================================
  // SESSION OPERATIONS
  // ============================================================================

  async handleSessionList(message: AuthSessionListMessage): Promise<AuthSessionListResponseMessage | AuthSessionErrorMessage> {
    try {
      const userId = (message as any).metadata?.userId
      if (!userId) {
        return this.createSessionErrorMessage(
          message.componentId,
          'permission_denied',
          'User ID required'
        )
      }

      const sessions = await this.authService.getSessions(userId)
      const currentSessionId = (message as any).metadata?.sessionId || ''

      return {
        type: 'authSessionListResponse',
        componentId: message.componentId,
        sessions,
        currentSessionId,
      }
    } catch (error: any) {
      return this.createSessionErrorMessage(
        message.componentId,
        error.code || 'server_error',
        error.message || 'Failed to retrieve sessions'
      )
    }
  }

  async handleSessionTerminate(message: AuthSessionTerminateMessage): Promise<AuthSessionTerminateSuccessMessage | AuthSessionErrorMessage> {
    try {
      const userId = (message as any).metadata?.userId
      if (!userId) {
        return this.createSessionErrorMessage(
          message.componentId,
          'permission_denied',
          'User ID required'
        )
      }

      await this.authService.terminateSession(userId, message.sessionId)

      this.emit('sessionTerminated', { userId, sessionId: message.sessionId })

      return {
        type: 'authSessionTerminateSuccess',
        componentId: message.componentId,
        sessionId: message.sessionId,
      }
    } catch (error: any) {
      return this.createSessionErrorMessage(
        message.componentId,
        error.code || 'server_error',
        error.message || 'Failed to terminate session'
      )
    }
  }

  // ============================================================================
  // TWO-FACTOR AUTHENTICATION OPERATIONS
  // ============================================================================

  async handle2FASetup(message: Auth2FASetupMessage): Promise<Auth2FASetupResponseMessage | Auth2FAErrorMessage> {
    try {
      const userId = (message as any).metadata?.userId
      if (!userId) {
        return this.create2FAErrorMessage(
          message.componentId,
          'permission_denied',
          'User ID required'
        )
      }

      const result = await this.authService.setup2FA(userId, message.method)

      this.emit('2faEnabled', { userId, method: message.method })

      return {
        type: 'auth2FASetupResponse',
        componentId: message.componentId,
        method: result.method,
        secret: result.secret,
        qrCode: result.qrCode,
        backupCodes: result.backupCodes,
      }
    } catch (error: any) {
      return this.create2FAErrorMessage(
        message.componentId,
        error.code || 'server_error',
        error.message || '2FA setup failed'
      )
    }
  }

  async handle2FAVerify(message: Auth2FAVerifyMessage): Promise<Auth2FAVerifySuccessMessage | Auth2FAErrorMessage> {
    try {
      const userId = (message as any).metadata?.userId
      if (!userId) {
        return this.create2FAErrorMessage(
          message.componentId,
          'permission_denied',
          'User ID required'
        )
      }

      const result = await this.authService.verify2FA(userId, message.code, message.secret)

      return {
        type: 'auth2FAVerifySuccess',
        componentId: message.componentId,
        verified: result.verified,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      }
    } catch (error: any) {
      return this.create2FAErrorMessage(
        message.componentId,
        error.code || 'invalid_code',
        error.message || 'Invalid verification code'
      )
    }
  }

  async handle2FADisable(message: Auth2FADisableMessage): Promise<Auth2FADisableSuccessMessage | Auth2FAErrorMessage> {
    try {
      const userId = (message as any).metadata?.userId
      if (!userId) {
        return this.create2FAErrorMessage(
          message.componentId,
          'permission_denied',
          'User ID required'
        )
      }

      await this.authService.disable2FA(userId, message.password)

      this.emit('2faDisabled', { userId })

      return {
        type: 'auth2FADisableSuccess',
        componentId: message.componentId,
        success: true,
      }
    } catch (error: any) {
      return this.create2FAErrorMessage(
        message.componentId,
        error.code || 'server_error',
        error.message || '2FA disable failed'
      )
    }
  }

  // ============================================================================
  // LOGOUT OPERATIONS
  // ============================================================================

  async handleLogout(message: AuthLogoutMessage): Promise<AuthLogoutSuccessMessage | AuthLogoutErrorMessage> {
    try {
      const userId = (message as any).metadata?.userId
      const sessionId = (message as any).metadata?.sessionId

      if (!userId || !sessionId) {
        return this.createLogoutErrorMessage(
          message.componentId,
          'permission_denied',
          'User ID and session ID required'
        )
      }

      await this.authService.logout(userId, sessionId, message.allSessions)

      this.emit('logoutSuccess', { userId, allSessions: message.allSessions })

      return {
        type: 'authLogoutSuccess',
        componentId: message.componentId,
        success: true,
      }
    } catch (error: any) {
      return this.createLogoutErrorMessage(
        message.componentId,
        error.code || 'server_error',
        error.message || 'Logout failed'
      )
    }
  }

  // ============================================================================
  // TOKEN OPERATIONS
  // ============================================================================

  async handleTokenRefresh(message: AuthTokenRefreshMessage): Promise<AuthTokenRefreshSuccessMessage | AuthLoginErrorMessage> {
    try {
      const result = await this.authService.refreshToken(message.refreshToken)

      return {
        type: 'authTokenRefreshSuccess',
        componentId: message.componentId,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      }
    } catch (error: any) {
      return this.createLoginErrorMessage(
        message.componentId,
        error.code || 'invalid_token',
        error.message || 'Token refresh failed'
      )
    }
  }

  // ============================================================================
  // EVENT MANAGEMENT
  // ============================================================================

  on(event: AuthEventType, handler: AuthEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  off(event: AuthEventType, handler: AuthEventHandler): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  private emit(event: AuthEventType, data: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => handler(data))
    }
  }

  // ============================================================================
  // RATE LIMITING
  // ============================================================================

  private checkRateLimit(email: string): boolean {
    const attempt = this.loginAttempts.get(email)
    if (!attempt) return false

    if (attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
      return true
    }

    if (attempt.lockedUntil && Date.now() >= attempt.lockedUntil) {
      this.loginAttempts.delete(email)
      return false
    }

    return attempt.count >= this.options.maxLoginAttempts
  }

  private incrementLoginAttempts(email: string): void {
    const attempt = this.loginAttempts.get(email) || { count: 0 }
    attempt.count++

    if (attempt.count >= this.options.maxLoginAttempts) {
      attempt.lockedUntil = Date.now() + this.options.lockoutDuration
    }

    this.loginAttempts.set(email, attempt)
  }

  // ============================================================================
  // ERROR MESSAGE HELPERS
  // ============================================================================

  private createLoginErrorMessage(componentId: string, code: AuthErrorCode, message: string): AuthLoginErrorMessage {
    return {
      type: 'authLoginError',
      componentId,
      error: { code, message },
    }
  }

  private createSignupErrorMessage(componentId: string, code: AuthErrorCode, message: string, fieldErrors?: Record<string, string>): AuthSignupErrorMessage {
    return {
      type: 'authSignupError',
      componentId,
      error: { code, message, fieldErrors },
    }
  }

  private createPasswordResetErrorMessage(componentId: string, code: AuthErrorCode, message: string): AuthPasswordResetErrorMessage {
    return {
      type: 'authPasswordResetError',
      componentId,
      error: { code, message },
    }
  }

  private createProfileUpdateErrorMessage(componentId: string, code: AuthErrorCode, message: string, fieldErrors?: Record<string, string>): AuthProfileUpdateErrorMessage {
    return {
      type: 'authProfileUpdateError',
      componentId,
      error: { code, message, fieldErrors },
    }
  }

  private createPasswordChangeErrorMessage(componentId: string, code: AuthErrorCode, message: string): AuthPasswordChangeErrorMessage {
    return {
      type: 'authPasswordChangeError',
      componentId,
      error: { code, message },
    }
  }

  private createSessionErrorMessage(componentId: string, code: AuthErrorCode, message: string): AuthSessionErrorMessage {
    return {
      type: 'authSessionError',
      componentId,
      error: { code, message },
    }
  }

  private create2FAErrorMessage(componentId: string, code: AuthErrorCode, message: string): Auth2FAErrorMessage {
    return {
      type: 'auth2FAError',
      componentId,
      error: { code, message },
    }
  }

  private createOAuthErrorMessage(componentId: string, code: AuthErrorCode, message: string): AuthOAuthErrorMessage {
    return {
      type: 'authOAuthError',
      componentId,
      error: { code, message },
    }
  }

  private createLogoutErrorMessage(componentId: string, code: AuthErrorCode, message: string): AuthLogoutErrorMessage {
    return {
      type: 'authLogoutError',
      componentId,
      error: { code, message },
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  destroy(): void {
    this.eventHandlers.clear()
    this.loginAttempts.clear()
  }
}
