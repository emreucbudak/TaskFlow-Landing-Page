import { normalizeText } from "./api";
import { companyCreateErrorMessages, loginErrorMessages } from "./messages";

export const toFriendlyLoginError = (rawError: string): string => {
  const normalized = normalizeText(rawError);

  if (!normalized) return loginErrorMessages.genericActionFailed;
  if (normalized.includes("too many requests") || normalized.includes("429")) {
    return loginErrorMessages.tooManyAttempts;
  }
  if (
    normalized.includes("sifre yanlis") ||
    normalized.includes("wrong password") ||
    normalized.includes("invalid credentials") ||
    normalized.includes("password")
  ) {
    return loginErrorMessages.invalidCredentials;
  }
  if (
    normalized.includes("kullanici bulunamadi") ||
    normalized.includes("user not found") ||
    normalized.includes("resource not found")
  ) {
    return loginErrorMessages.userNotFound;
  }
  if (normalized.includes("authentication error") || normalized.includes("unauthorized")) {
    return loginErrorMessages.authenticationFailed;
  }
  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("network error") ||
    normalized.includes("api'ye erisilemedi") ||
    normalized.includes("timeout") ||
    normalized.includes("timed out") ||
    normalized.includes("fetch")
  ) {
    return loginErrorMessages.networkUnavailable;
  }
  if (normalized.includes("server error") || normalized.includes("internal server error") || normalized.includes("500")) {
    return loginErrorMessages.temporaryServerError;
  }

  return loginErrorMessages.genericActionFailed;
};

export const toFriendlyCompanyCreateError = (rawError: string): string => {
  const normalized = normalizeText(rawError);

  if (!normalized) return companyCreateErrorMessages.genericActionFailed;
  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("network error") ||
    normalized.includes("timeout") ||
    normalized.includes("timed out") ||
    normalized.includes("fetch")
  ) {
    return companyCreateErrorMessages.networkUnavailable;
  }
  if (
    normalized.includes("already exists") ||
    normalized.includes("already taken") ||
    (normalized.includes("email") && normalized.includes("zaten") && normalized.includes("kullani"))
  ) {
    return companyCreateErrorMessages.emailAlreadyInUse;
  }
  if (normalized.includes("kayit islemi basarisiz") || normalized.includes("register")) {
    return companyCreateErrorMessages.registerFailed;
  }
  if (normalized.includes("too many requests") || normalized.includes("429")) {
    return companyCreateErrorMessages.tooManyRequests;
  }
  if (normalized.includes("server error") || normalized.includes("internal server error") || normalized.includes("500")) {
    return companyCreateErrorMessages.temporaryServerError;
  }
  if (normalized.includes("unauthorized") || normalized.includes("authentication")) {
    return companyCreateErrorMessages.authenticationFailed;
  }
  if (normalized.includes("one or more validation errors occurred") || normalized.includes("validation")) {
    return companyCreateErrorMessages.validationFailed;
  }
  if (normalized.includes("sifre") || normalized.includes("password")) {
    if (
      normalized.includes("8 karakter") ||
      normalized.includes("must contain") ||
      normalized.includes("buyuk harf") ||
      normalized.includes("kucuk harf") ||
      normalized.includes("rakam")
    ) {
      return companyCreateErrorMessages.passwordRulesFailed;
    }
    return companyCreateErrorMessages.passwordGenericFailed;
  }

  return companyCreateErrorMessages.genericActionFailed;
};
