import {
  PENDING_PLAN_STORAGE_KEY,
  STRIPE_POST_CHECKOUT_REDIRECT_STORAGE_KEY,
  DARK_MODE_STORAGE_KEY,
} from "./constants";
import type { PendingPlanSelection } from "./types";

// ── Pending plan selection ──

export const savePendingPlanSelection = (planName: string, planSlug: string) => {
  if (typeof window === "undefined") return;
  const payload: PendingPlanSelection = { planName, planSlug, createdAt: Date.now() };
  try {
    window.localStorage.setItem(PENDING_PLAN_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
};

export const readPendingPlanSelection = (): PendingPlanSelection | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_PLAN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingPlanSelection>;
    if (typeof parsed.planName !== "string" || typeof parsed.planSlug !== "string") return null;
    return {
      planName: parsed.planName,
      planSlug: parsed.planSlug,
      createdAt: typeof parsed.createdAt === "number" ? parsed.createdAt : undefined,
    };
  } catch {
    return null;
  }
};

export const clearPendingPlanSelection = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PENDING_PLAN_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
};

// ── Stripe post-checkout redirect ──

export const saveStripePostCheckoutRedirect = (returnUrl: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STRIPE_POST_CHECKOUT_REDIRECT_STORAGE_KEY,
      JSON.stringify({ returnUrl, createdAt: Date.now() }),
    );
  } catch {
    // ignore storage errors
  }
};

export const clearStripePostCheckoutRedirect = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STRIPE_POST_CHECKOUT_REDIRECT_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
};

// ── Dark mode persistence ──

export const saveDarkMode = (dark: boolean) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DARK_MODE_STORAGE_KEY, JSON.stringify(dark));
  } catch {
    // ignore storage errors
  }
};

export const readDarkMode = (fallback: boolean): boolean => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(DARK_MODE_STORAGE_KEY);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return typeof parsed === "boolean" ? parsed : fallback;
  } catch {
    return fallback;
  }
};
