import { normalizeBaseUrl } from "./utils";

export const getStripePaymentLink = (planSlug: string): string => {
  const env = import.meta.env as Record<string, string | undefined>;
  const staticMap: Record<string, string | undefined> = {
    startup: env.VITE_STRIPE_PAYMENT_LINK_STARTUP,
    business: env.VITE_STRIPE_PAYMENT_LINK_BUSINESS,
    enterprise: env.VITE_STRIPE_PAYMENT_LINK_ENTERPRISE,
  };

  const dynamicKey = `VITE_STRIPE_PAYMENT_LINK_${planSlug.replace(/[^a-z0-9]/gi, "_").toUpperCase()}`;
  const dynamicValue = env[dynamicKey];

  return normalizeBaseUrl(staticMap[planSlug] ?? dynamicValue ?? "");
};

export const buildPaymentSuccessUrl = (
  planName: string,
  planSlug: string,
  companyId: string,
  sessionId: string,
) => {
  const params = new URLSearchParams();
  params.set("payment", "success");
  if (planName) params.set("plan", planName);
  if (planSlug) params.set("slug", planSlug);
  if (companyId) params.set("companyId", companyId);
  if (sessionId) params.set("session_id", sessionId);
  return `/subscription/payment-success?${params.toString()}`;
};
