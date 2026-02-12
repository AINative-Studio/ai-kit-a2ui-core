# Billing & Subscription Components

Comprehensive billing and subscription management components for A2UI Core, designed for seamless integration with AINative billing service and Stripe payment processing.

## Table of Contents

- [Overview](#overview)
- [Component Types](#component-types)
- [Message Types](#message-types)
- [Integration Guide](#integration-guide)
- [Examples](#examples)
- [Security Considerations](#security-considerations)
- [Best Practices](#best-practices)

## Overview

The billing and subscription system provides 6 specialized components and 40+ message types for complete billing functionality:

### Components

1. **subscriptionPlan** - Plan selection and comparison
2. **billingHistory** - Transaction history with filtering
3. **paymentMethod** - Payment method management
4. **usageMeter** - Real-time usage tracking
5. **invoiceViewer** - Invoice display and payment
6. **billingAddress** - Billing address management

### Key Features

- **Zero Dependencies** - Framework-agnostic implementation
- **Type-Safe** - Full TypeScript support with strict typing
- **Stripe Integration** - Pre-built Stripe payment integration
- **AINative Ready** - Designed for AINative billing service
- **Usage-Based Billing** - Support for metered billing
- **Multi-Currency** - International payment support
- **Secure** - PCI-compliant payment handling

## Component Types

### 1. Subscription Plan Component

Display and compare subscription plans with pricing.

```typescript
import type { SubscriptionPlanComponent } from '@ainative/ai-kit-a2ui-core/types'

const planComponent: SubscriptionPlanComponent = {
  type: 'subscriptionPlan',
  id: 'subscription-plans',
  properties: {
    plans: [
      {
        id: 'starter',
        name: 'Starter',
        description: 'Perfect for small projects',
        price: 999, // $9.99 in cents
        currency: 'usd',
        interval: 'month',
        features: [
          '10,000 API calls/month',
          '1 GB storage',
          'Email support'
        ]
      },
      {
        id: 'pro',
        name: 'Professional',
        description: 'For growing businesses',
        price: 2999, // $29.99
        currency: 'usd',
        interval: 'month',
        features: [
          '100,000 API calls/month',
          '10 GB storage',
          'Priority email support',
          'Advanced analytics'
        ],
        highlighted: true,
        mostPopular: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Custom solutions',
        price: 0,
        currency: 'usd',
        interval: 'month',
        features: [
          'Unlimited API calls',
          'Unlimited storage',
          '24/7 phone support',
          'Custom integrations'
        ],
        custom: true
      }
    ],
    currentPlan: 'starter',
    showComparison: true,
    showAnnualDiscount: true,
    annualDiscountPercent: 20,
    allowCustomPlan: true,
    customPlanCtaText: 'Contact Sales'
  }
}
```

#### Annual Pricing

```typescript
const annualPlan: SubscriptionPlanComponent = {
  type: 'subscriptionPlan',
  id: 'plans',
  properties: {
    plans: [
      {
        id: 'pro-annual',
        name: 'Professional',
        description: 'Annual billing - Save 20%',
        price: 28788, // $287.88 (20% off $359.88)
        currency: 'usd',
        interval: 'year',
        features: ['All Pro features', 'Annual billing discount']
      }
    ],
    showAnnualDiscount: true,
    annualDiscountPercent: 20
  }
}
```

### 2. Billing History Component

Display transaction history with filtering and pagination.

```typescript
import type { BillingHistoryComponent } from '@ainative/ai-kit-a2ui-core/types'

const historyComponent: BillingHistoryComponent = {
  type: 'billingHistory',
  id: 'billing-history',
  properties: {
    showFilters: true,
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31')
    },
    itemsPerPage: 20,
    showDownloadInvoice: true,
    showReceipt: true,
    columns: ['date', 'description', 'amount', 'status', 'invoice'],
    groupBy: 'month',
    metadata: {
      exportFormats: ['pdf', 'csv', 'excel']
    }
  }
}
```

### 3. Payment Method Component

Manage payment methods (cards, bank accounts, PayPal).

```typescript
import type { PaymentMethodComponent } from '@ainative/ai-kit-a2ui-core/types'

const paymentComponent: PaymentMethodComponent = {
  type: 'paymentMethod',
  id: 'payment-methods',
  properties: {
    methods: ['card', 'bank', 'paypal'],
    allowMultiple: true,
    showDefault: true,
    allowSetDefault: true,
    allowDelete: true,
    showAddNew: true,
    metadata: {
      cardBrands: ['visa', 'mastercard', 'amex', 'discover'],
      supportedBanks: ['US', 'CA', 'GB']
    }
  }
}
```

### 4. Usage Meter Component

Display real-time usage metrics with warnings.

```typescript
import type { UsageMeterComponent } from '@ainative/ai-kit-a2ui-core/types'

const usageComponent: UsageMeterComponent = {
  type: 'usageMeter',
  id: 'usage-tracking',
  properties: {
    metrics: [
      {
        name: 'api_calls',
        displayName: 'API Calls',
        current: 7500,
        limit: 10000,
        unit: 'calls',
        percentage: 75,
        resetDate: new Date('2024-02-01')
      },
      {
        name: 'storage',
        displayName: 'Storage',
        current: 5.5,
        limit: 10,
        unit: 'GB',
        percentage: 55,
        resetDate: new Date('2024-02-01')
      },
      {
        name: 'bandwidth',
        displayName: 'Bandwidth',
        current: 250,
        limit: 1000,
        unit: 'GB',
        percentage: 25,
        resetDate: new Date('2024-02-01')
      }
    ],
    showPercentage: true,
    showWarnings: true,
    warningThreshold: 80, // Show warning at 80%
    layout: 'cards',
    refreshInterval: 30 // Auto-refresh every 30 seconds
  }
}
```

### 5. Invoice Viewer Component

Display detailed invoice information.

```typescript
import type { InvoiceViewerComponent } from '@ainative/ai-kit-a2ui-core/types'

const invoiceComponent: InvoiceViewerComponent = {
  type: 'invoiceViewer',
  id: 'invoice-display',
  properties: {
    invoiceId: 'inv_1234567890',
    showDownload: true,
    showPrint: true,
    showPayNow: true,
    format: 'embedded',
    metadata: {
      companyInfo: {
        name: 'AINative Studio',
        address: '123 Tech Street, San Francisco, CA 94105',
        taxId: 'US12345678'
      }
    }
  }
}
```

### 6. Billing Address Component

Collect and validate billing address information.

```typescript
import type { BillingAddressComponent } from '@ainative/ai-kit-a2ui-core/types'

const addressComponent: BillingAddressComponent = {
  type: 'billingAddress',
  id: 'billing-address',
  properties: {
    requiredFields: [
      'name',
      'addressLine1',
      'city',
      'state',
      'zip',
      'country'
    ],
    optionalFields: ['company', 'addressLine2', 'phone'],
    validateTaxId: true,
    suggestAddress: true, // Enable address autocomplete
    currentAddress: {
      name: 'John Doe',
      company: 'Acme Inc',
      addressLine1: '123 Main Street',
      addressLine2: 'Suite 100',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'US',
      phone: '+1-555-123-4567',
      taxId: 'US12345678'
    }
  }
}
```

## Message Types

### Subscription Messages

#### Select Plan

```typescript
import type { SubscriptionSelectPlanMessage } from '@ainative/ai-kit-a2ui-core/types'

const selectPlanMsg: SubscriptionSelectPlanMessage = {
  type: 'subscriptionSelectPlan',
  componentId: 'subscription-plans',
  planId: 'pro-monthly',
  interval: 'month',
  couponCode: 'SAVE20' // Optional
}
```

#### Change Plan

```typescript
import type { SubscriptionChangePlanMessage } from '@ainative/ai-kit-a2ui-core/types'

const changePlanMsg: SubscriptionChangePlanMessage = {
  type: 'subscriptionChangePlan',
  componentId: 'subscription-plans',
  subscriptionId: 'sub_1234567890',
  newPlanId: 'enterprise-annual',
  interval: 'year',
  prorationBehavior: 'create_prorations' // or 'none' or 'always_invoice'
}
```

#### Cancel Subscription

```typescript
import type { SubscriptionCancelMessage } from '@ainative/ai-kit-a2ui-core/types'

const cancelMsg: SubscriptionCancelMessage = {
  type: 'subscriptionCancel',
  componentId: 'subscription-plans',
  subscriptionId: 'sub_1234567890',
  reason: 'too_expensive',
  feedback: 'Need more features at this price point',
  immediately: false // Cancel at period end
}
```

### Payment Method Messages

#### Add Payment Method

```typescript
import type { PaymentMethodAddMessage } from '@ainative/ai-kit-a2ui-core/types'

const addCardMsg: PaymentMethodAddMessage = {
  type: 'paymentMethodAdd',
  componentId: 'payment-methods',
  method: {
    type: 'card',
    card: {
      cardNumber: '4242424242424242', // Test card
      expiryMonth: 12,
      expiryYear: 2025,
      cvc: '123',
      cardholderName: 'John Doe'
    }
  },
  setAsDefault: true,
  billingAddress: {
    name: 'John Doe',
    addressLine1: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zip: '94105',
    country: 'US'
  }
}
```

### Invoice Messages

#### Request Invoice List

```typescript
import type { InvoiceListRequestMessage } from '@ainative/ai-kit-a2ui-core/types'

const listInvoicesMsg: InvoiceListRequestMessage = {
  type: 'invoiceListRequest',
  componentId: 'billing-history',
  filters: {
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-12-31'),
    status: 'paid',
    minAmount: 1000,
    maxAmount: 10000
  },
  limit: 20,
  offset: 0,
  sortBy: 'date',
  sortDirection: 'desc'
}
```

#### Pay Invoice

```typescript
import type { InvoicePayMessage } from '@ainative/ai-kit-a2ui-core/types'

const payInvoiceMsg: InvoicePayMessage = {
  type: 'invoicePay',
  componentId: 'invoice-display',
  invoiceId: 'inv_1234567890',
  paymentMethodId: 'pm_card_visa' // Optional - uses default if not provided
}
```

### Usage Messages

#### Request Usage Data

```typescript
import type { UsageRequestMessage } from '@ainative/ai-kit-a2ui-core/types'

const usageRequestMsg: UsageRequestMessage = {
  type: 'usageRequest',
  componentId: 'usage-tracking',
  metrics: ['api_calls', 'storage', 'bandwidth'] // Optional - all metrics if not provided
}
```

## Integration Guide

### Step 1: Install Dependencies

```bash
npm install @ainative/ai-kit-a2ui-core
```

### Step 2: Set Up Billing Handler

```typescript
import { BillingHandler } from '@ainative/ai-kit-a2ui-core/handlers'
import { StripeIntegration } from '@ainative/ai-kit-a2ui-core/integrations'
import type { BillingService } from '@ainative/ai-kit-a2ui-core/handlers'

// Implement your billing service
const billingService: BillingService = {
  createSubscription: async (userId, planId, interval) => {
    // Call your backend API
    const response = await fetch('/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ userId, planId, interval })
    })
    return response.json()
  },
  // ... implement other methods
}

// Initialize Stripe integration
const stripeIntegration = new StripeIntegration(
  {
    publishableKey: 'pk_test_...',
    secretKey: 'sk_test_...' // Server-side only
  },
  stripeApiClient // Your Stripe API client implementation
)

// Create billing handler
const billingHandler = new BillingHandler({
  userId: 'user_123',
  billingService,
  stripeIntegration,
  defaultCurrency: 'usd',
  allowedCurrencies: ['usd', 'eur', 'gbp'],
  usageMetrics: [
    { name: 'api_calls', unit: 'calls', displayName: 'API Calls', limit: 10000 },
    { name: 'storage', unit: 'GB', displayName: 'Storage', limit: 10 }
  ],
  onMessage: (message) => {
    // Handle outgoing messages to UI
    console.log('Billing message:', message)
  },
  onError: (error) => {
    // Handle errors
    console.error('Billing error:', error)
  }
})
```

### Step 3: Handle Messages

```typescript
// Handle plan selection
await billingHandler.handleSelectPlan({
  type: 'subscriptionSelectPlan',
  componentId: 'plans',
  planId: 'pro-monthly',
  interval: 'month'
})

// Handle invoice list request
const invoices = await billingHandler.handleInvoiceListRequest({
  type: 'invoiceListRequest',
  componentId: 'history',
  limit: 20,
  offset: 0
})

// Subscribe to usage updates
const unsubscribe = billingHandler.subscribeToUsage('usage-1', (metrics) => {
  console.log('Usage updated:', metrics)
})

// Enable auto-refresh (every 30 seconds)
billingHandler.startUsageRefresh('usage-1', 30)

// Cleanup
unsubscribe()
billingHandler.destroy()
```

### Step 4: Integrate with Stripe

```typescript
import type { StripeAPIClient } from '@ainative/ai-kit-a2ui-core/integrations'

// Implement Stripe API client (can use official Stripe SDK)
const stripeApiClient: StripeAPIClient = {
  createCustomer: async (params) => {
    const customer = await stripe.customers.create(params)
    return { data: customer }
  },

  createPaymentMethod: async (params) => {
    const pm = await stripe.paymentMethods.create(params)
    return { data: pm }
  },

  createSubscription: async (params) => {
    const subscription = await stripe.subscriptions.create(params)
    return { data: subscription }
  },

  // ... implement other methods
}

const stripeIntegration = new StripeIntegration(config, stripeApiClient)

// Create payment intent
const paymentIntent = await stripeIntegration.createPaymentIntent(
  2999, // $29.99
  'usd',
  'cus_1234567890'
)

// Confirm payment
const success = await stripeIntegration.confirmPayment(
  paymentIntent.id,
  'pm_card_visa'
)

// Manage subscriptions
const subscription = await stripeIntegration.createSubscription(
  'cus_1234567890',
  'price_pro_monthly',
  1
)

await stripeIntegration.updateSubscription(
  subscription.id,
  'price_enterprise_annual'
)

await stripeIntegration.cancelSubscription(subscription.id, false)
```

## Examples

### Complete Billing Flow

```typescript
// 1. User selects a plan
await billingHandler.handleSelectPlan({
  type: 'subscriptionSelectPlan',
  componentId: 'plans',
  planId: 'pro-monthly',
  interval: 'month'
})
// Response: subscriptionUpdated message

// 2. User adds payment method
const paymentMethodId = await billingHandler.handleAddPaymentMethod({
  type: 'paymentMethodAdd',
  componentId: 'payment',
  method: {
    type: 'card',
    card: {
      cardNumber: '4242424242424242',
      expiryMonth: 12,
      expiryYear: 2025,
      cvc: '123'
    }
  },
  setAsDefault: true
})
// Response: paymentMethodAdded message

// 3. View billing history
const invoiceList = await billingHandler.handleInvoiceListRequest({
  type: 'invoiceListRequest',
  componentId: 'history',
  filters: { status: 'paid' },
  limit: 10,
  offset: 0
})
// Response: invoiceListResponse with invoices

// 4. Track usage
await billingHandler.handleUsageRequest({
  type: 'usageRequest',
  componentId: 'usage'
})
// Response: usageUpdate with metrics
```

### Usage-Based Billing

```typescript
// Report usage to Stripe
await stripeIntegration.reportUsage(
  'si_1234567890', // Subscription item ID
  100, // Quantity (e.g., 100 API calls)
  new Date()
)

// Subscribe to usage warnings
billingHandler.subscribeToUsage('usage-1', (metrics) => {
  metrics.forEach(metric => {
    if (metric.percentage > 80) {
      console.warn(`Warning: ${metric.name} at ${metric.percentage}%`)

      // Show warning to user
      showNotification({
        type: 'warning',
        title: 'Usage Alert',
        message: `You've used ${metric.percentage}% of your ${metric.displayName}`
      })
    }

    if (metric.percentage >= 100) {
      console.error(`Limit exceeded: ${metric.name}`)

      // Block further usage or prompt upgrade
      showUpgradeDialog()
    }
  })
})
```

### Multi-Currency Support

```typescript
const plans: SubscriptionPlan[] = [
  {
    id: 'pro-usd',
    name: 'Professional',
    price: 2999,
    currency: 'usd',
    interval: 'month',
    features: ['All features']
  },
  {
    id: 'pro-eur',
    name: 'Professional',
    price: 2799,
    currency: 'eur',
    interval: 'month',
    features: ['All features']
  },
  {
    id: 'pro-gbp',
    name: 'Professional',
    price: 2499,
    currency: 'gbp',
    interval: 'month',
    features: ['All features']
  }
]

// Detect user's currency
const userCurrency = getUserCurrency() // 'usd', 'eur', 'gbp', etc.

// Filter plans by currency
const availablePlans = plans.filter(plan => plan.currency === userCurrency)
```

## Security Considerations

### PCI Compliance

1. **Never store raw card numbers** - Always tokenize with Stripe
2. **Use HTTPS** - All payment data must be transmitted over TLS
3. **Implement CSP** - Content Security Policy headers
4. **Validate server-side** - Never trust client-side validation

```typescript
// ✅ GOOD - Tokenize card data
const paymentMethod = await stripe.paymentMethods.create({
  type: 'card',
  card: {
    token: 'tok_visa' // Token from Stripe Elements
  }
})

// ❌ BAD - Never send raw card data to your server
fetch('/api/payment', {
  method: 'POST',
  body: JSON.stringify({
    cardNumber: '4242424242424242', // NEVER DO THIS
    cvc: '123'
  })
})
```

### Authentication & Authorization

```typescript
// Verify user owns the subscription
const subscription = await billingService.getSubscription(userId)
if (subscription.subscriptionId !== requestedSubscriptionId) {
  throw new Error('Unauthorized')
}

// Check permissions for billing operations
if (!user.permissions.includes('billing:write')) {
  throw new Error('Insufficient permissions')
}
```

### Input Validation

```typescript
// Validate plan ID exists
const validPlans = ['starter', 'pro', 'enterprise']
if (!validPlans.includes(planId)) {
  throw new Error('Invalid plan')
}

// Validate amounts
if (amount < 0 || amount > 99999999) { // Max $999,999.99
  throw new Error('Invalid amount')
}

// Sanitize user input
const sanitizedFeedback = sanitizeHtml(feedback)
```

## Best Practices

### 1. Error Handling

```typescript
try {
  await billingHandler.handleSelectPlan(message)
} catch (error) {
  if (error.code === 'card_declined') {
    showError('Your card was declined. Please try a different payment method.')
  } else if (error.code === 'insufficient_funds') {
    showError('Insufficient funds. Please use a different card.')
  } else {
    showError('Payment failed. Please try again or contact support.')
    logError(error) // Log for debugging
  }
}
```

### 2. Optimistic UI Updates

```typescript
// Update UI immediately
updateUI({ status: 'loading' })

try {
  await billingHandler.handleSelectPlan(message)
  updateUI({ status: 'success', plan: 'pro' })
} catch (error) {
  updateUI({ status: 'error', error: error.message })
  // Revert to previous state
}
```

### 3. Proration Handling

```typescript
// Calculate proration preview
const prorationAmount = await calculateProration(
  currentPlan,
  newPlan,
  billingCycleEnd
)

// Show preview to user
showDialog({
  title: 'Confirm Plan Change',
  message: `
    You'll be charged $${prorationAmount} today for the remainder of your billing period.
    Your next bill will be $${newPlan.price} on ${billingCycleEnd}.
  `,
  onConfirm: async () => {
    await billingHandler.handleChangePlan({
      type: 'subscriptionChangePlan',
      componentId: 'plans',
      newPlanId: newPlan.id,
      prorationBehavior: 'create_prorations'
    })
  }
})
```

### 4. Subscription Lifecycle

```typescript
// Handle subscription events
billingHandler.subscribeToSubscriptionUpdates((subscription) => {
  switch (subscription.status) {
    case 'active':
      // Enable features
      enableFeatures(subscription.planId)
      break

    case 'past_due':
      // Show payment warning
      showPaymentWarning()
      break

    case 'canceled':
      // Disable features, show reactivation option
      disableFeatures()
      showReactivationOption()
      break

    case 'unpaid':
      // Block access, require payment
      blockAccess()
      showPaymentRequired()
      break
  }
})
```

### 5. Usage Tracking

```typescript
// Track usage with batching
class UsageTracker {
  private queue: Map<string, number> = new Map()

  track(metric: string, quantity: number) {
    const current = this.queue.get(metric) || 0
    this.queue.set(metric, current + quantity)
  }

  async flush() {
    for (const [metric, quantity] of this.queue) {
      await billingService.recordUsage(userId, metric, quantity)
    }
    this.queue.clear()
  }
}

const tracker = new UsageTracker()

// Flush every 5 minutes
setInterval(() => tracker.flush(), 5 * 60 * 1000)

// Track API calls
tracker.track('api_calls', 1)
```

### 6. Testing

```typescript
// Mock billing service for tests
const mockBillingService: BillingService = {
  createSubscription: vi.fn().mockResolvedValue({
    subscriptionId: 'sub_test',
    customerId: 'cus_test'
  }),
  // ... mock other methods
}

// Test with mock
const handler = new BillingHandler({
  userId: 'test_user',
  billingService: mockBillingService
})

await handler.handleSelectPlan(message)

expect(mockBillingService.createSubscription).toHaveBeenCalledWith(
  'test_user',
  'pro-monthly',
  'month'
)
```

## Troubleshooting

### Common Issues

1. **Payment Declined**: Check card details, try different card
2. **Subscription Not Found**: Verify user has active subscription
3. **Invoice Not Available**: Check invoice status and generation time
4. **Usage Not Updating**: Verify auto-refresh is enabled, check network

### Debug Mode

```typescript
const billingHandler = new BillingHandler({
  // ... options
  onMessage: (message) => {
    console.log('[Billing] Outgoing:', message)
  },
  onError: (error) => {
    console.error('[Billing] Error:', error)
  }
})

// Enable Stripe debug logs
stripe.setApiVersion('2024-01-01')
stripe.setAppInfo({
  name: 'YourApp',
  version: '1.0.0'
})
```

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [PCI Compliance Guide](https://stripe.com/docs/security)
- [AINative Billing Service](https://ainative.studio/docs/billing)
- [A2UI Protocol Specification](../protocol/README.md)

---

**Version**: 1.0.0
**Last Updated**: 2024-02-10
**Status**: Production Ready
