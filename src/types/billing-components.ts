/**
 * A2UI v0.9 Billing & Subscription Component Type Definitions
 *
 * Comprehensive billing and subscription management components
 * for integration with AINative billing service and Stripe.
 */

/**
 * Plan information for subscription selection
 */
export interface SubscriptionPlan {
  /** Unique plan identifier */
  id: string
  /** Plan display name */
  name: string
  /** Plan description */
  description: string
  /** Price amount (in smallest currency unit, e.g., cents) */
  price: number
  /** Currency code (ISO 4217) */
  currency: string
  /** Billing interval */
  interval: 'month' | 'year'
  /** List of plan features */
  features: string[]
  /** Highlight this plan visually */
  highlighted?: boolean
  /** Mark as most popular plan */
  mostPopular?: boolean
  /** Custom plan requiring contact */
  custom?: boolean
}

/**
 * Subscription Plan Selection Component
 *
 * Displays available subscription plans with comparison features
 * and allows users to select/change their plan.
 */
export interface SubscriptionPlanComponent {
  type: 'subscriptionPlan'
  id: string
  properties: {
    /** Available subscription plans */
    plans: SubscriptionPlan[]
    /** Currently active plan ID */
    currentPlan?: string
    /** Show plan comparison table */
    showComparison?: boolean
    /** Show annual discount banner */
    showAnnualDiscount?: boolean
    /** Annual discount percentage */
    annualDiscountPercent?: number
    /** Allow custom/enterprise plan requests */
    allowCustomPlan?: boolean
    /** Custom plan CTA text */
    customPlanCtaText?: string
    /** Additional metadata */
    metadata?: Record<string, unknown>
  }
}

/**
 * Invoice/Transaction item for billing history
 */
export interface BillingHistoryItem {
  /** Transaction ID */
  id: string
  /** Transaction date */
  date: Date
  /** Transaction description */
  description: string
  /** Amount (in smallest currency unit) */
  amount: number
  /** Currency code (ISO 4217) */
  currency: string
  /** Transaction status */
  status: 'paid' | 'pending' | 'failed' | 'refunded' | 'void'
  /** Invoice/receipt URL */
  invoiceUrl?: string
  /** PDF download URL */
  pdfUrl?: string
}

/**
 * Billing History Component
 *
 * Displays transaction history with filtering and pagination.
 */
export interface BillingHistoryComponent {
  type: 'billingHistory'
  id: string
  properties: {
    /** Show filter controls */
    showFilters?: boolean
    /** Default date range filter */
    dateRange?: {
      start: Date
      end: Date
    }
    /** Items per page for pagination */
    itemsPerPage?: number
    /** Show download invoice button */
    showDownloadInvoice?: boolean
    /** Show receipt button */
    showReceipt?: boolean
    /** Visible columns */
    columns?: Array<'date' | 'description' | 'amount' | 'status' | 'invoice'>
    /** Group transactions by time period */
    groupBy?: 'month' | 'year' | 'none'
    /** Additional metadata */
    metadata?: Record<string, unknown>
  }
}

/**
 * Payment method types supported
 */
export type PaymentMethodType = 'card' | 'bank' | 'paypal' | 'crypto'

/**
 * Stored payment method information
 */
export interface PaymentMethodInfo {
  /** Payment method ID */
  id: string
  /** Payment method type */
  type: PaymentMethodType
  /** Card brand (for cards) */
  brand?: string
  /** Last 4 digits */
  last4?: string
  /** Expiry month (1-12) */
  expiryMonth?: number
  /** Expiry year */
  expiryYear?: number
  /** Bank name (for bank accounts) */
  bankName?: string
  /** Is default payment method */
  isDefault?: boolean
  /** Creation date */
  createdAt?: Date
}

/**
 * Payment Method Management Component
 *
 * Allows users to manage their payment methods (add, edit, delete, set default).
 */
export interface PaymentMethodComponent {
  type: 'paymentMethod'
  id: string
  properties: {
    /** Allowed payment method types */
    methods: PaymentMethodType[]
    /** Allow multiple payment methods */
    allowMultiple?: boolean
    /** Show default payment method indicator */
    showDefault?: boolean
    /** Allow setting default payment method */
    allowSetDefault?: boolean
    /** Allow deleting payment methods */
    allowDelete?: boolean
    /** Show "Add new payment method" button */
    showAddNew?: boolean
    /** Additional metadata */
    metadata?: Record<string, unknown>
  }
}

/**
 * Usage metric for tracking consumption
 */
export interface UsageMetric {
  /** Metric name/identifier */
  name: string
  /** Display name for UI */
  displayName?: string
  /** Current usage value */
  current: number
  /** Usage limit/quota */
  limit: number
  /** Unit of measurement */
  unit: string
  /** Usage reset date */
  resetDate?: Date
  /** Warning threshold (percentage) */
  warningThreshold?: number
  /** Usage percentage (calculated) */
  percentage?: number
}

/**
 * Usage Meter Component
 *
 * Displays usage metrics and consumption tracking.
 */
export interface UsageMeterComponent {
  type: 'usageMeter'
  id: string
  properties: {
    /** Usage metrics to display */
    metrics: UsageMetric[]
    /** Show percentage indicator */
    showPercentage?: boolean
    /** Show warning when approaching limit */
    showWarnings?: boolean
    /** Warning threshold percentage (0-100) */
    warningThreshold?: number
    /** Layout style */
    layout?: 'list' | 'grid' | 'cards'
    /** Auto-refresh interval in seconds */
    refreshInterval?: number
    /** Additional metadata */
    metadata?: Record<string, unknown>
  }
}

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  /** Line item description */
  description: string
  /** Quantity */
  quantity: number
  /** Unit price */
  unitPrice: number
  /** Line total */
  amount: number
}

/**
 * Invoice data structure
 */
export interface InvoiceData {
  /** Invoice ID */
  id: string
  /** Invoice number */
  number: string
  /** Invoice date */
  date: Date
  /** Due date */
  dueDate?: Date
  /** Status */
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  /** Line items */
  lineItems: InvoiceLineItem[]
  /** Subtotal */
  subtotal: number
  /** Tax amount */
  tax?: number
  /** Total amount */
  total: number
  /** Currency code */
  currency: string
  /** Customer information */
  customer?: {
    name: string
    email: string
    address?: string
  }
  /** Company information */
  company?: {
    name: string
    address: string
    taxId?: string
  }
  /** Payment information */
  payment?: {
    method: string
    last4?: string
    paidAt?: Date
  }
  /** PDF URL */
  pdfUrl?: string
  /** Notes */
  notes?: string
}

/**
 * Invoice Viewer Component
 *
 * Displays detailed invoice information with download and payment options.
 */
export interface InvoiceViewerComponent {
  type: 'invoiceViewer'
  id: string
  properties: {
    /** Invoice ID to display */
    invoiceId: string
    /** Show download PDF button */
    showDownload?: boolean
    /** Show print button */
    showPrint?: boolean
    /** Show "Pay Now" button for unpaid invoices */
    showPayNow?: boolean
    /** Display format */
    format?: 'embedded' | 'modal' | 'new-tab'
    /** Additional metadata */
    metadata?: Record<string, unknown>
  }
}

/**
 * Billing address information
 */
export interface BillingAddress {
  /** Full name */
  name: string
  /** Company name */
  company?: string
  /** Address line 1 */
  addressLine1: string
  /** Address line 2 */
  addressLine2?: string
  /** City */
  city: string
  /** State/Province */
  state: string
  /** Postal/ZIP code */
  zip: string
  /** Country code (ISO 3166-1 alpha-2) */
  country: string
  /** Phone number */
  phone?: string
  /** Tax ID (VAT, EIN, etc.) */
  taxId?: string
}

/**
 * Billing address form field
 */
export type BillingAddressField =
  | 'name'
  | 'company'
  | 'addressLine1'
  | 'addressLine2'
  | 'city'
  | 'state'
  | 'zip'
  | 'country'
  | 'phone'
  | 'taxId'

/**
 * Billing Address Component
 *
 * Form for managing billing address information.
 */
export interface BillingAddressComponent {
  type: 'billingAddress'
  id: string
  properties: {
    /** Required fields */
    requiredFields: BillingAddressField[]
    /** Optional fields to display */
    optionalFields?: BillingAddressField[]
    /** Validate tax ID format */
    validateTaxId?: boolean
    /** Enable address autocomplete/suggestions */
    suggestAddress?: boolean
    /** Current billing address */
    currentAddress?: BillingAddress
    /** Additional metadata */
    metadata?: Record<string, unknown>
  }
}

/**
 * Union type of all billing components
 */
export type BillingComponent =
  | SubscriptionPlanComponent
  | BillingHistoryComponent
  | PaymentMethodComponent
  | UsageMeterComponent
  | InvoiceViewerComponent
  | BillingAddressComponent

/**
 * Type guard for subscription plan component
 */
export function isSubscriptionPlanComponent(
  component: { type: string }
): component is SubscriptionPlanComponent {
  return component.type === 'subscriptionPlan'
}

/**
 * Type guard for billing history component
 */
export function isBillingHistoryComponent(
  component: { type: string }
): component is BillingHistoryComponent {
  return component.type === 'billingHistory'
}

/**
 * Type guard for payment method component
 */
export function isPaymentMethodComponent(
  component: { type: string }
): component is PaymentMethodComponent {
  return component.type === 'paymentMethod'
}

/**
 * Type guard for usage meter component
 */
export function isUsageMeterComponent(
  component: { type: string }
): component is UsageMeterComponent {
  return component.type === 'usageMeter'
}

/**
 * Type guard for invoice viewer component
 */
export function isInvoiceViewerComponent(
  component: { type: string }
): component is InvoiceViewerComponent {
  return component.type === 'invoiceViewer'
}

/**
 * Type guard for billing address component
 */
export function isBillingAddressComponent(
  component: { type: string }
): component is BillingAddressComponent {
  return component.type === 'billingAddress'
}
