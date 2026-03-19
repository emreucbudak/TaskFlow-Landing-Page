export const ENDPOINTS = {
  CREATE_COMPANY: "/api/Identity/CreateCompanyCommandRequest",
  REGISTER: "/api/Identity/RegisterCommandRequest",
  CREATE_STRIPE_CHECKOUT_SESSION: "/api/Tenant/CreateStripeCheckoutSessionRequest",
  ACTIVATE_COMPANY_SUBSCRIPTION: "/api/Tenant/ActivateCompanySubscriptionRequest",
  CONFIRM_STRIPE_PAYMENT_AND_ACTIVATE: "/api/Tenant/ConfirmStripePaymentAndActivateRequest",
  COMPANY_PLANS: "/api/Tenant/CompanyPlans",
  CHATBOT: "/api/ai/chatbot",
} as const;
