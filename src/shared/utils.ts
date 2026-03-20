import { API_BASE_URL_CANDIDATES } from "./constants";
import { ENDPOINTS } from "./endpoints";

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
