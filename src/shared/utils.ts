import {
  API_BASE_URL_CANDIDATES,
  PENDING_PLAN_STORAGE_KEY,
  STRIPE_POST_CHECKOUT_REDIRECT_STORAGE_KEY,
  DARK_MODE_STORAGE_KEY,
} from "./constants";
import { ENDPOINTS } from "./endpoints";
import type { ApiCompanyPlan, PendingPlanSelection } from "./types";

// ── Text helpers ──

export const normalizePlanText = (value: string) =>
  value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const getPlanSlug = (planName: string) => {
  const normalized = normalizePlanText(planName);
  if (/(start|startup|baslangic)/.test(normalized)) return "startup";
  if (/(business|profesyonel)/.test(normalized)) return "business";
  if (/(enterprise|kurumsal)/.test(normalized)) return "enterprise";
  return normalized.replace(/\s+/g, "-");
};

export const formatPlanPrice = (price: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);

// ── API URL helpers ──

export const normalizeBaseUrl = (value: string) => value.replace(/\/$/, "");

export const getApiBaseUrlCandidates = (): string[] => {
  const envBaseUrl = (import.meta.env.VITE_TASKFLOW_API_URL as string | undefined)?.trim() ?? "";
  return ["", envBaseUrl, ...API_BASE_URL_CANDIDATES.filter((u) => u !== "")]
    .map((url) => normalizeBaseUrl(url))
    .filter((url, index, arr) => arr.indexOf(url) === index);
};

export const buildApiUrl = (baseUrl: string, endpointPath: string) =>
  baseUrl ? `${baseUrl}${endpointPath}` : endpointPath;

export const buildPlansUrl = (baseUrl: string) =>
  `${baseUrl ? `${baseUrl}/` : "/"}${ENDPOINTS.COMPANY_PLANS.replace(/^\//, "")}?t=${Date.now()}`;

export const buildChatbotUrl = (baseUrl: string) =>
  `${baseUrl ? `${baseUrl}/` : "/"}${ENDPOINTS.CHATBOT.replace(/^\//, "")}?t=${Date.now()}`;

// ── Record helpers ──

export const toRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

export const getNumberByAliases = (obj: Record<string, unknown>, aliases: string[]): number => {
  for (const key of aliases) {
    const numericValue = Number(obj[key]);
    if (!Number.isNaN(numericValue)) return numericValue;
  }
  return Number.NaN;
};

export const getBooleanByAliases = (obj: Record<string, unknown>, aliases: string[]): boolean => {
  for (const key of aliases) {
    const rawValue = obj[key];
    if (typeof rawValue === "boolean") return rawValue;
    if (typeof rawValue === "string") {
      const normalized = rawValue.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
    if (typeof rawValue === "number") return rawValue !== 0;
  }
  return false;
};

// ── API Plan parsing (full version with properties) ──

export const parseApiPlans = (payload: unknown): ApiCompanyPlan[] => {
  const payloadRecord = toRecord(payload);
  const dataRecord = toRecord(payloadRecord.data);
  const itemsRecord = toRecord(payloadRecord.items);
  const resultRecord = toRecord(payloadRecord.result);
  const valueRecord = toRecord(payloadRecord.value);
  const rawArray =
    Array.isArray(payload) ? payload :
      Array.isArray(payloadRecord.$values) ? payloadRecord.$values :
        Array.isArray(payloadRecord.data) ? payloadRecord.data :
          Array.isArray(dataRecord.$values) ? dataRecord.$values :
            Array.isArray(payloadRecord.items) ? payloadRecord.items :
              Array.isArray(itemsRecord.$values) ? itemsRecord.$values :
                Array.isArray(payloadRecord.result) ? payloadRecord.result :
                  Array.isArray(resultRecord.$values) ? resultRecord.$values :
                    Array.isArray(payloadRecord.value) ? payloadRecord.value :
                      Array.isArray(valueRecord.$values) ? valueRecord.$values :
                        [];

  return rawArray
    .map((item) => {
      const raw = toRecord(item);
      const rawProperties = toRecord(raw.planProperties ?? raw.PlanProperties ?? raw.properties ?? raw.Properties);
      const planNameValue = raw.planName ?? raw.PlanName ?? raw.name ?? raw.Name;
      const planName = typeof planNameValue === "string" ? planNameValue : undefined;
      const planPrice = Number(raw.planPrice ?? raw.PlanPrice ?? raw.price ?? raw.Price);
      if (!planName || Number.isNaN(planPrice)) return null;

      const peopleAddedLimit = getNumberByAliases(rawProperties, ["peopleAddedLimit", "PeopleAddedLimit", "workerAddedLimit", "WorkerAddedLimit"]);
      const teamLimit = getNumberByAliases(rawProperties, ["teamLimit", "TeamLimit"]);
      const individualTaskLimit = getNumberByAliases(rawProperties, ["individualTaskLimit", "IndividualTaskLimit", "taskLimit", "TaskLimit"]);
      const isInternalReportingEnabled = getBooleanByAliases(rawProperties, ["isInternalReportingEnabled", "IsInternalReportingEnabled", "isReportIncluded", "IsReportIncluded"]);

      const hasProperties = ![peopleAddedLimit, teamLimit, individualTaskLimit].some(Number.isNaN);

      const result: ApiCompanyPlan = { planName, planPrice };
      if (hasProperties) {
        result.planProperties = { peopleAddedLimit, teamLimit, individualTaskLimit, isInternalReportingEnabled };
      }
      return result;
    })
    .filter((plan): plan is ApiCompanyPlan => plan !== null);
};

// ── localStorage helpers ──

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

export const saveStripePostCheckoutRedirect = (returnUrl: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STRIPE_POST_CHECKOUT_REDIRECT_STORAGE_KEY,
      JSON.stringify({ returnUrl, createdAt: Date.now() })
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
