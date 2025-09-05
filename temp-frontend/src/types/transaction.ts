export interface TransactionUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface TransactionPlan {
  id: string;
  name: string;
  price_amount: number;
  currency: string;
}

export interface Address {
  city: string | null;
  country: string | null;
  line1: string | null;
  line2: string | null;
  postal_code: string | null;
  state: string | null;
}

export interface BillingDetails {
  address: Address;
  email: string | null;
  name: string | null;
  phone: string | null;
}

export interface CardDetails {
  brand: string;
  checks: {
    address_line1_check: string | null;
    address_postal_code_check: string | null;
    cvc_check: string | null;
  };
  country: string;
  exp_month: number;
  exp_year: number;
  fingerprint: string;
  funding: string;
  last4: string;
  network: string;
  three_d_secure: unknown; // Structure can vary
  wallet: unknown; // Structure can vary
}

export interface PaymentMethodDetails {
  card?: CardDetails;
  type: string;
}

export interface Outcome {
  network_status: string;
  reason: string | null;
  risk_level?: string;
  risk_score?: number;
  rule?: unknown; // Structure can vary
  seller_message: string;
  type: string;
}

export interface UserInfo {
  id: number;
  email: string;
  firstName?: string; // Corresponds to User model update
  lastName?: string; // Corresponds to User model update
  name?: string; // Keep if used elsewhere, but prefer firstName/lastName
  username?: string; // Keep if used elsewhere
}

export interface Transaction {
  id: string;
  object: string; // Should be 'charge'
  amount: number;
  amount_captured: number;
  amount_refunded: number;
  balance_transaction: string | null;
  billing_details: BillingDetails;
  calculated_statement_descriptor?: string;
  captured: boolean;
  created: number; // Unix timestamp
  currency: string;
  customer: string | null;
  description: string | null;
  disputed: boolean;
  failure_code: string | null;
  failure_message: string | null;
  fraud_details?: object; // Usually an empty object {}
  invoice?: string | null;
  livemode: boolean;
  metadata?: Record<string, unknown>;
  on_behalf_of?: string | null;
  order?: string | null;
  outcome?: Outcome;
  paid: boolean;
  payment_intent: string | null;
  payment_method?: string | null;
  payment_method_details?: PaymentMethodDetails;
  receipt_email?: string | null;
  receipt_number?: string | null;
  receipt_url?: string | null;
  refunded: boolean;
  // refunds -> This is a list object in Stripe, handle separately if needed
  review?: string | null;
  shipping?: unknown; // Structure can vary
  source?: unknown; // Can be various object types
  source_transfer?: string | null;
  statement_descriptor?: string | null;
  statement_descriptor_suffix?: string | null;
  status: "succeeded" | "pending" | "failed";
  transfer_data?: unknown; // Structure can vary
  transfer_group?: string | null;
  user?: UserInfo | null; // Nested user details
}

export interface TransactionPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  has_more: boolean;
}

export interface TransactionResponse {
  data: Transaction[];
  pagination: TransactionPagination;
}

export interface SingleTransactionResponse {
  data: Transaction;
}

export interface TransactionStatsResponse {
  data: {
    totalRevenue: number;
    statusCounts: Record<string, number>;
    currencyBreakdown: Record<string, number>;
  };
}
