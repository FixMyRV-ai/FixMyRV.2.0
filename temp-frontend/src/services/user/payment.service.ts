import BaseService from "../base.service";
import { Plan } from "@/types/plan";
import { CheckoutSessionDetail, SubscriptionData } from "@/types/subscription";
interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

interface CheckoutSessionDetailResponse {
  data: CheckoutSessionDetail;
}

interface PlansResponse {
  data: Plan[];
}

  interface SubscriptionResponse {
    data: SubscriptionData;
}

class PaymentService extends BaseService {
  constructor() {
    super("/stripe");
  }

  createCheckoutSession = async (
    priceId: string
  ): Promise<CheckoutSessionResponse> => {
    try {
      const response = await this.post<CheckoutSessionResponse>(
        "/create-checkout-session",
        { priceId }
      );
      return response;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw error;
    }
  };

  getPlans = async (): Promise<PlansResponse> => {
    try {
      const response = await this.get<PlansResponse>("/plans");
      return response;
    } catch (error) {
      console.error("Error fetching plans:", error);
      throw error;
    }
  };

  getCheckoutSession = async (
    session_id: string
  ): Promise<CheckoutSessionDetailResponse> => {
    try {
      const response = await this.get<CheckoutSessionDetailResponse>(
        `/checkout-session/${session_id}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching checkout session:", error);
      throw error;
    }
  };

  getSubscription = async (): Promise<SubscriptionResponse> => {
    try {
      const response = await this.get<SubscriptionResponse>("/subscription");
      return response;
    } catch (error) {
      console.error("Error fetching subscription:", error);
      throw error;
    }
  };

  cancelSubscription = async (subscriptionId: string): Promise<SubscriptionResponse> => {
    try {
      const response = await this.post<SubscriptionResponse>(
        "/cancel-subscription",
        { subscriptionId }
      );
      return response;
    } catch (error) {
      console.error("Error canceling subscription:", error);
      throw error;
    }
  };
}

export default new PaymentService();
