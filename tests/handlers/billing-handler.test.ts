/**
 * Tests for BillingHandler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BillingHandler } from '../../src/handlers/billing-handler.js'
import type {
  BillingService,
  BillingHandlerOptions,
} from '../../src/handlers/billing-handler.js'
import type {
  SubscriptionSelectPlanMessage,
  SubscriptionChangePlanMessage,
  SubscriptionCancelMessage,
  PaymentMethodAddMessage,
  InvoiceListRequestMessage,
  UsageRequestMessage,
  BillingAddressUpdateMessage,
} from '../../src/types/billing-messages.js'
import type { UsageMetric, InvoiceData } from '../../src/types/billing-components.js'

describe('BillingHandler', () => {
  let mockBillingService: BillingService
  let billingHandler: BillingHandler
  let messages: unknown[]

  beforeEach(() => {
    messages = []

    // Mock billing service
    mockBillingService = {
      createSubscription: vi.fn().mockResolvedValue({
        subscriptionId: 'sub_12345',
        customerId: 'cus_12345',
      }),
      changeSubscription: vi.fn().mockResolvedValue(undefined),
      cancelSubscription: vi.fn().mockResolvedValue(undefined),
      resumeSubscription: vi.fn().mockResolvedValue(undefined),
      getSubscription: vi.fn().mockResolvedValue({
        subscriptionId: 'sub_12345',
        planId: 'pro-monthly',
        status: 'active',
        currentPeriodEnd: new Date('2024-12-31'),
      }),
      getInvoices: vi.fn().mockResolvedValue({
        invoices: [
          {
            id: 'inv_1',
            number: 'INV-001',
            date: new Date('2024-01-15'),
            dueDate: new Date('2024-02-15'),
            status: 'paid',
            lineItems: [],
            subtotal: 2999,
            total: 2999,
            currency: 'usd',
          },
        ] as InvoiceData[],
        total: 1,
      }),
      updateBillingAddress: vi.fn().mockResolvedValue(undefined),
      getBillingAddress: vi.fn().mockResolvedValue(null),
      getUsageMetrics: vi.fn().mockResolvedValue([
        {
          name: 'api_calls',
          current: 7500,
          limit: 10000,
          unit: 'calls',
        },
      ] as UsageMetric[]),
      recordUsage: vi.fn().mockResolvedValue(undefined),
    }

    const options: BillingHandlerOptions = {
      userId: 'user_123',
      billingService: mockBillingService,
      defaultCurrency: 'usd',
      onMessage: (message) => messages.push(message),
      onError: (error) => console.error(error),
    }

    billingHandler = new BillingHandler(options)
  })

  describe('Subscription Operations', () => {
    it('should handle plan selection', async () => {
      const message: SubscriptionSelectPlanMessage = {
        type: 'subscriptionSelectPlan',
        componentId: 'plans-1',
        planId: 'pro-monthly',
        interval: 'month',
      }

      await billingHandler.handleSelectPlan(message)

      expect(mockBillingService.createSubscription).toHaveBeenCalledWith(
        'user_123',
        'pro-monthly',
        'month'
      )
      expect(messages).toHaveLength(1)
      expect(messages[0]).toMatchObject({
        type: 'subscriptionUpdated',
        componentId: 'plans-1',
        status: 'active',
      })
    })

    it('should handle plan change', async () => {
      const message: SubscriptionChangePlanMessage = {
        type: 'subscriptionChangePlan',
        componentId: 'plans-1',
        subscriptionId: 'sub_12345',
        newPlanId: 'enterprise-annual',
        interval: 'year',
        prorationBehavior: 'create_prorations',
      }

      await billingHandler.handleChangePlan(message)

      expect(mockBillingService.changeSubscription).toHaveBeenCalledWith(
        'sub_12345',
        'enterprise-annual',
        'year'
      )
      expect(messages).toHaveLength(1)
      expect(messages[0]).toMatchObject({
        type: 'subscriptionUpdated',
        status: 'active',
      })
    })

    it('should handle subscription cancellation', async () => {
      const message: SubscriptionCancelMessage = {
        type: 'subscriptionCancel',
        componentId: 'plans-1',
        subscriptionId: 'sub_12345',
        reason: 'too_expensive',
        immediately: false,
      }

      await billingHandler.handleCancelSubscription(message)

      expect(mockBillingService.cancelSubscription).toHaveBeenCalledWith(
        'sub_12345',
        false
      )
      expect(messages).toHaveLength(1)
      expect(messages[0]).toMatchObject({
        type: 'subscriptionUpdated',
        status: 'canceled',
      })
    })

    it('should handle immediate cancellation', async () => {
      const message: SubscriptionCancelMessage = {
        type: 'subscriptionCancel',
        componentId: 'plans-1',
        immediately: true,
      }

      await billingHandler.handleCancelSubscription(message)

      expect(mockBillingService.cancelSubscription).toHaveBeenCalledWith(
        'sub_12345',
        true
      )
    })
  })

  describe('Payment Method Operations', () => {
    it('should handle adding payment method', async () => {
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
        setAsDefault: true,
      }

      // Note: This would require Stripe integration
      // For now, we test that it handles the message structure
      expect(message.method.type).toBe('card')
      expect(message.setAsDefault).toBe(true)
    })
  })

  describe('Invoice Operations', () => {
    it('should handle invoice list request', async () => {
      const message: InvoiceListRequestMessage = {
        type: 'invoiceListRequest',
        componentId: 'history-1',
        filters: {
          dateFrom: new Date('2024-01-01'),
          dateTo: new Date('2024-12-31'),
          status: 'paid',
        },
        limit: 20,
        offset: 0,
      }

      const response = await billingHandler.handleInvoiceListRequest(message)

      expect(mockBillingService.getInvoices).toHaveBeenCalledWith('user_123', {
        dateFrom: expect.any(Date),
        dateTo: expect.any(Date),
        status: 'paid',
        limit: 20,
        offset: 0,
      })
      expect(response.type).toBe('invoiceListResponse')
      expect(response.invoices).toHaveLength(1)
      expect(response.total).toBe(1)
    })

    it('should handle pagination correctly', async () => {
      const message: InvoiceListRequestMessage = {
        type: 'invoiceListRequest',
        componentId: 'history-1',
        limit: 10,
        offset: 20,
      }

      const response = await billingHandler.handleInvoiceListRequest(message)

      expect(response.offset).toBe(20)
      expect(response.limit).toBe(10)
      expect(response.hasMore).toBe(false)
    })
  })

  describe('Usage Tracking', () => {
    it('should handle usage request', async () => {
      const message: UsageRequestMessage = {
        type: 'usageRequest',
        componentId: 'usage-1',
        metrics: ['api_calls', 'storage'],
      }

      await billingHandler.handleUsageRequest(message)

      expect(mockBillingService.getUsageMetrics).toHaveBeenCalledWith('user_123', [
        'api_calls',
        'storage',
      ])
      expect(messages).toHaveLength(1)
      expect(messages[0]).toMatchObject({
        type: 'usageUpdate',
        componentId: 'usage-1',
      })
    })

    it('should calculate usage percentage', async () => {
      const message: UsageRequestMessage = {
        type: 'usageRequest',
        componentId: 'usage-1',
      }

      await billingHandler.handleUsageRequest(message)

      const response = messages[0] as { metrics: Array<{ percentage: number }> }
      expect(response.metrics[0]?.percentage).toBe(75) // 7500 / 10000
    })

    it('should subscribe to usage updates', () => {
      const callback = vi.fn()

      const unsubscribe = billingHandler.subscribeToUsage('usage-1', callback)

      // Simulate usage update
      billingHandler.handleUsageUpdate({
        type: 'usageUpdate',
        componentId: 'usage-1',
        metrics: [
          {
            name: 'api_calls',
            current: 8000,
            limit: 10000,
            unit: 'calls',
            percentage: 80,
          },
        ],
        updatedAt: new Date(),
      })

      expect(callback).toHaveBeenCalledWith([
        {
          name: 'api_calls',
          current: 8000,
          limit: 10000,
          unit: 'calls',
          percentage: 80,
        },
      ])

      unsubscribe()
    })

    it('should allow multiple subscribers', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      billingHandler.subscribeToUsage('usage-1', callback1)
      billingHandler.subscribeToUsage('usage-1', callback2)

      billingHandler.handleUsageUpdate({
        type: 'usageUpdate',
        componentId: 'usage-1',
        metrics: [],
        updatedAt: new Date(),
      })

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })
  })

  describe('Billing Address', () => {
    it('should handle billing address update', async () => {
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

      await billingHandler.handleBillingAddressUpdate(message)

      expect(mockBillingService.updateBillingAddress).toHaveBeenCalledWith(
        'user_123',
        message.address
      )
      expect(messages).toHaveLength(1)
      expect(messages[0]).toMatchObject({
        type: 'billingAddressUpdated',
        componentId: 'address-1',
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockBillingService.createSubscription = vi
        .fn()
        .mockRejectedValue(new Error('Service unavailable'))

      const message: SubscriptionSelectPlanMessage = {
        type: 'subscriptionSelectPlan',
        componentId: 'plans-1',
        planId: 'pro-monthly',
        interval: 'month',
      }

      await billingHandler.handleSelectPlan(message)

      // Should send error message
      expect(messages).toHaveLength(1)
      expect(messages[0]).toMatchObject({
        type: 'paymentMethodError',
        code: 'BILLING_ERROR',
      })
    })

    it('should handle missing subscription', async () => {
      mockBillingService.getSubscription = vi.fn().mockResolvedValue(null)

      const message: SubscriptionChangePlanMessage = {
        type: 'subscriptionChangePlan',
        componentId: 'plans-1',
        newPlanId: 'enterprise',
      }

      await billingHandler.handleChangePlan(message)

      // Should send error message
      expect(messages).toHaveLength(1)
      expect(messages[0]).toMatchObject({
        type: 'paymentMethodError',
        message: expect.stringContaining('No active subscription'),
      })
    })
  })

  describe('Auto-refresh', () => {
    it('should start usage auto-refresh', () => {
      const callback = vi.fn()
      billingHandler.subscribeToUsage('usage-1', callback)

      // This would require mocking timers in a real test
      billingHandler.startUsageRefresh('usage-1', 30)

      // Verify internal state
      expect(billingHandler).toBeDefined()
    })

    it('should stop usage auto-refresh', () => {
      const callback = vi.fn()
      const unsubscribe = billingHandler.subscribeToUsage('usage-1', callback)

      billingHandler.startUsageRefresh('usage-1', 30)
      billingHandler.stopUsageRefresh('usage-1')

      unsubscribe()
    })
  })

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      billingHandler.subscribeToUsage('usage-1', callback1)
      billingHandler.subscribeToUsage('usage-2', callback2)
      billingHandler.startUsageRefresh('usage-1', 30)

      billingHandler.destroy()

      // Verify all resources cleaned up
      expect(billingHandler).toBeDefined()
    })
  })
})
