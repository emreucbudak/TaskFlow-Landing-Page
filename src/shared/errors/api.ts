export type ApiErrorPayload = {
  message?: string;
  detail?: string;
  title?: string;
  errors?: Record<string, string[]>;
};

type ExtractApiErrorOptions = {
  payload: ApiErrorPayload;
  raw: string;
  statusCode: number;
  fallback?: string;
  statusCodeMap?: Record<number, string>;
  includeServerError?: boolean;
};

export const parsePayload = <T extends object>(raw: string): T => {
  try {
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
};

export const normalizeText = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const isLikelyHtml = (value: string) => {
  const trimmed = value.trim().toLocaleLowerCase("tr-TR");
  return trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html");
};

export const extractApiError = ({
  payload,
  raw,
  statusCode,
  fallback = "",
  statusCodeMap = {},
  includeServerError = true,
}: ExtractApiErrorOptions): string => {
  const validationError = payload.errors
    ? Object.values(payload.errors).flat().find(Boolean)
    : "";

  return (
    validationError ||
    payload.message ||
    payload.detail ||
    payload.title ||
    (raw.trim() && !isLikelyHtml(raw) ? raw : "") ||
    statusCodeMap[statusCode] ||
    (includeServerError && statusCode >= 500 ? "server error" : "") ||
    fallback
  );
};
