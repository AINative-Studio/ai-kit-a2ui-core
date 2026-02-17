/**
 * Tests for Billing Component Types
 */

import { describe, it, expect } from 'vitest'
import type {
  SubscriptionPlanComponent,
  BillingHistoryComponent,
  PaymentMethodComponent,
  UsageMeterComponent,
  InvoiceViewerComponent,
  BillingAddressComponent,
  SubscriptionPlan,
  UsageMetric,
  BillingAddress,
} from '../../src/types/billing-components.js'
import {
  isSubscriptionPlanComponent,
  isBillingHistoryComponent,
  isPaymentMethodComponent,
  isUsageMeterComponent,
  isInvoiceViewerComponent,
  isBillingAddressComponent,
} from '../../src/types/billing-components.js'

describe('Billing Component Types', () => {
  describe('SubscriptionPlanComponent', () => {
    it('should create valid subscription plan component', () => {
      const plan: SubscriptionPlan = {
        id: 'pro-monthly',
        name: 'Pro Plan',
        description: 'Professional tier',
        price: 2999,
        currency: 'usd',
        interval: 'month',
        features: ['Feature 1', 'Feature 2'],
        highlighted: true,
      }

      const component: SubscriptionPlanComponent = {
        type: 'subscriptionPlan',
        id: 'plans-1',
        properties: {
          plans: [plan],
          currentPlan: 'free',
          showComparison: true,
          showAnnualDiscount: true,
          annualDiscountPercent: 20,
        },
      }

      expect(component.type).toBe('subscriptionPlan')
      expect(component.properties.plans).toHaveLength(1)
      expect(component.properties.plans[0]?.price).toBe(2999)
      expect(isSubscriptionPlanComponent(component)).toBe(true)
    })

    it('should handle multiple plans', () => {
      const component: SubscriptionPlanComponent = {
        type: 'subscriptionPlan',
        id: 'plans-2',
        properties: {
          plans: [
            {
              id: 'free',
              name: 'Free',
              description: 'Basic features',
              price: 0,
              currency: 'usd',
              interval: 'month',
              features: ['Feature 1'],
            },
            {
              id: 'pro',
              name: 'Pro',
              description: 'All features',
              price: 2999,
              currency: 'usd',
              interval: 'month',
              features: ['Feature 1', 'Feature 2', 'Feature 3'],
              mostPopular: true,
            },
          ],
        },
      }

      expect(component.properties.plans).toHaveLength(2)
      expect(component.properties.plans[1]?.mostPopular).toBe(true)
    })
  })

  describe('BillingHistoryComponent', () => {
    it('should create valid billing history component', () => {
      const component: BillingHistoryComponent = {
        type: 'billingHistory',
        id: 'history-1',
        properties: {
          showFilters: true,
          itemsPerPage: 20,
          showDownloadInvoice: true,
          columns: ['date', 'description', 'amount', 'status'],
          groupBy: 'month',
        },
      }

      expect(component.type).toBe('billingHistory')
      expect(component.properties.itemsPerPage).toBe(20)
      expect(isBillingHistoryComponent(component)).toBe(true)
    })

    it('should handle date range filters', () => {
      const start = new Date('2024-01-01')
      const end = new Date('2024-12-31')

      const component: BillingHistoryComponent = {
        type: 'billingHistory',
        id: 'history-2',
        properties: {
          dateRange: { start, end },
          showFilters: true,
        },
      }

      expect(component.properties.dateRange?.start).toEqual(start)
      expect(component.properties.dateRange?.end).toEqual(end)
    })
  })

  describe('PaymentMethodComponent', () => {
    it('should create valid payment method component', () => {
      const component: PaymentMethodComponent = {
        type: 'paymentMethod',
        id: 'payment-1',
        properties: {
          methods: ['card', 'bank', 'paypal'],
          allowMultiple: true,
          showDefault: true,
          allowSetDefault: true,
          allowDelete: true,
          showAddNew: true,
        },
      }

      expect(component.type).toBe('paymentMethod')
      expect(component.properties.methods).toContain('card')
      expect(component.properties.allowMultiple).toBe(true)
      expect(isPaymentMethodComponent(component)).toBe(true)
    })

    it('should handle single payment method type', () => {
      const component: PaymentMethodComponent = {
        type: 'paymentMethod',
        id: 'payment-2',
        properties: {
          methods: ['card'],
          allowMultiple: false,
        },
      }

      expect(component.properties.methods).toHaveLength(1)
      expect(component.properties.allowMultiple).toBe(false)
    })
  })

  describe('UsageMeterComponent', () => {
    it('should create valid usage meter component', () => {
      const metrics: UsageMetric[] = [
        {
          name: 'api_calls',
          displayName: 'API Calls',
          current: 7500,
          limit: 10000,
          unit: 'calls',
          percentage: 75,
        },
        {
          name: 'storage',
          displayName: 'Storage',
          current: 5.5,
          limit: 10,
          unit: 'GB',
          percentage: 55,
        },
      ]

      const component: UsageMeterComponent = {
        type: 'usageMeter',
        id: 'usage-1',
        properties: {
          metrics,
          showPercentage: true,
          showWarnings: true,
          warningThreshold: 80,
          layout: 'cards',
          refreshInterval: 30,
        },
      }

      expect(component.type).toBe('usageMeter')
      expect(component.properties.metrics).toHaveLength(2)
      expect(component.properties.metrics[0]?.current).toBe(7500)
      expect(isUsageMeterComponent(component)).toBe(true)
    })

    it('should calculate usage percentage correctly', () => {
      const metric: UsageMetric = {
        name: 'bandwidth',
        current: 750,
        limit: 1000,
        unit: 'GB',
        percentage: 75,
      }

      expect(metric.percentage).toBe(75)
      expect(metric.current / metric.limit).toBeCloseTo(0.75)
    })
  })

  describe('InvoiceViewerComponent', () => {
    it('should create valid invoice viewer component', () => {
      const component: InvoiceViewerComponent = {
        type: 'invoiceViewer',
        id: 'invoice-1',
        properties: {
          invoiceId: 'inv_12345',
          showDownload: true,
          showPrint: true,
          showPayNow: true,
          format: 'embedded',
        },
      }

      expect(component.type).toBe('invoiceViewer')
      expect(component.properties.invoiceId).toBe('inv_12345')
      expect(component.properties.showDownload).toBe(true)
      expect(isInvoiceViewerComponent(component)).toBe(true)
    })

    it('should handle different display formats', () => {
      const formats: Array<'embedded' | 'modal' | 'new-tab'> = [
        'embedded',
        'modal',
        'new-tab',
      ]

      formats.forEach((format) => {
        const component: InvoiceViewerComponent = {
          type: 'invoiceViewer',
          id: `invoice-${format}`,
          properties: {
            invoiceId: 'inv_12345',
            format,
          },
        }

        expect(component.properties.format).toBe(format)
      })
    })
  })

  describe('BillingAddressComponent', () => {
    it('should create valid billing address component', () => {
      const component: BillingAddressComponent = {
        type: 'billingAddress',
        id: 'address-1',
        properties: {
          requiredFields: [
            'name',
            'addressLine1',
            'city',
            'state',
            'zip',
            'country',
          ],
          optionalFields: ['company', 'addressLine2', 'phone'],
          validateTaxId: true,
          suggestAddress: true,
        },
      }

      expect(component.type).toBe('billingAddress')
      expect(component.properties.requiredFields).toContain('name')
      expect(component.properties.validateTaxId).toBe(true)
      expect(isBillingAddressComponent(component)).toBe(true)
    })

    it('should handle current address data', () => {
      const address: BillingAddress = {
        name: 'John Doe',
        company: 'Acme Inc',
        addressLine1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'US',
        phone: '+1234567890',
        taxId: 'US12345678',
      }

      const component: BillingAddressComponent = {
        type: 'billingAddress',
        id: 'address-2',
        properties: {
          requiredFields: ['name', 'addressLine1', 'city', 'state', 'zip', 'country'],
          currentAddress: address,
        },
      }

      expect(component.properties.currentAddress?.name).toBe('John Doe')
      expect(component.properties.currentAddress?.company).toBe('Acme Inc')
    })
  })

  describe('Type Guards', () => {
    it('should correctly identify component types', () => {
      const components = [
        { type: 'subscriptionPlan', id: '1', properties: { plans: [] } },
        { type: 'billingHistory', id: '2', properties: {} },
        { type: 'paymentMethod', id: '3', properties: { methods: [] } },
        { type: 'usageMeter', id: '4', properties: { metrics: [] } },
        { type: 'invoiceViewer', id: '5', properties: { invoiceId: '' } },
        { type: 'billingAddress', id: '6', properties: { requiredFields: [] } },
      ]

      expect(isSubscriptionPlanComponent(components[0]!)).toBe(true)
      expect(isBillingHistoryComponent(components[1]!)).toBe(true)
      expect(isPaymentMethodComponent(components[2]!)).toBe(true)
      expect(isUsageMeterComponent(components[3]!)).toBe(true)
      expect(isInvoiceViewerComponent(components[4]!)).toBe(true)
      expect(isBillingAddressComponent(components[5]!)).toBe(true)
    })

    it('should return false for incorrect types', () => {
      const component = { type: 'button', id: '1' }

      expect(isSubscriptionPlanComponent(component)).toBe(false)
      expect(isBillingHistoryComponent(component)).toBe(false)
      expect(isPaymentMethodComponent(component)).toBe(false)
      expect(isUsageMeterComponent(component)).toBe(false)
      expect(isInvoiceViewerComponent(component)).toBe(false)
      expect(isBillingAddressComponent(component)).toBe(false)
    })
  })
})
