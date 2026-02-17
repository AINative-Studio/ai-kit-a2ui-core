/**
 * Stripe Payment Integration
 *
 * Provides zero-dependency Stripe API integration for A2UI billing components.
 * This is a type-safe wrapper that can be used with any Stripe SDK implementation.
 */

import type {
  PaymentMethodInfo,
  InvoiceData,
  UsageMetric,
} from '../types/billing-components.js'

/**
 * Stripe configuration options
 */
export interface StripeConfig {
  /** Stripe publishable key (client-side) */
  publishableKey: string
  /** Stripe secret key (server-side only) */
  secretKey?: string
  /** API version */
  apiVersion?: string
  /** Stripe account ID (for Connect) */
  stripeAccount?: string
}

/**
 * Subscription data from Stripe
 */
export interface StripeSubscription {
  id: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete'
  customerId: string
  items: Array<{
    id: string
    priceId: string
    quantity: number
  }>
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAt?: Date
  canceledAt?: Date
  metadata?: Record<string, string>
}

/**
 * Payment intent data from Stripe
 */
export interface StripePaymentIntent {
  id: string
  clientSecret: string
  amount: number
  currency: string
  status: string
  paymentMethodId?: string
}

/**
 * Stripe customer data
 */
export interface StripeCustomer {
  id: string
  email: string
  name?: string
  defaultPaymentMethodId?: string
  metadata?: Record<string, string>
}

/**
 * Stripe payment method data
 */
export interface StripePaymentMethod {
  id: string
  type: 'card' | 'us_bank_account' | 'sepa_debit'
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  billing_details?: {
    name?: string
    email?: string
    address?: {
      line1?: string
      line2?: string
      city?: string
      state?: string
      postal_code?: string
      country?: string
    }
  }
}

/**
 * Stripe invoice data
 */
export interface StripeInvoice {
  id: string
  number: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  amountDue: number
  amountPaid: number
  currency: string
  created: number
  dueDate?: number
  hostedInvoiceUrl?: string
  invoicePdf?: string
  lines: {
    data: Array<{
      description: string
      quantity: number
      unitAmount: number
      amount: number
    }>
  }
}

/**
 * Stripe API response wrapper
 */
export interface StripeResponse<T> {
  data?: T
  error?: {
    code: string
    message: string
    type: string
  }
}

/**
 * Stripe API client interface
 *
 * This interface can be implemented by any Stripe SDK or custom HTTP client.
 * Zero runtime dependencies - users bring their own Stripe implementation.
 */
export interface StripeAPIClient {
  // Customer operations
  createCustomer(params: {
    email: string
    name?: string
    metadata?: Record<string, string>
  }): Promise<StripeResponse<StripeCustomer>>

  retrieveCustomer(customerId: string): Promise<StripeResponse<StripeCustomer>>

  updateCustomer(
    customerId: string,
    params: Partial<StripeCustomer>
  ): Promise<StripeResponse<StripeCustomer>>

  // Payment method operations
  createPaymentMethod(params: {
    type: string
    card?: unknown
    billing_details?: unknown
  }): Promise<StripeResponse<StripePaymentMethod>>

  attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<StripeResponse<StripePaymentMethod>>

  detachPaymentMethod(
    paymentMethodId: string
  ): Promise<StripeResponse<StripePaymentMethod>>

  listPaymentMethods(
    customerId: string,
    type: string
  ): Promise<StripeResponse<{ data: StripePaymentMethod[] }>>

  updatePaymentMethod(
    paymentMethodId: string,
    params: Partial<StripePaymentMethod>
  ): Promise<StripeResponse<StripePaymentMethod>>

  // Subscription operations
  createSubscription(params: {
    customer: string
    items: Array<{ price: string; quantity?: number }>
    metadata?: Record<string, string>
    trial_period_days?: number
  }): Promise<StripeResponse<StripeSubscription>>

  retrieveSubscription(
    subscriptionId: string
  ): Promise<StripeResponse<StripeSubscription>>

  updateSubscription(
    subscriptionId: string,
    params: {
      items?: Array<{ id?: string; price: string; quantity?: number }>
      proration_behavior?: string
      metadata?: Record<string, string>
    }
  ): Promise<StripeResponse<StripeSubscription>>

  cancelSubscription(
    subscriptionId: string,
    params?: { invoice_now?: boolean }
  ): Promise<StripeResponse<StripeSubscription>>

  // Payment intent operations
  createPaymentIntent(params: {
    amount: number
    currency: string
    customer?: string
    payment_method?: string
    metadata?: Record<string, string>
  }): Promise<StripeResponse<StripePaymentIntent>>

  confirmPaymentIntent(
    paymentIntentId: string,
    params?: { payment_method?: string }
  ): Promise<StripeResponse<StripePaymentIntent>>

  // Invoice operations
  retrieveInvoice(invoiceId: string): Promise<StripeResponse<StripeInvoice>>

  listInvoices(params: {
    customer: string
    limit?: number
    starting_after?: string
  }): Promise<StripeResponse<{ data: StripeInvoice[]; has_more: boolean }>>

  payInvoice(invoiceId: string): Promise<StripeResponse<StripeInvoice>>

  // Usage reporting
  createUsageRecord(
    subscriptionItemId: string,
    params: { quantity: number; timestamp?: number; action?: string }
  ): Promise<StripeResponse<{ id: string }>>
}

/**
 * Stripe Integration Class
 *
 * Provides high-level Stripe operations for A2UI billing components.
 * Designed to work with any Stripe SDK implementation (zero dependencies).
 */
export class StripeIntegration {
  constructor(
    private config: StripeConfig,
    private apiClient: StripeAPIClient
  ) {}

  /**
   * Initialize customer
   */
  async createCustomer(
    email: string,
    name?: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    const response = await this.apiClient.createCustomer({ email, name, metadata })

    if (response.error) {
      throw new Error(`Failed to create customer: ${response.error.message}`)
    }

    if (!response.data) {
      throw new Error('No customer data returned')
    }

    return response.data.id
  }

  /**
   * Get customer information
   */
  async getCustomer(customerId: string): Promise<StripeCustomer> {
    const response = await this.apiClient.retrieveCustomer(customerId)

    if (response.error) {
      throw new Error(`Failed to retrieve customer: ${response.error.message}`)
    }

    if (!response.data) {
      throw new Error('No customer data returned')
    }

    return response.data
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId?: string,
    metadata?: Record<string, string>
  ): Promise<StripePaymentIntent> {
    const response = await this.apiClient.createPaymentIntent({
      amount,
      currency,
      customer: customerId,
      metadata,
    })

    if (response.error) {
      throw new Error(`Failed to create payment intent: ${response.error.message}`)
    }

    if (!response.data) {
      throw new Error('No payment intent data returned')
    }

    return response.data
  }

  /**
   * Confirm payment
   */
  async confirmPayment(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<boolean> {
    const response = await this.apiClient.confirmPaymentIntent(paymentIntentId, {
      payment_method: paymentMethodId,
    })

    if (response.error) {
      throw new Error(`Payment failed: ${response.error.message}`)
    }

    return response.data?.status === 'succeeded'
  }

  /**
   * Create subscription
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    quantity?: number,
    metadata?: Record<string, string>
  ): Promise<StripeSubscription> {
    const response = await this.apiClient.createSubscription({
      customer: customerId,
      items: [{ price: priceId, quantity }],
      metadata,
    })

    if (response.error) {
      throw new Error(`Failed to create subscription: ${response.error.message}`)
    }

    if (!response.data) {
      throw new Error('No subscription data returned')
    }

    return response.data
  }

  /**
   * Update subscription (change plan)
   */
  async updateSubscription(
    subscriptionId: string,
    newPriceId: string,
    prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'
  ): Promise<StripeSubscription> {
    const response = await this.apiClient.updateSubscription(subscriptionId, {
      items: [{ price: newPriceId }],
      proration_behavior: prorationBehavior,
    })

    if (response.error) {
      throw new Error(`Failed to update subscription: ${response.error.message}`)
    }

    if (!response.data) {
      throw new Error('No subscription data returned')
    }

    return response.data
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately?: boolean
  ): Promise<void> {
    const response = await this.apiClient.cancelSubscription(subscriptionId, {
      invoice_now: immediately,
    })

    if (response.error) {
      throw new Error(`Failed to cancel subscription: ${response.error.message}`)
    }
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<void> {
    const response = await this.apiClient.attachPaymentMethod(
      paymentMethodId,
      customerId
    )

    if (response.error) {
      throw new Error(`Failed to attach payment method: ${response.error.message}`)
    }
  }

  /**
   * Detach payment method from customer
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    const response = await this.apiClient.detachPaymentMethod(paymentMethodId)

    if (response.error) {
      throw new Error(`Failed to detach payment method: ${response.error.message}`)
    }
  }

  /**
   * Set default payment method for customer
   */
  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<void> {
    const response = await this.apiClient.updateCustomer(customerId, {
      id: customerId,
      email: '', // Will be preserved
      defaultPaymentMethodId: paymentMethodId,
    })

    if (response.error) {
      throw new Error(
        `Failed to set default payment method: ${response.error.message}`
      )
    }
  }

  /**
   * List customer payment methods
   */
  async listPaymentMethods(
    customerId: string,
    type: string = 'card'
  ): Promise<PaymentMethodInfo[]> {
    const response = await this.apiClient.listPaymentMethods(customerId, type)

    if (response.error) {
      throw new Error(`Failed to list payment methods: ${response.error.message}`)
    }

    if (!response.data?.data) {
      return []
    }

    return response.data.data.map((pm) => ({
      id: pm.id,
      type: pm.type as 'card' | 'bank',
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expiryMonth: pm.card?.expMonth,
      expiryYear: pm.card?.expYear,
      isDefault: false, // Would need to check customer.default_payment_method
    }))
  }

  /**
   * Get invoices for customer
   */
  async getInvoices(
    customerId: string,
    limit?: number
  ): Promise<InvoiceData[]> {
    const response = await this.apiClient.listInvoices({
      customer: customerId,
      limit: limit || 10,
    })

    if (response.error) {
      throw new Error(`Failed to list invoices: ${response.error.message}`)
    }

    if (!response.data?.data) {
      return []
    }

    return response.data.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      date: new Date(invoice.created * 1000),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate * 1000) : undefined,
      status: invoice.status,
      lineItems: invoice.lines.data.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitAmount,
        amount: line.amount,
      })),
      subtotal: invoice.amountDue,
      total: invoice.amountDue,
      currency: invoice.currency,
      pdfUrl: invoice.invoicePdf,
    }))
  }

  /**
   * Download invoice PDF
   */
  async downloadInvoice(invoiceId: string): Promise<string> {
    const response = await this.apiClient.retrieveInvoice(invoiceId)

    if (response.error) {
      throw new Error(`Failed to retrieve invoice: ${response.error.message}`)
    }

    if (!response.data?.invoicePdf) {
      throw new Error('Invoice PDF not available')
    }

    return response.data.invoicePdf
  }

  /**
   * Pay invoice
   */
  async payInvoice(invoiceId: string): Promise<void> {
    const response = await this.apiClient.payInvoice(invoiceId)

    if (response.error) {
      throw new Error(`Failed to pay invoice: ${response.error.message}`)
    }
  }

  /**
   * Report usage for metered billing
   */
  async reportUsage(
    subscriptionItemId: string,
    quantity: number,
    timestamp?: Date
  ): Promise<void> {
    const response = await this.apiClient.createUsageRecord(subscriptionItemId, {
      quantity,
      timestamp: timestamp ? Math.floor(timestamp.getTime() / 1000) : undefined,
      action: 'increment',
    })

    if (response.error) {
      throw new Error(`Failed to report usage: ${response.error.message}`)
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<StripeSubscription> {
    const response = await this.apiClient.retrieveSubscription(subscriptionId)

    if (response.error) {
      throw new Error(`Failed to retrieve subscription: ${response.error.message}`)
    }

    if (!response.data) {
      throw new Error('No subscription data returned')
    }

    return response.data
  }
}

/**
 * Helper function to convert Stripe errors to user-friendly messages
 */
export function formatStripeError(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    card_declined: 'Your card was declined. Please try a different payment method.',
    insufficient_funds: 'Insufficient funds. Please try a different payment method.',
    expired_card: 'Your card has expired. Please update your payment method.',
    incorrect_cvc: 'Incorrect security code. Please check your card details.',
    processing_error:
      'An error occurred while processing your card. Please try again.',
    rate_limit: 'Too many requests. Please try again in a moment.',
    invalid_number: 'Invalid card number. Please check your card details.',
    invalid_expiry_month: 'Invalid expiry month. Please check your card details.',
    invalid_expiry_year: 'Invalid expiry year. Please check your card details.',
  }

  return (
    errorMessages[errorCode] ||
    'An error occurred while processing your payment. Please try again.'
  )
}
