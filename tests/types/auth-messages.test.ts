/**
 * Authentication Message Types Tests (Issue #48)
 */

import { describe, it, expect } from 'vitest'
import {
  type AuthLoginMessage,
  type AuthLoginSuccessMessage,
  type AuthSignupMessage,
  type AuthSignupSuccessMessage,
  type AuthPasswordResetRequestMessage,
  type Auth2FASetupMessage,
  type AuthOAuthInitiateMessage,
  type AuthLogoutMessage,
  isAuthLoginMessage,
  isAuthLoginSuccessMessage,
  isAuthSignupMessage,
  isAuth2FASetupMessage,
  isAuthOAuthInitiateMessage,
  isAuthLogoutMessage,
} from '../../src/types/auth-messages.js'

describe('Auth Message Types', () => {
  describe('Login Messages', () => {
    it('should create email login message', () => {
      const message: AuthLoginMessage = {
        type: 'authLogin',
        componentId: 'login-1',
        provider: 'email',
        credentials: {
          email: 'user@example.com',
          password: 'password123',
        },
        rememberMe: true,
      }

      expect(message.type).toBe('authLogin')
      expect(message.provider).toBe('email')
      expect(isAuthLoginMessage(message)).toBe(true)
    })

    it('should create OAuth login message', () => {
      const message: AuthLoginMessage = {
        type: 'authLogin',
        componentId: 'login-1',
        provider: 'google',
        oauthToken: 'token123',
      }

      expect(message.provider).toBe('google')
      expect(message.oauthToken).toBeDefined()
    })

    it('should create login success message', () => {
      const message: AuthLoginSuccessMessage = {
        type: 'authLoginSuccess',
        componentId: 'login-1',
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'John Doe',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      }

      expect(message.type).toBe('authLoginSuccess')
      expect(isAuthLoginSuccessMessage(message)).toBe(true)
      expect(message.user.id).toBe('user-1')
    })
  })

  describe('Signup Messages', () => {
    it('should create signup message', () => {
      const message: AuthSignupMessage = {
        type: 'authSignup',
        componentId: 'signup-1',
        provider: 'email',
        data: {
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          username: 'newuser',
          firstName: 'John',
          lastName: 'Doe',
          termsAccepted: true,
        },
      }

      expect(message.type).toBe('authSignup')
      expect(isAuthSignupMessage(message)).toBe(true)
      expect(message.data.termsAccepted).toBe(true)
    })

    it('should create signup success message', () => {
      const message: AuthSignupSuccessMessage = {
        type: 'authSignupSuccess',
        componentId: 'signup-1',
        user: {
          id: 'user-1',
          email: 'newuser@example.com',
        },
        requiresVerification: true,
        verificationMethod: 'email',
        verificationSentTo: 'newuser@example.com',
      }

      expect(message.requiresVerification).toBe(true)
      expect(message.verificationMethod).toBe('email')
    })
  })

  describe('Password Reset Messages', () => {
    it('should create password reset request message', () => {
      const message: AuthPasswordResetRequestMessage = {
        type: 'authPasswordResetRequest',
        componentId: 'reset-1',
        email: 'user@example.com',
        method: 'email',
      }

      expect(message.type).toBe('authPasswordResetRequest')
      expect(message.method).toBe('email')
    })
  })

  describe('2FA Messages', () => {
    it('should create 2FA setup message', () => {
      const message: Auth2FASetupMessage = {
        type: 'auth2FASetup',
        componentId: '2fa-1',
        method: 'totp',
      }

      expect(message.type).toBe('auth2FASetup')
      expect(isAuth2FASetupMessage(message)).toBe(true)
      expect(message.method).toBe('totp')
    })
  })

  describe('OAuth Messages', () => {
    it('should create OAuth initiate message', () => {
      const message: AuthOAuthInitiateMessage = {
        type: 'authOAuthInitiate',
        componentId: 'oauth-1',
        provider: 'google',
        redirectUrl: '/callback',
        scopes: ['email', 'profile'],
      }

      expect(message.type).toBe('authOAuthInitiate')
      expect(isAuthOAuthInitiateMessage(message)).toBe(true)
      expect(message.scopes).toContain('email')
    })
  })

  describe('Logout Messages', () => {
    it('should create logout message', () => {
      const message: AuthLogoutMessage = {
        type: 'authLogout',
        componentId: 'logout-1',
        allSessions: false,
      }

      expect(message.type).toBe('authLogout')
      expect(isAuthLogoutMessage(message)).toBe(true)
      expect(message.allSessions).toBe(false)
    })
  })

  describe('Type Guards', () => {
    it('should reject invalid messages', () => {
      const invalid = { type: 'invalid', componentId: 'test' }

      expect(isAuthLoginMessage(invalid)).toBe(false)
      expect(isAuthSignupMessage(invalid)).toBe(false)
      expect(isAuth2FASetupMessage(invalid)).toBe(false)
    })
  })
})
