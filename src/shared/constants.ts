export const PENDING_PLAN_STORAGE_KEY = "taskflow_pending_plan_checkout";
export const STRIPE_POST_CHECKOUT_REDIRECT_STORAGE_KEY = "taskflow_stripe_post_checkout_redirect";
export const DARK_MODE_STORAGE_KEY = "taskflow_dark_mode";

export const API_BASE_URL_CANDIDATES = [
  "",
  "http://localhost:5172",
  "https://localhost:7243",
  "http://localhost:8080",
  "https://localhost:8081",
] as const;
