import { getApiBaseUrlCandidates } from "./utils";

export async function tryApiCandidates<T>(
  fn: (baseUrl: string) => Promise<T>,
  options?: { signal?: AbortSignal; fallbackError?: string },
): Promise<T> {
  const candidates = getApiBaseUrlCandidates();
  let lastError: unknown;

  for (const baseUrl of candidates) {
    if (options?.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    try {
      return await fn(baseUrl);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      lastError = err;
    }
  }

  throw lastError ?? new Error(options?.fallbackError ?? "Tüm API adayları başarısız oldu.");
}
