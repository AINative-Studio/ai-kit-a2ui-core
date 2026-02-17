/**
 * A2UI Authentication Component Type Definitions (Issue #48)
 * Comprehensive authentication flow components for AINative Integration
 */

/**
 * Supported authentication providers
 */
export type AuthProvider = 'email' | 'google' | 'github' | 'apple' | 'microsoft'

/**
 * User field types for registration forms
 */
export type UserField = 'email' | 'username' | 'firstName' | 'lastName' | 'phone' | 'company' | 'website' | 'bio' | 'avatar'

/**
 * Password requirements configuration
 */
export interface PasswordRequirements {
  minLength: number
  requireUppercase?: boolean
  requireLowercase?: boolean
  requireNumbers?: boolean
  requireSpecialChars?: boolean
}

/**
 * Password reset flow steps
 */
export type PasswordResetStep = 'request' | 'verify' | 'reset'

/**
 * Password reset delivery methods
 */
export type PasswordResetMethod = 'email' | 'sms'

/**
 * Profile editing layout options
 */
export type ProfileLayout = 'tabs' | 'sections' | 'wizard'

/**
 * Two-factor authentication methods
 */
export type TwoFactorMethod = 'totp' | 'sms' | 'email' | 'backup_codes'

/**
 * Two-factor authentication setup steps
 */
export type TwoFactorStep = 'setup' | 'verify' | 'manage'

/**
 * Session grouping options
 */
export type SessionGrouping = 'device' | 'location' | 'time'

/**
 * authLoginForm - Login interface component
 */
export interface AuthLoginFormComponent {
  type: 'authLoginForm'
  id: string
  properties: {
    providers: AuthProvider[]
    showForgotPassword?: boolean
    showSignup?: boolean
    redirectUrl?: string
    logo?: string
    title?: string
    subtitle?: string
    rememberMe?: boolean
    twoFactor?: boolean
    metadata?: Record<string, any>
  }
}

/**
 * authSignupForm - Registration interface component
 */
export interface AuthSignupFormComponent {
  type: 'authSignupForm'
  id: string
  properties: {
    providers: AuthProvider[]
    requiredFields: UserField[]
    optionalFields?: UserField[]
    passwordRequirements: PasswordRequirements
    showLogin?: boolean
    termsUrl?: string
    privacyUrl?: string
    logo?: string
    title?: string
    metadata?: Record<string, any>
  }
}

/**
 * authPasswordReset - Password recovery component
 */
export interface AuthPasswordResetComponent {
  type: 'authPasswordReset'
  id: string
  properties: {
    step: PasswordResetStep
    method: PasswordResetMethod
    logo?: string
    title?: string
    subtitle?: string
    metadata?: Record<string, any>
  }
}

/**
 * authProfile - User profile management component
 */
export interface AuthProfileComponent {
  type: 'authProfile'
  id: string
  properties: {
    editableFields: UserField[]
    showSessions?: boolean
    showDevices?: boolean
    showSecurityLog?: boolean
    allow2FA?: boolean
    allowPasswordChange?: boolean
    allowAccountDeletion?: boolean
    layout?: ProfileLayout
    metadata?: Record<string, any>
  }
}

/**
 * authSessionManager - Active sessions management component
 */
export interface AuthSessionManagerComponent {
  type: 'authSessionManager'
  id: string
  properties: {
    showCurrentSession?: boolean
    allowTerminate?: boolean
    showDeviceInfo?: boolean
    showLocation?: boolean
    showActivity?: boolean
    groupBy?: SessionGrouping
    metadata?: Record<string, any>
  }
}

/**
 * auth2FA - Two-factor authentication setup component
 */
export interface Auth2FAComponent {
  type: 'auth2FA'
  id: string
  properties: {
    methods: TwoFactorMethod[]
    step: TwoFactorStep
    showBackupCodes?: boolean
    showRecoveryCodes?: boolean
    metadata?: Record<string, any>
  }
}

/**
 * authOAuthCallback - OAuth callback handler component
 */
export interface AuthOAuthCallbackComponent {
  type: 'authOAuthCallback'
  id: string
  properties: {
    provider: AuthProvider
    state?: string
    redirectUrl?: string
    showProgress?: boolean
    metadata?: Record<string, any>
  }
}

/**
 * Union type of all auth components
 */
export type AuthComponent =
  | AuthLoginFormComponent
  | AuthSignupFormComponent
  | AuthPasswordResetComponent
  | AuthProfileComponent
  | AuthSessionManagerComponent
  | Auth2FAComponent
  | AuthOAuthCallbackComponent

/**
 * Type guard for AuthLoginFormComponent
 */
export function isAuthLoginFormComponent(component: any): component is AuthLoginFormComponent {
  return component?.type === 'authLoginForm'
}

/**
 * Type guard for AuthSignupFormComponent
 */
export function isAuthSignupFormComponent(component: any): component is AuthSignupFormComponent {
  return component?.type === 'authSignupForm'
}

/**
 * Type guard for AuthPasswordResetComponent
 */
export function isAuthPasswordResetComponent(component: any): component is AuthPasswordResetComponent {
  return component?.type === 'authPasswordReset'
}

/**
 * Type guard for AuthProfileComponent
 */
export function isAuthProfileComponent(component: any): component is AuthProfileComponent {
  return component?.type === 'authProfile'
}

/**
 * Type guard for AuthSessionManagerComponent
 */
export function isAuthSessionManagerComponent(component: any): component is AuthSessionManagerComponent {
  return component?.type === 'authSessionManager'
}

/**
 * Type guard for Auth2FAComponent
 */
export function isAuth2FAComponent(component: any): component is Auth2FAComponent {
  return component?.type === 'auth2FA'
}

/**
 * Type guard for AuthOAuthCallbackComponent
 */
export function isAuthOAuthCallbackComponent(component: any): component is AuthOAuthCallbackComponent {
  return component?.type === 'authOAuthCallback'
}

/**
 * Type guard for any auth component
 */
export function isAuthComponent(component: any): component is AuthComponent {
  return (
    isAuthLoginFormComponent(component) ||
    isAuthSignupFormComponent(component) ||
    isAuthPasswordResetComponent(component) ||
    isAuthProfileComponent(component) ||
    isAuthSessionManagerComponent(component) ||
    isAuth2FAComponent(component) ||
    isAuthOAuthCallbackComponent(component)
  )
}

/**
 * Validate password against requirements
 */
export function validatePassword(password: string, requirements: PasswordRequirements): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`)
  }

  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (requirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (requirements.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate username format
 */
export function validateUsername(username: string): {
  valid: boolean
  error?: string
} {
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' }
  }
  if (username.length > 30) {
    return { valid: false, error: 'Username must be at most 30 characters long' }
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' }
  }
  return { valid: true }
}

/**
 * Validate phone number format (basic E.164 format)
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone || phone.length === 0) return false
  const cleaned = phone.replace(/[\s-()]/g, '')
  const phoneRegex = /^\+[1-9]\d{7,14}$/
  return phoneRegex.test(cleaned)
}
