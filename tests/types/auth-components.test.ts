/**
 * Authentication Component Types Tests (Issue #48)
 */

import { describe, it, expect } from 'vitest'
import {
  type AuthLoginFormComponent,
  type AuthSignupFormComponent,
  type AuthPasswordResetComponent,
  type AuthProfileComponent,
  type AuthSessionManagerComponent,
  type Auth2FAComponent,
  type AuthOAuthCallbackComponent,
  type PasswordRequirements,
  isAuthLoginFormComponent,
  isAuthSignupFormComponent,
  isAuthPasswordResetComponent,
  isAuthProfileComponent,
  isAuthSessionManagerComponent,
  isAuth2FAComponent,
  isAuthOAuthCallbackComponent,
  isAuthComponent,
  validatePassword,
  validateEmail,
  validateUsername,
  validatePhoneNumber,
} from '../../src/types/auth-components.js'

describe('Auth Component Types', () => {
  describe('AuthLoginFormComponent', () => {
    it('should create valid login form component', () => {
      const component: AuthLoginFormComponent = {
        type: 'authLoginForm',
        id: 'login-1',
        properties: {
          providers: ['email', 'google'],
          showForgotPassword: true,
          showSignup: true,
          rememberMe: true,
        },
      }

      expect(component.type).toBe('authLoginForm')
      expect(component.properties.providers).toContain('email')
      expect(component.properties.showForgotPassword).toBe(true)
    })

    it('should validate login form component with type guard', () => {
      const component: AuthLoginFormComponent = {
        type: 'authLoginForm',
        id: 'login-1',
        properties: {
          providers: ['email'],
        },
      }

      expect(isAuthLoginFormComponent(component)).toBe(true)
      expect(isAuthComponent(component)).toBe(true)
    })
  })

  describe('AuthSignupFormComponent', () => {
    it('should create valid signup form component', () => {
      const component: AuthSignupFormComponent = {
        type: 'authSignupForm',
        id: 'signup-1',
        properties: {
          providers: ['email', 'github'],
          requiredFields: ['email', 'firstName', 'lastName'],
          optionalFields: ['company'],
          passwordRequirements: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
          },
          termsUrl: 'https://example.com/terms',
          privacyUrl: 'https://example.com/privacy',
        },
      }

      expect(component.type).toBe('authSignupForm')
      expect(component.properties.requiredFields).toHaveLength(3)
      expect(component.properties.passwordRequirements.minLength).toBe(8)
    })

    it('should validate signup form component with type guard', () => {
      const component: AuthSignupFormComponent = {
        type: 'authSignupForm',
        id: 'signup-1',
        properties: {
          providers: ['email'],
          requiredFields: ['email'],
          passwordRequirements: {
            minLength: 8,
          },
        },
      }

      expect(isAuthSignupFormComponent(component)).toBe(true)
      expect(isAuthComponent(component)).toBe(true)
    })
  })

  describe('AuthPasswordResetComponent', () => {
    it('should create password reset component for each step', () => {
      const requestComponent: AuthPasswordResetComponent = {
        type: 'authPasswordReset',
        id: 'reset-1',
        properties: {
          step: 'request',
          method: 'email',
          title: 'Reset Password',
        },
      }

      const verifyComponent: AuthPasswordResetComponent = {
        type: 'authPasswordReset',
        id: 'reset-2',
        properties: {
          step: 'verify',
          method: 'email',
        },
      }

      const resetComponent: AuthPasswordResetComponent = {
        type: 'authPasswordReset',
        id: 'reset-3',
        properties: {
          step: 'reset',
          method: 'email',
        },
      }

      expect(requestComponent.properties.step).toBe('request')
      expect(verifyComponent.properties.step).toBe('verify')
      expect(resetComponent.properties.step).toBe('reset')
    })

    it('should validate password reset component with type guard', () => {
      const component: AuthPasswordResetComponent = {
        type: 'authPasswordReset',
        id: 'reset-1',
        properties: {
          step: 'request',
          method: 'email',
        },
      }

      expect(isAuthPasswordResetComponent(component)).toBe(true)
      expect(isAuthComponent(component)).toBe(true)
    })
  })

  describe('AuthProfileComponent', () => {
    it('should create profile component with editable fields', () => {
      const component: AuthProfileComponent = {
        type: 'authProfile',
        id: 'profile-1',
        properties: {
          editableFields: ['email', 'username', 'firstName', 'lastName', 'avatar'],
          showSessions: true,
          showDevices: true,
          allow2FA: true,
          allowPasswordChange: true,
          layout: 'tabs',
        },
      }

      expect(component.type).toBe('authProfile')
      expect(component.properties.editableFields).toHaveLength(5)
      expect(component.properties.layout).toBe('tabs')
    })

    it('should validate profile component with type guard', () => {
      const component: AuthProfileComponent = {
        type: 'authProfile',
        id: 'profile-1',
        properties: {
          editableFields: ['email'],
        },
      }

      expect(isAuthProfileComponent(component)).toBe(true)
      expect(isAuthComponent(component)).toBe(true)
    })
  })

  describe('AuthSessionManagerComponent', () => {
    it('should create session manager component', () => {
      const component: AuthSessionManagerComponent = {
        type: 'authSessionManager',
        id: 'sessions-1',
        properties: {
          showCurrentSession: true,
          allowTerminate: true,
          showDeviceInfo: true,
          showLocation: true,
          showActivity: true,
          groupBy: 'device',
        },
      }

      expect(component.type).toBe('authSessionManager')
      expect(component.properties.allowTerminate).toBe(true)
      expect(component.properties.groupBy).toBe('device')
    })

    it('should validate session manager component with type guard', () => {
      const component: AuthSessionManagerComponent = {
        type: 'authSessionManager',
        id: 'sessions-1',
        properties: {},
      }

      expect(isAuthSessionManagerComponent(component)).toBe(true)
      expect(isAuthComponent(component)).toBe(true)
    })
  })

  describe('Auth2FAComponent', () => {
    it('should create 2FA component for setup', () => {
      const component: Auth2FAComponent = {
        type: 'auth2FA',
        id: '2fa-1',
        properties: {
          methods: ['totp', 'sms'],
          step: 'setup',
          showBackupCodes: true,
        },
      }

      expect(component.type).toBe('auth2FA')
      expect(component.properties.methods).toContain('totp')
      expect(component.properties.step).toBe('setup')
    })

    it('should validate 2FA component with type guard', () => {
      const component: Auth2FAComponent = {
        type: 'auth2FA',
        id: '2fa-1',
        properties: {
          methods: ['totp'],
          step: 'verify',
        },
      }

      expect(isAuth2FAComponent(component)).toBe(true)
      expect(isAuthComponent(component)).toBe(true)
    })
  })

  describe('AuthOAuthCallbackComponent', () => {
    it('should create OAuth callback component', () => {
      const component: AuthOAuthCallbackComponent = {
        type: 'authOAuthCallback',
        id: 'oauth-1',
        properties: {
          provider: 'google',
          showProgress: true,
          redirectUrl: '/dashboard',
        },
      }

      expect(component.type).toBe('authOAuthCallback')
      expect(component.properties.provider).toBe('google')
      expect(component.properties.showProgress).toBe(true)
    })

    it('should validate OAuth callback component with type guard', () => {
      const component: AuthOAuthCallbackComponent = {
        type: 'authOAuthCallback',
        id: 'oauth-1',
        properties: {
          provider: 'github',
        },
      }

      expect(isAuthOAuthCallbackComponent(component)).toBe(true)
      expect(isAuthComponent(component)).toBe(true)
    })
  })

  describe('Type Guards', () => {
    it('should reject invalid components', () => {
      const invalidComponent = {
        type: 'invalidType',
        id: 'invalid-1',
        properties: {},
      }

      expect(isAuthLoginFormComponent(invalidComponent)).toBe(false)
      expect(isAuthSignupFormComponent(invalidComponent)).toBe(false)
      expect(isAuthPasswordResetComponent(invalidComponent)).toBe(false)
      expect(isAuthProfileComponent(invalidComponent)).toBe(false)
      expect(isAuthSessionManagerComponent(invalidComponent)).toBe(false)
      expect(isAuth2FAComponent(invalidComponent)).toBe(false)
      expect(isAuthOAuthCallbackComponent(invalidComponent)).toBe(false)
      expect(isAuthComponent(invalidComponent)).toBe(false)
    })

    it('should handle null and undefined', () => {
      expect(isAuthComponent(null)).toBe(false)
      expect(isAuthComponent(undefined)).toBe(false)
      expect(isAuthLoginFormComponent(null)).toBe(false)
    })
  })
})

describe('Validation Functions', () => {
  describe('validatePassword', () => {
    const requirements: PasswordRequirements = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    }

    it('should validate strong password', () => {
      const result = validatePassword('StrongP@ss123', requirements)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject password that is too short', () => {
      const result = validatePassword('Sh0rt!', requirements)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')
    })

    it('should reject password without uppercase', () => {
      const result = validatePassword('password123!', requirements)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    it('should reject password without lowercase', () => {
      const result = validatePassword('PASSWORD123!', requirements)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    it('should reject password without numbers', () => {
      const result = validatePassword('Password!', requirements)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })

    it('should reject password without special characters', () => {
      const result = validatePassword('Password123', requirements)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one special character')
    })

    it('should validate password with minimal requirements', () => {
      const minimalRequirements: PasswordRequirements = {
        minLength: 6,
      }
      const result = validatePassword('simple', minimalRequirements)
      expect(result.valid).toBe(true)
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.user+tag@example.co.uk')).toBe(true)
      expect(validateEmail('user123@test-domain.com')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('invalid@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('user@.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('validateUsername', () => {
    it('should validate correct usernames', () => {
      expect(validateUsername('john_doe').valid).toBe(true)
      expect(validateUsername('user123').valid).toBe(true)
      expect(validateUsername('test-user').valid).toBe(true)
      expect(validateUsername('abc').valid).toBe(true)
    })

    it('should reject username that is too short', () => {
      const result = validateUsername('ab')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Username must be at least 3 characters long')
    })

    it('should reject username that is too long', () => {
      const result = validateUsername('a'.repeat(31))
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Username must be at most 30 characters long')
    })

    it('should reject username with invalid characters', () => {
      const result = validateUsername('user@name')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Username can only contain letters, numbers, underscores, and hyphens')
    })
  })

  describe('validatePhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhoneNumber('+14155552671')).toBe(true)
      expect(validatePhoneNumber('+442071234567')).toBe(true)
      expect(validatePhoneNumber('+1 415 555 2671')).toBe(true)
      expect(validatePhoneNumber('+1-415-555-2671')).toBe(true)
      expect(validatePhoneNumber('+1 (415) 555-2671')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('123')).toBe(false)
      expect(validatePhoneNumber('invalid')).toBe(false)
      expect(validatePhoneNumber('')).toBe(false)
      expect(validatePhoneNumber('0000000000')).toBe(false)
    })
  })
})

describe('Auth Component Integration', () => {
  it('should create complete authentication flow', () => {
    const loginForm: AuthLoginFormComponent = {
      type: 'authLoginForm',
      id: 'login',
      properties: {
        providers: ['email', 'google', 'github'],
        showForgotPassword: true,
        showSignup: true,
      },
    }

    const signupForm: AuthSignupFormComponent = {
      type: 'authSignupForm',
      id: 'signup',
      properties: {
        providers: ['email'],
        requiredFields: ['email', 'username'],
        passwordRequirements: {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true,
        },
      },
    }

    const passwordReset: AuthPasswordResetComponent = {
      type: 'authPasswordReset',
      id: 'reset',
      properties: {
        step: 'request',
        method: 'email',
      },
    }

    expect(isAuthComponent(loginForm)).toBe(true)
    expect(isAuthComponent(signupForm)).toBe(true)
    expect(isAuthComponent(passwordReset)).toBe(true)
  })

  it('should support all OAuth providers', () => {
    const providers: Array<'google' | 'github' | 'apple' | 'microsoft'> = [
      'google',
      'github',
      'apple',
      'microsoft',
    ]

    providers.forEach((provider) => {
      const component: AuthOAuthCallbackComponent = {
        type: 'authOAuthCallback',
        id: `oauth-${provider}`,
        properties: {
          provider,
        },
      }

      expect(component.properties.provider).toBe(provider)
      expect(isAuthOAuthCallbackComponent(component)).toBe(true)
    })
  })
})
