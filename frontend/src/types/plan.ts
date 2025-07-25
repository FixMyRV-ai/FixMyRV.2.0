export interface Plan {
  id: string;
  priceId: string;
  name: string;
  description: string;
  unitAmount: number;
  currency: string;
  interval: string | undefined;
  credits: number;
  active: boolean;
  features: Record<string, string> | null;
  metadata: Record<string, string>;
}

export interface PlanResponse extends Plan {
  id: string;
  createdAt: string;
  updatedAt: string;
}
