export interface SubscriptionData {
  id: string;
  object: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  customer: string;
  items: {
    data: Array<{
      id: string;
      current_period_start: number;
      current_period_end: number;
      plan: {
        id: string;
        amount: number;
        currency: string;
        interval: string;
        product: string;
      };
    }>;
  };
}

export interface CheckoutSessionDetail {
  invoice: string;
  object: string;
  amount_total: number;
  currency: string;
  status: string;
  payment_status: string;
  customer_email: string;
  mode: string;
  subscription: string | { id: string } | null;
}
