export type StripeCheckoutSessionResponse = {
  checkoutUrl?: string;
  CheckoutUrl?: string;
  message?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

export type ApiPlanProperties = {
  peopleAddedLimit: number;
  teamLimit: number;
  individualTaskLimit: number;
  isInternalReportingEnabled: boolean;
};

export type ApiCompanyPlan = {
  planName: string;
  planPrice: number;
  planProperties?: ApiPlanProperties;
};

export type PendingPlanSelection = {
  planName: string;
  planSlug: string;
  createdAt?: number;
};
