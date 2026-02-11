/**
 * Billing Handler
 *
 * Handles all billing-related operations including subscriptions,
 * payment methods, invoices, and usage tracking.
 */

import type {
  SubscriptionSelectPlanMessage,
  SubscriptionChangePlanMessage,
  SubscriptionCancelMessage,
  SubscriptionResumeMessage,
  PaymentMethodAddMessage,
  PaymentMethodUpdateMessage,
  PaymentMethodDeleteMessage,
  PaymentMethodSetDefaultMessage,
  InvoiceListRequestMessage,
  InvoiceListResponseMessage,
  InvoiceDownloadMessage,
  InvoicePayMessage,
  UsageUpdateMessage,
  UsageRequestMessage,
  BillingAddressUpdateMessage,
  PaymentSuccessMessage,
  PaymentFailedMessage,
} from '../types/billing-messages.js'

import type { StripeIntegration } from '../integrations/stripe-integration.js'
import type { UsageMetric, InvoiceData } from '../types/billing-components.js'

/**
 * Billing service interface
 *
 * Implement this interface to integrate with your billing backend
 * (e.g., AINative billing service, custom backend, etc.)
 */
export interface BillingService {
  // Subscription operations
  createSubscription(
    userId: string,
    planId: string,
    interval: 'month' | 'year'
  ): Promise<{ subscriptionId: string; customerId: string }>

  changeSubscription(
    subscriptionId: string,
    planId: string,
    interval?: 'month' | 'year'
  ): Promise<void>

  cancelSubscription(subscriptionId: string, immediately?: boolean): Promise<void>

  resumeSubscription(subscriptionId: string): Promise<void>

  getSubscription(userId: string): Promise<{
    subscriptionId: string
    planId: string
    status: string
    currentPeriodEnd: Date
  } | null>

  // Invoice operations
  getInvoices(
    userId: string,
    filters?: {
      dateFrom?: Date
      dateTo?: Date
      status?: string
      limit?: number
      offset?: number
    }
  ): Promise<{
    invoices: InvoiceData[]
    total: number
  }>

  // Billing address
  updateBillingAddress(userId: string, address: unknown): Promise<void>

  getBillingAddress(userId: string): Promise<unknown>

  // Usage tracking
  getUsageMetrics(userId: string, metricNames?: string[]): Promise<UsageMetric[]>

  recordUsage(userId: string, metricName: string, quantity: number): Promise<void>
}

/**
 * Billing handler options
 */
export interface BillingHandlerOptions {
  /** User ID for the current session */
  userId: string

  /** Billing service implementation */
  billingService: BillingService

  /** Stripe integration (optional) */
  stripeIntegration?: StripeIntegration

  /** Default currency */
  defaultCurrency?: string

  /** Allowed currencies */
  allowedCurrencies?: string[]

  /** Enable tax calculation */
  taxCalculation?: boolean

  /** Usage metrics configuration */
  usageMetrics?: Array<{
    name: string
    unit: string
    displayName: string
    limit?: number
  }>

  /** Message handlers */
  onMessage?: (message: unknown) => void

  /** Error handler */
  onError?: (error: Error) => void
}

/**
 * Usage tracking callback
 */
export type UsageCallback = (usage: UsageMetric[]) => void

/**
 * Billing Handler Class
 *
 * Orchestrates billing operations between UI components,
 * billing service, and Stripe integration.
 */
export class BillingHandler {
  private usageSubscriptions = new Map<string, Set<UsageCallback>>()
  private usageRefreshIntervals = new Map<string, number>()

  constructor(private options: BillingHandlerOptions) {}

  /**
   * Handle subscription plan selection
   */
  async handleSelectPlan(
    message: SubscriptionSelectPlanMessage
  ): Promise<void> {
    try {
      const { planId, interval, couponCode } = message

      // Create subscription via billing service
      const { subscriptionId, customerId } =
        await this.options.billingService.createSubscription(
          this.options.userId,
          planId,
          interval
        )

      // If Stripe integration is available, create Stripe subscription
      if (this.options.stripeIntegration) {
        await this.options.stripeIntegration.createSubscription(
          customerId,
          planId,
          1,
          { couponCode }
        )
      }

      // Notify success
      this.sendMessage({
        type: 'subscriptionUpdated',
        componentId: message.componentId,
        subscriptionId,
        status: 'active',
        currentPlan: {
          id: planId,
          name: planId,
          interval,
        },
      })
    } catch (error) {
      this.handleError(error as Error, message.componentId)
    }
  }

  /**
   * Handle subscription plan change
   */
  async handleChangePlan(
    message: SubscriptionChangePlanMessage
  ): Promise<void> {
    try {
      const { newPlanId, interval, prorationBehavior } = message

      // Get current subscription
      const subscription = await this.options.billingService.getSubscription(
        this.options.userId
      )

      if (!subscription) {
        throw new Error('No active subscription found')
      }

      // Change plan via billing service
      await this.options.billingService.changeSubscription(
        subscription.subscriptionId,
        newPlanId,
        interval
      )

      // Update Stripe subscription if available
      if (this.options.stripeIntegration) {
        await this.options.stripeIntegration.updateSubscription(
          subscription.subscriptionId,
          newPlanId,
          prorationBehavior
        )
      }

      // Notify success
      this.sendMessage({
        type: 'subscriptionUpdated',
        componentId: message.componentId,
        subscriptionId: subscription.subscriptionId,
        status: 'active',
        currentPlan: {
          id: newPlanId,
          name: newPlanId,
          interval: interval || 'month',
        },
      })
    } catch (error) {
      this.handleError(error as Error, message.componentId)
    }
  }

  /**
   * Handle subscription cancellation
   */
  async handleCancelSubscription(
    message: SubscriptionCancelMessage
  ): Promise<void> {
    try {
      const { reason, feedback, immediately } = message

      // Get current subscription
      const subscription = await this.options.billingService.getSubscription(
        this.options.userId
      )

      if (!subscription) {
        throw new Error('No active subscription found')
      }

      // Cancel via billing service
      await this.options.billingService.cancelSubscription(
        subscription.subscriptionId,
        immediately
      )

      // Cancel Stripe subscription if available
      if (this.options.stripeIntegration) {
        await this.options.stripeIntegration.cancelSubscription(
          subscription.subscriptionId,
          immediately
        )
      }

      // Notify success
      this.sendMessage({
        type: 'subscriptionUpdated',
        componentId: message.componentId,
        subscriptionId: subscription.subscriptionId,
        status: 'canceled',
        currentPlan: {
          id: subscription.planId,
          name: subscription.planId,
          interval: 'month',
        },
        cancelAt: immediately ? new Date() : subscription.currentPeriodEnd,
      })
    } catch (error) {
      this.handleError(error as Error, message.componentId)
    }
  }

  /**
   * Handle subscription resumption
   */
  async handleResumeSubscription(
    message: SubscriptionResumeMessage
  ): Promise<void> {
    try {
      // Get current subscription
      const subscription = await this.options.billingService.getSubscription(
        this.options.userId
      )

      if (!subscription) {
        throw new Error('No subscription found')
      }

      // Resume via billing service
      await this.options.billingService.resumeSubscription(
        subscription.subscriptionId
      )

      // Notify success
      this.sendMessage({
        type: 'subscriptionUpdated',
        componentId: message.componentId,
        subscriptionId: subscription.subscriptionId,
        status: 'active',
        currentPlan: {
          id: subscription.planId,
          name: subscription.planId,
          interval: 'month',
        },
      })
    } catch (error) {
      this.handleError(error as Error, message.componentId)
    }
  }

  /**
   * Handle add payment method
   */
  async handleAddPaymentMethod(
    message: PaymentMethodAddMessage
  ): Promise<string> {
    try {
      const { method, setAsDefault, billingAddress } = message

      if (!this.options.stripeIntegration) {
        throw new Error('Stripe integration not configured')
      }

      // Get or create customer
      const subscription = await this.options.billingService.getSubscription(
        this.options.userId
      )

      // For now, assume customerId is available
      // In production, you'd get this from your billing service
      const customerId = (subscription as { customerId?: string })?.customerId || ''

      if (!customerId) {
        throw new Error('Customer ID not found')
      }

      // Note: Actual payment method creation would use Stripe Elements
      // This is a placeholder for the integration flow
      const paymentMethodId = 'pm_placeholder'

      // Attach to customer
      await this.options.stripeIntegration.attachPaymentMethod(
        customerId,
        paymentMethodId
      )

      // Set as default if requested
      if (setAsDefault) {
        await this.options.stripeIntegration.setDefaultPaymentMethod(
          customerId,
          paymentMethodId
        )
      }

      // Update billing address if provided
      if (billingAddress) {
        await this.options.billingService.updateBillingAddress(
          this.options.userId,
          billingAddress
        )
      }

      // Notify success
      this.sendMessage({
        type: 'paymentMethodAdded',
        componentId: message.componentId,
        methodId: paymentMethodId,
        methodType: method.type,
        last4: '4242',
        isDefault: setAsDefault || false,
      })

      return paymentMethodId
    } catch (error) {
      this.handleError(error as Error, message.componentId)
      throw error
    }
  }

  /**
   * Handle update payment method
   */
  async handleUpdatePaymentMethod(
    message: PaymentMethodUpdateMessage
  ): Promise<void> {
    try {
      const { methodId, updates } = message

      // Update billing address if provided
      if (updates.billingAddress) {
        await this.options.billingService.updateBillingAddress(
          this.options.userId,
          updates.billingAddress
        )
      }

      // Note: Stripe payment methods are mostly immutable
      // Only billing address can be updated
    } catch (error) {
      this.handleError(error as Error, message.componentId)
    }
  }

  /**
   * Handle delete payment method
   */
  async handleDeletePaymentMethod(
    message: PaymentMethodDeleteMessage
  ): Promise<void> {
    try {
      const { methodId } = message

      if (!this.options.stripeIntegration) {
        throw new Error('Stripe integration not configured')
      }

      await this.options.stripeIntegration.detachPaymentMethod(methodId)
    } catch (error) {
      this.handleError(error as Error, message.componentId)
    }
  }

  /**
   * Handle set default payment method
   */
  async handleSetDefaultPaymentMethod(
    message: PaymentMethodSetDefaultMessage
  ): Promise<void> {
    try {
      const { methodId } = message

      if (!this.options.stripeIntegration) {
        throw new Error('Stripe integration not configured')
      }

      // Get customer ID
      const subscription = await this.options.billingService.getSubscription(
        this.options.userId
      )
      const customerId = (subscription as { customerId?: string })?.customerId || ''

      if (!customerId) {
        throw new Error('Customer ID not found')
      }

      await this.options.stripeIntegration.setDefaultPaymentMethod(
        customerId,
        methodId
      )
    } catch (error) {
      this.handleError(error as Error, message.componentId)
    }
  }

  /**
   * Handle invoice list request
   */
  async handleInvoiceListRequest(
    message: InvoiceListRequestMessage
  ): Promise<InvoiceListResponseMessage> {
    try {
      const { filters, limit = 10, offset = 0 } = message

      const result = await this.options.billingService.getInvoices(
        this.options.userId,
        {
          ...filters,
          limit,
          offset,
        }
      )

      return {
        type: 'invoiceListResponse',
        componentId: message.componentId,
        invoices: result.invoices.map((inv) => ({
          id: inv.id,
          number: inv.number,
          date: inv.date,
          dueDate: inv.dueDate,
          amount: inv.total,
          currency: inv.currency,
          status: inv.status as 'paid' | 'unpaid' | 'void',
          pdfUrl: inv.pdfUrl,
        })),
        total: result.total,
        offset,
        limit,
        hasMore: offset + result.invoices.length < result.total,
      }
    } catch (error) {
      this.handleError(error as Error, message.componentId)
      throw error
    }
  }

  /**
   * Handle invoice download
   */
  async handleInvoiceDownload(message: InvoiceDownloadMessage): Promise<string> {
    try {
      const { invoiceId } = message

      if (!this.options.stripeIntegration) {
        throw new Error('Stripe integration not configured')
      }

      const pdfUrl = await this.options.stripeIntegration.downloadInvoice(invoiceId)

      this.sendMessage({
        type: 'invoiceDownloaded',
        componentId: message.componentId,
        invoiceId,
        downloadUrl: pdfUrl,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      })

      return pdfUrl
    } catch (error) {
      this.handleError(error as Error, message.componentId)
      throw error
    }
  }

  /**
   * Handle invoice payment
   */
  async handleInvoicePay(message: InvoicePayMessage): Promise<void> {
    try {
      const { invoiceId } = message

      if (!this.options.stripeIntegration) {
        throw new Error('Stripe integration not configured')
      }

      await this.options.stripeIntegration.payInvoice(invoiceId)

      this.sendMessage({
        type: 'invoicePaid',
        componentId: message.componentId,
        invoiceId,
        amount: 0, // Would need to fetch invoice details
        currency: this.options.defaultCurrency || 'usd',
        paidAt: new Date(),
      })
    } catch (error) {
      this.handleError(error as Error, message.componentId)
    }
  }

  /**
   * Handle usage update
   */
  async handleUsageUpdate(message: UsageUpdateMessage): Promise<void> {
    try {
      const { metrics } = message

      // Notify all subscribers for this component
      const callbacks = this.usageSubscriptions.get(message.componentId)
      if (callbacks) {
        callbacks.forEach((callback) => callback(metrics))
      }
    } catch (error) {
      this.handleError(error as Error, message.componentId)
    }
  }

  /**
   * Handle usage request
   */
  async handleUsageRequest(message: UsageRequestMessage): Promise<void> {
    try {
      const { metrics: metricNames } = message

      const metrics = await this.options.billingService.getUsageMetrics(
        this.options.userId,
        metricNames
      )

      this.sendMessage({
        type: 'usageUpdate',
        componentId: message.componentId,
        metrics: metrics.map((m) => ({
          name: m.name,
          current: m.current,
          limit: m.limit,
          unit: m.unit,
          resetDate: m.resetDate,
          percentage: m.limit > 0 ? (m.current / m.limit) * 100 : 0,
        })),
        updatedAt: new Date(),
      })
    } catch (error) {
      this.handleError(error as Error, message.componentId)
    }
  }

  /**
   * Handle billing address update
   */
  async handleBillingAddressUpdate(
    message: BillingAddressUpdateMessage
  ): Promise<void> {
    try {
      const { address } = message

      await this.options.billingService.updateBillingAddress(
        this.options.userId,
        address
      )

      this.sendMessage({
        type: 'billingAddressUpdated',
        componentId: message.componentId,
        address,
      })
    } catch (error) {
      this.handleError(error as Error, message.componentId)
    }
  }

  /**
   * Subscribe to usage updates
   */
  subscribeToUsage(componentId: string, callback: UsageCallback): () => void {
    if (!this.usageSubscriptions.has(componentId)) {
      this.usageSubscriptions.set(componentId, new Set())
    }

    const callbacks = this.usageSubscriptions.get(componentId)!
    callbacks.add(callback)

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.usageSubscriptions.delete(componentId)
        this.stopUsageRefresh(componentId)
      }
    }
  }

  /**
   * Start auto-refresh for usage metrics
   */
  startUsageRefresh(componentId: string, intervalSeconds: number): void {
    // Clear existing interval
    this.stopUsageRefresh(componentId)

    // Set up new interval
    const intervalId = setInterval(async () => {
      try {
        const metrics = await this.options.billingService.getUsageMetrics(
          this.options.userId
        )

        const callbacks = this.usageSubscriptions.get(componentId)
        if (callbacks) {
          callbacks.forEach((callback) => callback(metrics))
        }
      } catch (error) {
        this.handleError(error as Error, componentId)
      }
    }, intervalSeconds * 1000) as unknown as number

    this.usageRefreshIntervals.set(componentId, intervalId)
  }

  /**
   * Stop auto-refresh for usage metrics
   */
  stopUsageRefresh(componentId: string): void {
    const intervalId = this.usageRefreshIntervals.get(componentId)
    if (intervalId) {
      clearInterval(intervalId)
      this.usageRefreshIntervals.delete(componentId)
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Stop all usage refresh intervals
    this.usageRefreshIntervals.forEach((intervalId) => clearInterval(intervalId))
    this.usageRefreshIntervals.clear()

    // Clear all subscriptions
    this.usageSubscriptions.clear()
  }

  /**
   * Send message to UI
   */
  private sendMessage(message: unknown): void {
    if (this.options.onMessage) {
      this.options.onMessage(message)
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: Error, componentId: string): void {
    if (this.options.onError) {
      this.options.onError(error)
    }

    this.sendMessage({
      type: 'paymentMethodError',
      componentId,
      code: 'BILLING_ERROR',
      message: error.message,
    })
  }
}
