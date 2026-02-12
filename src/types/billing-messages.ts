/**
 * A2UI v0.9 Billing & Subscription Message Type Definitions
 *
 * Message types for billing operations including subscriptions,
 * payment methods, invoices, and usage tracking.
 */

import type { BillingAddress, PaymentMethodType } from './billing-components.js'

/**
 * Base billing message structure
 */
export interface BaseBillingMessage {
  /** Message type */
  type: string
  /** Component ID that triggered the message */
  componentId: string
  /** Timestamp */
  timestamp?: number
  /** Optional message ID for tracking */
  id?: string
}

// ============================================================================
// Subscription Messages
// ============================================================================

/**
 * Select Plan Message (UI → Agent)
 *
 * User selects an initial subscription plan.
 */
export interface SubscriptionSelectPlanMessage extends BaseBillingMessage {
  type: 'subscriptionSelectPlan'
  /** Selected plan ID */
  planId: string
  /** Billing interval */
  interval: 'month' | 'year'
  /** Optional coupon code */
  couponCode?: string
}

/**
 * Change Plan Message (UI → Agent)
 *
 * User changes their current subscription plan.
 */
export interface SubscriptionChangePlanMessage extends BaseBillingMessage {
  type: 'subscriptionChangePlan'
  /** Current subscription ID */
  subscriptionId?: string
  /** New plan ID */
  newPlanId: string
  /** New billing interval (optional) */
  interval?: 'month' | 'year'
  /** Proration behavior */
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'
}

/**
 * Cancel Subscription Message (UI → Agent)
 *
 * User requests to cancel their subscription.
 */
export interface SubscriptionCancelMessage extends BaseBillingMessage {
  type: 'subscriptionCancel'
  /** Subscription ID to cancel */
  subscriptionId?: string
  /** Cancellation reason */
  reason?: string
  /** User feedback */
  feedback?: string
  /** Cancel immediately vs. at period end */
  immediately?: boolean
}

/**
 * Resume Subscription Message (UI → Agent)
 *
 * User resumes a canceled subscription.
 */
export interface SubscriptionResumeMessage extends BaseBillingMessage {
  type: 'subscriptionResume'
  /** Subscription ID to resume */
  subscriptionId?: string
}

/**
 * Subscription Updated Message (Agent → UI)
 *
 * Notification that subscription was updated.
 */
export interface SubscriptionUpdatedMessage extends BaseBillingMessage {
  type: 'subscriptionUpdated'
  /** Subscription ID */
  subscriptionId: string
  /** New status */
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'
  /** Current plan */
  currentPlan: {
    id: string
    name: string
    interval: 'month' | 'year'
  }
  /** Next billing date */
  nextBillingDate?: Date
  /** Cancellation scheduled */
  cancelAt?: Date
}

// ============================================================================
// Payment Method Messages
// ============================================================================

/**
 * Card payment method details
 */
export interface CardPaymentDetails {
  /** Card number (tokenized or last 4 for display) */
  cardNumber?: string
  /** Expiry month (1-12) */
  expiryMonth?: number
  /** Expiry year */
  expiryYear?: number
  /** CVC/CVV */
  cvc?: string
  /** Cardholder name */
  cardholderName?: string
}

/**
 * Bank account payment details
 */
export interface BankPaymentDetails {
  /** Bank account number */
  bankAccount?: string
  /** Bank routing number */
  bankRouting?: string
  /** Account holder name */
  accountHolderName?: string
  /** Account type */
  accountType?: 'checking' | 'savings'
}

/**
 * PayPal payment details
 */
export interface PayPalPaymentDetails {
  /** PayPal account email */
  paypalEmail?: string
}

/**
 * Add Payment Method Message (UI → Agent)
 *
 * User adds a new payment method.
 */
export interface PaymentMethodAddMessage extends BaseBillingMessage {
  type: 'paymentMethodAdd'
  /** Payment method type */
  method: {
    type: PaymentMethodType
    /** Card details (if type is 'card') */
    card?: CardPaymentDetails
    /** Bank details (if type is 'bank') */
    bank?: BankPaymentDetails
    /** PayPal details (if type is 'paypal') */
    paypal?: PayPalPaymentDetails
  }
  /** Set as default payment method */
  setAsDefault?: boolean
  /** Billing address for this payment method */
  billingAddress?: BillingAddress
}

/**
 * Update Payment Method Message (UI → Agent)
 *
 * User updates an existing payment method.
 */
export interface PaymentMethodUpdateMessage extends BaseBillingMessage {
  type: 'paymentMethodUpdate'
  /** Payment method ID to update */
  methodId: string
  /** Updated information */
  updates: {
    /** Updated expiry month */
    expiryMonth?: number
    /** Updated expiry year */
    expiryYear?: number
    /** Updated billing address */
    billingAddress?: BillingAddress
  }
}

/**
 * Delete Payment Method Message (UI → Agent)
 *
 * User deletes a payment method.
 */
export interface PaymentMethodDeleteMessage extends BaseBillingMessage {
  type: 'paymentMethodDelete'
  /** Payment method ID to delete */
  methodId: string
}

/**
 * Set Default Payment Method Message (UI → Agent)
 *
 * User sets a payment method as default.
 */
export interface PaymentMethodSetDefaultMessage extends BaseBillingMessage {
  type: 'paymentMethodSetDefault'
  /** Payment method ID to set as default */
  methodId: string
}

/**
 * Payment Method Added Message (Agent → UI)
 *
 * Confirmation that payment method was added.
 */
export interface PaymentMethodAddedMessage extends BaseBillingMessage {
  type: 'paymentMethodAdded'
  /** New payment method ID */
  methodId: string
  /** Payment method type */
  methodType: PaymentMethodType
  /** Last 4 digits */
  last4?: string
  /** Is default */
  isDefault: boolean
}

/**
 * Payment Method Error Message (Agent → UI)
 *
 * Error occurred with payment method operation.
 */
export interface PaymentMethodErrorMessage extends BaseBillingMessage {
  type: 'paymentMethodError'
  /** Error code */
  code: string
  /** Error message */
  message: string
  /** Payment method ID (if applicable) */
  methodId?: string
}

// ============================================================================
// Invoice Messages
// ============================================================================

/**
 * Invoice filters for list requests
 */
export interface InvoiceFilters {
  /** Filter by date range (from) */
  dateFrom?: Date
  /** Filter by date range (to) */
  dateTo?: Date
  /** Filter by status */
  status?: 'paid' | 'unpaid' | 'void' | 'draft' | 'open' | 'uncollectible'
  /** Filter by minimum amount */
  minAmount?: number
  /** Filter by maximum amount */
  maxAmount?: number
}

/**
 * Invoice summary for list responses
 */
export interface InvoiceSummary {
  /** Invoice ID */
  id: string
  /** Invoice number */
  number: string
  /** Invoice date */
  date: Date
  /** Due date */
  dueDate?: Date
  /** Amount */
  amount: number
  /** Currency */
  currency: string
  /** Status */
  status: 'paid' | 'unpaid' | 'void' | 'draft' | 'open' | 'uncollectible'
  /** PDF URL */
  pdfUrl?: string
  /** Receipt URL */
  receiptUrl?: string
}

/**
 * Invoice List Request Message (UI → Agent)
 *
 * Request list of invoices with optional filters.
 */
export interface InvoiceListRequestMessage extends BaseBillingMessage {
  type: 'invoiceListRequest'
  /** Optional filters */
  filters?: InvoiceFilters
  /** Pagination limit */
  limit?: number
  /** Pagination offset */
  offset?: number
  /** Sort order */
  sortBy?: 'date' | 'amount' | 'status'
  /** Sort direction */
  sortDirection?: 'asc' | 'desc'
}

/**
 * Invoice List Response Message (Agent → UI)
 *
 * Response with list of invoices.
 */
export interface InvoiceListResponseMessage extends BaseBillingMessage {
  type: 'invoiceListResponse'
  /** List of invoices */
  invoices: InvoiceSummary[]
  /** Total number of invoices (for pagination) */
  total: number
  /** Current offset */
  offset: number
  /** Current limit */
  limit: number
  /** Has more results */
  hasMore: boolean
}

/**
 * Invoice Download Message (UI → Agent)
 *
 * Request to download invoice PDF.
 */
export interface InvoiceDownloadMessage extends BaseBillingMessage {
  type: 'invoiceDownload'
  /** Invoice ID to download */
  invoiceId: string
  /** Download format */
  format?: 'pdf' | 'csv' | 'json'
}

/**
 * Invoice Downloaded Message (Agent → UI)
 *
 * Response with invoice download URL.
 */
export interface InvoiceDownloadedMessage extends BaseBillingMessage {
  type: 'invoiceDownloaded'
  /** Invoice ID */
  invoiceId: string
  /** Download URL (pre-signed) */
  downloadUrl: string
  /** URL expiration time */
  expiresAt: Date
}

/**
 * Invoice Pay Message (UI → Agent)
 *
 * User pays an outstanding invoice.
 */
export interface InvoicePayMessage extends BaseBillingMessage {
  type: 'invoicePay'
  /** Invoice ID to pay */
  invoiceId: string
  /** Payment method ID to use */
  paymentMethodId?: string
}

/**
 * Invoice Paid Message (Agent → UI)
 *
 * Confirmation that invoice was paid.
 */
export interface InvoicePaidMessage extends BaseBillingMessage {
  type: 'invoicePaid'
  /** Invoice ID */
  invoiceId: string
  /** Amount paid */
  amount: number
  /** Currency */
  currency: string
  /** Payment date */
  paidAt: Date
  /** Receipt URL */
  receiptUrl?: string
}

/**
 * Invoice Created Message (Agent → UI)
 *
 * Notification that new invoice was created.
 */
export interface InvoiceCreatedMessage extends BaseBillingMessage {
  type: 'invoiceCreated'
  /** Invoice ID */
  invoiceId: string
  /** Invoice number */
  invoiceNumber: string
  /** Amount */
  amount: number
  /** Currency */
  currency: string
  /** Due date */
  dueDate?: Date
  /** Invoice URL */
  invoiceUrl?: string
}

// ============================================================================
// Usage Tracking Messages
// ============================================================================

/**
 * Usage metric data
 */
export interface UsageMetricData {
  /** Metric name */
  name: string
  /** Current usage */
  current: number
  /** Usage limit */
  limit: number
  /** Unit */
  unit: string
  /** Reset date */
  resetDate?: Date
  /** Percentage used */
  percentage?: number
}

/**
 * Usage Update Message (Agent → UI)
 *
 * Updates current usage metrics.
 */
export interface UsageUpdateMessage extends BaseBillingMessage {
  type: 'usageUpdate'
  /** Updated metrics */
  metrics: UsageMetricData[]
  /** Update timestamp */
  updatedAt: Date
}

/**
 * Usage Request Message (UI → Agent)
 *
 * Request current usage data.
 */
export interface UsageRequestMessage extends BaseBillingMessage {
  type: 'usageRequest'
  /** Optional specific metric names to fetch */
  metrics?: string[]
}

/**
 * Usage Warning Message (Agent → UI)
 *
 * Warning that usage is approaching or exceeded limit.
 */
export interface UsageWarningMessage extends BaseBillingMessage {
  type: 'usageWarning'
  /** Metric name */
  metricName: string
  /** Current usage */
  current: number
  /** Limit */
  limit: number
  /** Percentage used */
  percentage: number
  /** Warning level */
  level: 'warning' | 'critical' | 'exceeded'
}

// ============================================================================
// Billing Address Messages
// ============================================================================

/**
 * Billing Address Update Message (UI → Agent)
 *
 * User updates billing address.
 */
export interface BillingAddressUpdateMessage extends BaseBillingMessage {
  type: 'billingAddressUpdate'
  /** Updated billing address */
  address: BillingAddress
}

/**
 * Billing Address Updated Message (Agent → UI)
 *
 * Confirmation that billing address was updated.
 */
export interface BillingAddressUpdatedMessage extends BaseBillingMessage {
  type: 'billingAddressUpdated'
  /** Updated address */
  address: BillingAddress
}

/**
 * Billing Address Validation Message (Agent → UI)
 *
 * Address validation results.
 */
export interface BillingAddressValidationMessage extends BaseBillingMessage {
  type: 'billingAddressValidation'
  /** Is valid */
  valid: boolean
  /** Validation errors */
  errors?: Record<string, string>
  /** Suggested corrections */
  suggestions?: BillingAddress[]
}

// ============================================================================
// Payment Processing Messages
// ============================================================================

/**
 * Payment Intent Created Message (Agent → UI)
 *
 * Payment intent created, ready for confirmation.
 */
export interface PaymentIntentCreatedMessage extends BaseBillingMessage {
  type: 'paymentIntentCreated'
  /** Payment intent ID */
  paymentIntentId: string
  /** Client secret for confirmation */
  clientSecret: string
  /** Amount */
  amount: number
  /** Currency */
  currency: string
}

/**
 * Payment Processing Message (Agent → UI)
 *
 * Payment is being processed.
 */
export interface PaymentProcessingMessage extends BaseBillingMessage {
  type: 'paymentProcessing'
  /** Payment ID */
  paymentId: string
  /** Status */
  status: 'processing' | 'requires_action' | 'requires_confirmation'
}

/**
 * Payment Success Message (Agent → UI)
 *
 * Payment succeeded.
 */
export interface PaymentSuccessMessage extends BaseBillingMessage {
  type: 'paymentSuccess'
  /** Payment ID */
  paymentId: string
  /** Amount paid */
  amount: number
  /** Currency */
  currency: string
  /** Receipt URL */
  receiptUrl?: string
}

/**
 * Payment Failed Message (Agent → UI)
 *
 * Payment failed.
 */
export interface PaymentFailedMessage extends BaseBillingMessage {
  type: 'paymentFailed'
  /** Payment ID */
  paymentId: string
  /** Error code */
  errorCode: string
  /** Error message */
  errorMessage: string
  /** Decline reason */
  declineCode?: string
}

// ============================================================================
// Union Types
// ============================================================================

/**
 * All subscription-related messages
 */
export type SubscriptionMessage =
  | SubscriptionSelectPlanMessage
  | SubscriptionChangePlanMessage
  | SubscriptionCancelMessage
  | SubscriptionResumeMessage
  | SubscriptionUpdatedMessage

/**
 * All payment method-related messages
 */
export type PaymentMethodMessage =
  | PaymentMethodAddMessage
  | PaymentMethodUpdateMessage
  | PaymentMethodDeleteMessage
  | PaymentMethodSetDefaultMessage
  | PaymentMethodAddedMessage
  | PaymentMethodErrorMessage

/**
 * All invoice-related messages
 */
export type InvoiceMessage =
  | InvoiceListRequestMessage
  | InvoiceListResponseMessage
  | InvoiceDownloadMessage
  | InvoiceDownloadedMessage
  | InvoicePayMessage
  | InvoicePaidMessage
  | InvoiceCreatedMessage

/**
 * All usage tracking messages
 */
export type UsageMessage =
  | UsageUpdateMessage
  | UsageRequestMessage
  | UsageWarningMessage

/**
 * All billing address messages
 */
export type BillingAddressMessage =
  | BillingAddressUpdateMessage
  | BillingAddressUpdatedMessage
  | BillingAddressValidationMessage

/**
 * All payment processing messages
 */
export type PaymentMessage =
  | PaymentIntentCreatedMessage
  | PaymentProcessingMessage
  | PaymentSuccessMessage
  | PaymentFailedMessage

/**
 * Union of all billing messages
 */
export type BillingMessage =
  | SubscriptionMessage
  | PaymentMethodMessage
  | InvoiceMessage
  | UsageMessage
  | BillingAddressMessage
  | PaymentMessage

// ============================================================================
// Type Guards
// ============================================================================

export function isSubscriptionSelectPlanMessage(
  msg: BillingMessage
): msg is SubscriptionSelectPlanMessage {
  return msg.type === 'subscriptionSelectPlan'
}

export function isSubscriptionChangePlanMessage(
  msg: BillingMessage
): msg is SubscriptionChangePlanMessage {
  return msg.type === 'subscriptionChangePlan'
}

export function isSubscriptionCancelMessage(
  msg: BillingMessage
): msg is SubscriptionCancelMessage {
  return msg.type === 'subscriptionCancel'
}

export function isPaymentMethodAddMessage(
  msg: BillingMessage
): msg is PaymentMethodAddMessage {
  return msg.type === 'paymentMethodAdd'
}

export function isInvoiceListRequestMessage(
  msg: BillingMessage
): msg is InvoiceListRequestMessage {
  return msg.type === 'invoiceListRequest'
}

export function isInvoicePayMessage(
  msg: BillingMessage
): msg is InvoicePayMessage {
  return msg.type === 'invoicePay'
}

export function isUsageUpdateMessage(
  msg: BillingMessage
): msg is UsageUpdateMessage {
  return msg.type === 'usageUpdate'
}

export function isBillingAddressUpdateMessage(
  msg: BillingMessage
): msg is BillingAddressUpdateMessage {
  return msg.type === 'billingAddressUpdate'
}

export function isPaymentSuccessMessage(
  msg: BillingMessage
): msg is PaymentSuccessMessage {
  return msg.type === 'paymentSuccess'
}

export function isPaymentFailedMessage(
  msg: BillingMessage
): msg is PaymentFailedMessage {
  return msg.type === 'paymentFailed'
}
