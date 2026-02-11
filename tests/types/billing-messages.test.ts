/**
 * Tests for Billing Message Types
 */

import { describe, it, expect } from 'vitest'
import type {
  SubscriptionSelectPlanMessage,
  SubscriptionChangePlanMessage,
  SubscriptionCancelMessage,
  PaymentMethodAddMessage,
  InvoiceListRequestMessage,
  InvoiceListResponseMessage,
  InvoicePayMessage,
  UsageUpdateMessage,
  BillingAddressUpdateMessage,
  PaymentSuccessMessage,
  PaymentFailedMessage,
} from '../../src/types/billing-messages.js'
import {
  isSubscriptionSelectPlanMessage,
  isSubscriptionChangePlanMessage,
  isSubscriptionCancelMessage,
  isPaymentMethodAddMessage,
  isInvoiceListRequestMessage,
  isInvoicePayMessage,
  isUsageUpdateMessage,
  isBillingAddressUpdateMessage,
  isPaymentSuccessMessage,
  isPaymentFailedMessage,
} from '../../src/types/billing-messages.js'

describe('Billing Message Types', () => {
  describe('Subscription Messages', () => {
    it('should create subscription select plan message', () => {
      const message: SubscriptionSelectPlanMessage = {
        type: 'subscriptionSelectPlan',
        componentId: 'plans-1',
        planId: 'pro-monthly',
        interval: 'month',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('subscriptionSelectPlan')
      expect(message.planId).toBe('pro-monthly')
      expect(isSubscriptionSelectPlanMessage(message)).toBe(true)
    })

    it('should create subscription change plan message', () => {
      const message: SubscriptionChangePlanMessage = {
        type: 'subscriptionChangePlan',
        componentId: 'plans-1',
        subscriptionId: 'sub_12345',
        newPlanId: 'enterprise-annual',
        interval: 'year',
        prorationBehavior: 'create_prorations',
      }

      expect(message.type).toBe('subscriptionChangePlan')
      expect(message.newPlanId).toBe('enterprise-annual')
      expect(message.prorationBehavior).toBe('create_prorations')
      expect(isSubscriptionChangePlanMessage(message)).toBe(true)
    })

    it('should create subscription cancel message', () => {
      const message: SubscriptionCancelMessage = {
        type: 'subscriptionCancel',
        componentId: 'plans-1',
        subscriptionId: 'sub_12345',
        reason: 'too_expensive',
        feedback: 'Need more features at this price point',
        immediately: false,
      }

      expect(message.type).toBe('subscriptionCancel')
      expect(message.reason).toBe('too_expensive')
      expect(message.immediately).toBe(false)
      expect(isSubscriptionCancelMessage(message)).toBe(true)
    })
  })

  describe('Payment Method Messages', () => {
    it('should create payment method add message with card', () => {
      const message: PaymentMethodAddMessage = {
        type: 'paymentMethodAdd',
        componentId: 'payment-1',
        method: {
          type: 'card',
          card: {
            cardNumber: '4242424242424242',
            expiryMonth: 12,
            expiryYear: 2025,
            cvc: '123',
            cardholderName: 'John Doe',
          },
        },
        setAsDefault: true,
      }

      expect(message.type).toBe('paymentMethodAdd')
      expect(message.method.type).toBe('card')
      expect(message.method.card?.expiryMonth).toBe(12)
      expect(message.setAsDefault).toBe(true)
      expect(isPaymentMethodAddMessage(message)).toBe(true)
    })

    it('should create payment method add message with bank account', () => {
      const message: PaymentMethodAddMessage = {
        type: 'paymentMethodAdd',
        componentId: 'payment-1',
        method: {
          type: 'bank',
          bank: {
            bankAccount: '000123456789',
            bankRouting: '110000000',
            accountHolderName: 'John Doe',
            accountType: 'checking',
          },
        },
      }

      expect(message.method.type).toBe('bank')
      expect(message.method.bank?.accountType).toBe('checking')
    })

    it('should include billing address with payment method', () => {
      const message: PaymentMethodAddMessage = {
        type: 'paymentMethodAdd',
        componentId: 'payment-1',
        method: {
          type: 'card',
          card: {
            cardNumber: '4242424242424242',
            expiryMonth: 12,
            expiryYear: 2025,
            cvc: '123',
          },
        },
        billingAddress: {
          name: 'John Doe',
          addressLine1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94105',
          country: 'US',
        },
      }

      expect(message.billingAddress?.name).toBe('John Doe')
      expect(message.billingAddress?.city).toBe('San Francisco')
    })
  })

  describe('Invoice Messages', () => {
    it('should create invoice list request message', () => {
      const message: InvoiceListRequestMessage = {
        type: 'invoiceListRequest',
        componentId: 'history-1',
        filters: {
          dateFrom: new Date('2024-01-01'),
          dateTo: new Date('2024-12-31'),
          status: 'paid',
          minAmount: 1000,
        },
        limit: 20,
        offset: 0,
        sortBy: 'date',
        sortDirection: 'desc',
      }

      expect(message.type).toBe('invoiceListRequest')
      expect(message.filters?.status).toBe('paid')
      expect(message.sortBy).toBe('date')
      expect(isInvoiceListRequestMessage(message)).toBe(true)
    })

    it('should create invoice list response message', () => {
      const message: InvoiceListResponseMessage = {
        type: 'invoiceListResponse',
        componentId: 'history-1',
        invoices: [
          {
            id: 'inv_1',
            number: 'INV-2024-001',
            date: new Date('2024-01-15'),
            amount: 2999,
            currency: 'usd',
            status: 'paid',
            pdfUrl: 'https://example.com/invoice.pdf',
          },
          {
            id: 'inv_2',
            number: 'INV-2024-002',
            date: new Date('2024-02-15'),
            dueDate: new Date('2024-03-15'),
            amount: 2999,
            currency: 'usd',
            status: 'unpaid',
          },
        ],
        total: 50,
        offset: 0,
        limit: 20,
        hasMore: true,
      }

      expect(message.type).toBe('invoiceListResponse')
      expect(message.invoices).toHaveLength(2)
      expect(message.invoices[0]?.status).toBe('paid')
      expect(message.hasMore).toBe(true)
    })

    it('should create invoice pay message', () => {
      const message: InvoicePayMessage = {
        type: 'invoicePay',
        componentId: 'invoice-1',
        invoiceId: 'inv_12345',
        paymentMethodId: 'pm_card_visa',
      }

      expect(message.type).toBe('invoicePay')
      expect(message.invoiceId).toBe('inv_12345')
      expect(message.paymentMethodId).toBe('pm_card_visa')
      expect(isInvoicePayMessage(message)).toBe(true)
    })
  })

  describe('Usage Messages', () => {
    it('should create usage update message', () => {
      const message: UsageUpdateMessage = {
        type: 'usageUpdate',
        componentId: 'usage-1',
        metrics: [
          {
            name: 'api_calls',
            current: 7500,
            limit: 10000,
            unit: 'calls',
            percentage: 75,
          },
          {
            name: 'storage',
            current: 5.5,
            limit: 10,
            unit: 'GB',
            percentage: 55,
          },
        ],
        updatedAt: new Date(),
      }

      expect(message.type).toBe('usageUpdate')
      expect(message.metrics).toHaveLength(2)
      expect(message.metrics[0]?.percentage).toBe(75)
      expect(isUsageUpdateMessage(message)).toBe(true)
    })

    it('should handle usage warning threshold', () => {
      const metric = {
        name: 'bandwidth',
        current: 9500,
        limit: 10000,
        unit: 'GB',
        percentage: 95,
      }

      expect(metric.percentage).toBeGreaterThan(80)
      expect(metric.percentage).toBeGreaterThan(90)
    })
  })

  describe('Billing Address Messages', () => {
    it('should create billing address update message', () => {
      const message: BillingAddressUpdateMessage = {
        type: 'billingAddressUpdate',
        componentId: 'address-1',
        address: {
          name: 'John Doe',
          company: 'Acme Inc',
          addressLine1: '123 Main St',
          addressLine2: 'Suite 100',
          city: 'San Francisco',
          state: 'CA',
          zip: '94105',
          country: 'US',
          phone: '+1-555-123-4567',
          taxId: 'US12345678',
        },
      }

      expect(message.type).toBe('billingAddressUpdate')
      expect(message.address.name).toBe('John Doe')
      expect(message.address.company).toBe('Acme Inc')
      expect(message.address.taxId).toBe('US12345678')
      expect(isBillingAddressUpdateMessage(message)).toBe(true)
    })

    it('should handle addresses without optional fields', () => {
      const message: BillingAddressUpdateMessage = {
        type: 'billingAddressUpdate',
        componentId: 'address-1',
        address: {
          name: 'John Doe',
          addressLine1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94105',
          country: 'US',
        },
      }

      expect(message.address.company).toBeUndefined()
      expect(message.address.addressLine2).toBeUndefined()
      expect(message.address.phone).toBeUndefined()
    })
  })

  describe('Payment Processing Messages', () => {
    it('should create payment success message', () => {
      const message: PaymentSuccessMessage = {
        type: 'paymentSuccess',
        componentId: 'payment-1',
        paymentId: 'pi_12345',
        amount: 2999,
        currency: 'usd',
        receiptUrl: 'https://example.com/receipt',
      }

      expect(message.type).toBe('paymentSuccess')
      expect(message.amount).toBe(2999)
      expect(message.currency).toBe('usd')
      expect(isPaymentSuccessMessage(message)).toBe(true)
    })

    it('should create payment failed message', () => {
      const message: PaymentFailedMessage = {
        type: 'paymentFailed',
        componentId: 'payment-1',
        paymentId: 'pi_12345',
        errorCode: 'card_declined',
        errorMessage: 'Your card was declined',
        declineCode: 'insufficient_funds',
      }

      expect(message.type).toBe('paymentFailed')
      expect(message.errorCode).toBe('card_declined')
      expect(message.declineCode).toBe('insufficient_funds')
      expect(isPaymentFailedMessage(message)).toBe(true)
    })

    it('should handle different error codes', () => {
      const errorCodes = [
        'card_declined',
        'insufficient_funds',
        'expired_card',
        'incorrect_cvc',
        'processing_error',
      ]

      errorCodes.forEach((errorCode) => {
        const message: PaymentFailedMessage = {
          type: 'paymentFailed',
          componentId: 'payment-1',
          paymentId: 'pi_12345',
          errorCode,
          errorMessage: 'Payment failed',
        }

        expect(message.errorCode).toBe(errorCode)
      })
    })
  })

  describe('Type Guards', () => {
    it('should correctly identify message types', () => {
      const messages = [
        { type: 'subscriptionSelectPlan', componentId: '1', planId: 'pro', interval: 'month' as const },
        { type: 'subscriptionChangePlan', componentId: '2', newPlanId: 'enterprise' },
        { type: 'subscriptionCancel', componentId: '3' },
        { type: 'paymentMethodAdd', componentId: '4', method: { type: 'card' as const } },
        { type: 'invoiceListRequest', componentId: '5' },
        { type: 'invoicePay', componentId: '6', invoiceId: 'inv_1' },
        { type: 'usageUpdate', componentId: '7', metrics: [], updatedAt: new Date() },
        { type: 'billingAddressUpdate', componentId: '8', address: { name: '', addressLine1: '', city: '', state: '', zip: '', country: '' } },
        { type: 'paymentSuccess', componentId: '9', paymentId: 'pi_1', amount: 100, currency: 'usd' },
        { type: 'paymentFailed', componentId: '10', paymentId: 'pi_2', errorCode: 'err', errorMessage: 'failed' },
      ]

      expect(isSubscriptionSelectPlanMessage(messages[0]!)).toBe(true)
      expect(isSubscriptionChangePlanMessage(messages[1]!)).toBe(true)
      expect(isSubscriptionCancelMessage(messages[2]!)).toBe(true)
      expect(isPaymentMethodAddMessage(messages[3]!)).toBe(true)
      expect(isInvoiceListRequestMessage(messages[4]!)).toBe(true)
      expect(isInvoicePayMessage(messages[5]!)).toBe(true)
      expect(isUsageUpdateMessage(messages[6]!)).toBe(true)
      expect(isBillingAddressUpdateMessage(messages[7]!)).toBe(true)
      expect(isPaymentSuccessMessage(messages[8]!)).toBe(true)
      expect(isPaymentFailedMessage(messages[9]!)).toBe(true)
    })

    it('should return false for incorrect types', () => {
      const message = { type: 'userAction', componentId: '1' }

      expect(isSubscriptionSelectPlanMessage(message)).toBe(false)
      expect(isPaymentMethodAddMessage(message)).toBe(false)
      expect(isInvoiceListRequestMessage(message)).toBe(false)
      expect(isUsageUpdateMessage(message)).toBe(false)
      expect(isBillingAddressUpdateMessage(message)).toBe(false)
      expect(isPaymentSuccessMessage(message)).toBe(false)
      expect(isPaymentFailedMessage(message)).toBe(false)
    })
  })

  describe('Message Timestamps', () => {
    it('should include timestamp in messages', () => {
      const now = Date.now()
      const message: SubscriptionSelectPlanMessage = {
        type: 'subscriptionSelectPlan',
        componentId: 'plans-1',
        planId: 'pro',
        interval: 'month',
        timestamp: now,
      }

      expect(message.timestamp).toBe(now)
    })

    it('should allow optional timestamps', () => {
      const message: InvoicePayMessage = {
        type: 'invoicePay',
        componentId: 'invoice-1',
        invoiceId: 'inv_123',
      }

      expect(message.timestamp).toBeUndefined()
    })
  })
})
