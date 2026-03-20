import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { extractApiError, parsePayload, type ApiErrorPayload } from "../shared/errors/api";
import { toFriendlyCompanyCreateError } from "../shared/errors/mappers";
import { companyCreateErrorMessages, validationMessages } from "../shared/errors/messages";
import { ENDPOINTS } from "../shared/endpoints";
import { guidRegex } from "../shared/constants";
import type { StripeCheckoutSessionResponse, ApiCompanyPlan } from "../shared/types";
import {
  normalizePlanText,
  getPlanSlug,
  formatPlanPrice,
  getApiBaseUrlCandidates,
  buildApiUrl,
  buildPlansUrl,
} from "../shared/utils";
import { parseApiPlans } from "../shared/planParser";
import {
  readPendingPlanSelection,
  clearPendingPlanSelection,
  saveStripePostCheckoutRedirect,
  clearStripePostCheckoutRedirect,
  saveDarkMode,
  readDarkMode,
} from "../shared/storage";
import Icon from "../shared/components/Icon";
import "./CompanyCreatePage.css";

type CreateCompanyResponse = {
  companyId?: string;
  CompanyId?: string;
  companyName?: string;
  CompanyName?: string;
  message?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

const companyCreateSchema = z
  .object({
    companyName: z.string().trim().min(1, validationMessages.requiredCompanyName),
    adminName: z.string().trim().min(1, validationMessages.requiredAdminName),
    adminEmail: z.string().trim().min(1, validationMessages.requiredEmail).email(validationMessages.invalidEmail),
    password: z
      .string()
      .min(8, validationMessages.passwordMinLength)
      .regex(/[A-Z]/, validationMessages.passwordMustContainUppercase)
      .regex(/[a-z]/, validationMessages.passwordMustContainLowercase)
      .regex(/[0-9]/, validationMessages.passwordMustContainNumber),
    confirmPassword: z.string().min(1, validationMessages.requiredPasswordConfirmation),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: validationMessages.passwordsDoNotMatch,
    path: ["confirmPassword"],
  });

type CompanyCreateFormValues = z.infer<typeof companyCreateSchema>;

const readQuery = () => {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  return {
    payment: params.get("payment") ?? "",
    plan: params.get("plan") ?? "",
    slug: params.get("slug") ?? "",
    companyId: params.get("companyId") ?? "",
  };
};

const Blobs = ({ dark }: { dark: boolean }) => (
  <>
    <div style={{
      position: "fixed", top: "-180px", right: "-120px",
      width: "520px", height: "520px", borderRadius: "50%",
      background: dark
        ? "radial-gradient(circle, rgba(19,236,200,0.12) 0%, transparent 70%)"
        : "radial-gradient(circle, rgba(19,236,200,0.18) 0%, transparent 70%)",
      pointerEvents: "none", transition: "background 0.3s",
    }} />
    <div style={{
      position: "fixed", bottom: "-200px", left: "-150px",
      width: "600px", height: "600px", borderRadius: "50%",
      background: dark
        ? "radial-gradient(circle, rgba(19,236,200,0.07) 0%, transparent 70%)"
        : "radial-gradient(circle, rgba(19,236,200,0.12) 0%, transparent 70%)",
      pointerEvents: "none", transition: "background 0.3s",
    }} />
    <div style={{
      position: "fixed", top: "40%", left: "15%",
      width: "2px", height: "120px",
      background: "linear-gradient(to bottom, transparent, rgba(19,236,200,0.3), transparent)",
      pointerEvents: "none",
    }} />
    <div style={{
      position: "fixed", top: "20%", right: "18%",
      width: "2px", height: "80px",
      background: "linear-gradient(to bottom, transparent, rgba(19,236,200,0.2), transparent)",
      pointerEvents: "none",
    }} />
  </>
);

// ── API sub-steps for handleCreate ──

async function createCompany(apiBaseUrl: string, companyName: string) {
  const response = await fetch(buildApiUrl(apiBaseUrl, ENDPOINTS.CREATE_COMPANY), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyName: companyName.trim() }),
  });
  const raw = await response.text();
  const payload = parsePayload<CreateCompanyResponse>(raw);
  return { response, raw, payload };
}

async function registerAdmin(
  apiBaseUrl: string,
  params: { adminName: string; adminEmail: string; password: string; companyId: string },
) {
  const response = await fetch(buildApiUrl(apiBaseUrl, ENDPOINTS.REGISTER), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: params.adminName.trim(),
      email: params.adminEmail.trim(),
      password: params.password,
      companyId: params.companyId,
      role: "Company",
    }),
  });
  const raw = await response.text();
  const payload = parsePayload<ApiErrorPayload>(raw);
  return { response, raw, payload };
}

async function activateSubscription(
  companyId: string,
  planName: string,
  planSlug: string,
) {
  let lastError: string = companyCreateErrorMessages.subscriptionActivationFailed;

  for (const apiBaseUrl of getApiBaseUrlCandidates()) {
    try {
      const response = await fetch(buildApiUrl(apiBaseUrl, ENDPOINTS.ACTIVATE_COMPANY_SUBSCRIPTION), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          planName: planName || undefined,
          planSlug: planSlug || undefined,
        }),
      });

      const raw = await response.text();
      const payload = parsePayload<ApiErrorPayload>(raw);

      if (!response.ok) {
        const activateError = extractApiError({
          payload,
          raw,
          statusCode: response.status,
          fallback: companyCreateErrorMessages.subscriptionActivationFailed,
          statusCodeMap: { 401: "unauthorized", 404: "resource not found", 409: "already exists", 429: "too many requests" },
        });
        const friendlyError = `${companyCreateErrorMessages.companyAndAdminCreatedButSubscriptionFailedPrefix} ${toFriendlyCompanyCreateError(activateError)}`;

        if (response.status < 500) {
          return { ok: false as const, error: friendlyError };
        }
        lastError = friendlyError;
        continue;
      }

      return { ok: true as const };
    } catch (error) {
      if (error instanceof Error && error.message) {
        lastError = toFriendlyCompanyCreateError(error.message);
      } else {
        lastError = companyCreateErrorMessages.networkUnavailable;
      }
    }
  }

  return { ok: false as const, error: lastError };
}

export default function CompanyCreatePage() {
  const { payment, plan, slug } = useMemo(() => readQuery(), []);
  const pendingPlan = useMemo(() => readPendingPlanSelection(), []);
  const [dark, setDark] = useState(() => readDarkMode(true));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [availablePlans, setAvailablePlans] = useState<ApiCompanyPlan[]>([]);
  const [selectedPlanName, setSelectedPlanName] = useState("");
  const [isPlansLoading, setIsPlansLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyCreateFormValues>({
    resolver: zodResolver(companyCreateSchema),
    defaultValues: {
      companyName: "",
      adminName: "",
      adminEmail: "",
      password: "",
      confirmPassword: "",
    },
  });

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      saveDarkMode(next);
      return next;
    });
  };

  const isLegacyPaymentFlowEnabled = payment === "legacy";
  const resolvedPlan = plan.trim() || pendingPlan?.planName?.trim() || "";
  const resolvedSlug = slug.trim() || pendingPlan?.planSlug?.trim() || "";
  const effectivePlan = resolvedPlan || selectedPlanName.trim();
  const effectiveSlug = resolvedSlug || (selectedPlanName.trim() ? getPlanSlug(selectedPlanName.trim()) : "");

  useEffect(() => {
    clearStripePostCheckoutRedirect();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchPlans = async () => {
      setIsPlansLoading(true);
      try {
        for (const apiBaseUrl of getApiBaseUrlCandidates()) {
          if (controller.signal.aborted) return;
          try {
            const response = await fetch(buildPlansUrl(apiBaseUrl), { cache: "no-store", signal: controller.signal });
            if (!response.ok) continue;
            const payload: unknown = await response.json();
            const plans = parseApiPlans(payload).sort((a, b) => a.planPrice - b.planPrice);
            if (plans.length === 0) continue;
            if (!controller.signal.aborted) setAvailablePlans(plans);
            return;
          } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return;
            continue;
          }
        }
      } finally {
        if (!controller.signal.aborted) setIsPlansLoading(false);
      }
    };

    void fetchPlans();
    return () => { controller.abort(); };
  }, []);

  const resolvePlanPrice = (planName: string) => {
    const normalized = normalizePlanText(planName);
    const matched = availablePlans.find((item) => normalizePlanText(item.planName) === normalized);
    return matched?.planPrice;
  };

  const startStripeCheckout = async ({
    companyIdValue,
    planName,
    planSlug,
  }: {
    companyIdValue: string;
    planName: string;
    planSlug: string;
  }) => {
    const successParams = new URLSearchParams();
    successParams.set("payment", "success");
    successParams.set("companyId", companyIdValue);
    if (planName) successParams.set("plan", planName);
    if (planSlug) successParams.set("slug", planSlug);
    successParams.set("session_id", "{CHECKOUT_SESSION_ID}");

    const cancelParams = new URLSearchParams();
    cancelParams.set("payment", "cancel");
    cancelParams.set("companyId", companyIdValue);
    if (planName) cancelParams.set("plan", planName);
    if (planSlug) cancelParams.set("slug", planSlug);

    const successUrl = `${window.location.origin}/subscription/payment-success?${successParams.toString()}`;
    const cancelUrl = `${window.location.origin}/subscription/payment-success?${cancelParams.toString()}`;

    let lastError: string = companyCreateErrorMessages.genericActionFailed;
    for (const apiBaseUrl of getApiBaseUrlCandidates()) {
      try {
        const checkoutResponse = await fetch(buildApiUrl(apiBaseUrl, ENDPOINTS.CREATE_STRIPE_CHECKOUT_SESSION), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId: companyIdValue,
            planName: planName || undefined,
            planSlug: planSlug || undefined,
            successUrl,
            cancelUrl,
          }),
        });
        const checkoutRaw = await checkoutResponse.text();
        const checkoutPayload = parsePayload<StripeCheckoutSessionResponse>(checkoutRaw);

        if (!checkoutResponse.ok) {
          const checkoutError = extractApiError({
            payload: checkoutPayload,
            raw: checkoutRaw,
            statusCode: checkoutResponse.status,
            fallback: companyCreateErrorMessages.genericActionFailed,
            statusCodeMap: { 401: "unauthorized", 404: "resource not found", 409: "already exists", 429: "too many requests" },
          });
          const friendlyError = toFriendlyCompanyCreateError(checkoutError);
          if (checkoutResponse.status < 500) {
            setErrorMessage(friendlyError);
            return false;
          }
          lastError = friendlyError;
          continue;
        }

        const checkoutUrl = checkoutPayload.checkoutUrl ?? checkoutPayload.CheckoutUrl ?? "";
        if (!checkoutUrl) {
          lastError = companyCreateErrorMessages.genericActionFailed;
          continue;
        }

        saveStripePostCheckoutRedirect(successUrl);
        window.location.assign(checkoutUrl);
        return true;
      } catch (error) {
        if (error instanceof Error && error.message) {
          lastError = toFriendlyCompanyCreateError(error.message);
        } else {
          lastError = companyCreateErrorMessages.networkUnavailable;
        }
      }
    }

    setErrorMessage(lastError);
    return false;
  };

  const handleCreate = async ({
    companyName,
    adminName,
    adminEmail,
    password,
  }: CompanyCreateFormValues) => {
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    let lastError: string = companyCreateErrorMessages.genericActionFailed;
    let hasAnyNetworkError = false;
    let hasAnyReachableResponse = false;

    for (const apiBaseUrl of getApiBaseUrlCandidates()) {
      try {
        // Step 1: Create company
        const { response: createResponse, raw: createRaw, payload: createPayload } =
          await createCompany(apiBaseUrl, companyName);
        hasAnyReachableResponse = true;

        if (!createResponse.ok) {
          const createError = extractApiError({
            payload: createPayload,
            raw: createRaw,
            statusCode: createResponse.status,
            fallback: lastError,
            statusCodeMap: { 401: "unauthorized", 404: "resource not found", 409: "already exists", 429: "too many requests" },
          });
          const friendlyError = toFriendlyCompanyCreateError(createError);
          if (createResponse.status < 500) {
            setErrorMessage(friendlyError);
            setIsLoading(false);
            return;
          }
          lastError = friendlyError;
          continue;
        }

        const createdCompanyId = createPayload.companyId ?? createPayload.CompanyId ?? "";
        if (!guidRegex.test(createdCompanyId)) {
          lastError = companyCreateErrorMessages.companyCreatedButIncomplete;
          continue;
        }

        // Step 2: Register admin
        const { response: registerResponse, raw: registerRaw, payload: registerPayload } =
          await registerAdmin(apiBaseUrl, { adminName, adminEmail, password, companyId: createdCompanyId });

        if (!registerResponse.ok) {
          const registerError = extractApiError({
            payload: registerPayload,
            raw: registerRaw,
            statusCode: registerResponse.status,
            fallback: companyCreateErrorMessages.registerFailed,
            statusCodeMap: { 401: "unauthorized", 404: "resource not found", 409: "already exists", 429: "too many requests" },
          });
          setErrorMessage(
            `${companyCreateErrorMessages.companyCreatedButAdminFailedPrefix} ${toFriendlyCompanyCreateError(registerError)}`
          );
          setIsLoading(false);
          return;
        }

        // Step 3: Stripe checkout or subscription activation
        const planPrice = effectivePlan ? resolvePlanPrice(effectivePlan) : undefined;
        const shouldStartPaidCheckout =
          isLegacyPaymentFlowEnabled && Boolean(effectivePlan || effectiveSlug) && ((planPrice ?? 1) > 0);

        if (shouldStartPaidCheckout) {
          setSuccessMessage("Kayit basariyla tamamlandi. Odeme adimina yonlendiriliyorsunuz.");
          const started = await startStripeCheckout({
            companyIdValue: createdCompanyId,
            planName: effectivePlan,
            planSlug: effectiveSlug,
          });
          if (!started) {
            setIsLoading(false);
          }
          return;
        }

        const activationPlanName = effectivePlan || "Start-up";
        const activationPlanSlug = effectiveSlug || getPlanSlug(activationPlanName);
        const activationResult = await activateSubscription(createdCompanyId, activationPlanName, activationPlanSlug);

        if (!activationResult.ok) {
          setErrorMessage(activationResult.error);
          setIsLoading(false);
          return;
        }

        clearPendingPlanSelection();
        setSuccessMessage("Kayit basarili.");
        setIsLoading(false);
        return;
      } catch (error) {
        hasAnyNetworkError = true;
        if (!hasAnyReachableResponse) {
          if (error instanceof Error && error.message) {
            lastError = toFriendlyCompanyCreateError(error.message);
          } else {
            lastError = companyCreateErrorMessages.networkUnavailable;
          }
        }
      }
    }

    if (hasAnyNetworkError && !hasAnyReachableResponse) {
      setErrorMessage(companyCreateErrorMessages.networkUnavailable);
      setIsLoading(false);
      return;
    }

    setErrorMessage(toFriendlyCompanyCreateError(lastError));
    setIsLoading(false);
  };

  const bg = dark ? "#0a0f0e" : "#f0faf8";
  const cardBg = dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.85)";
  const cardBorder = dark ? "rgba(19,236,200,0.15)" : "rgba(19,236,200,0.3)";
  const cardShadow = dark
    ? "0 0 80px rgba(19,236,200,0.06), inset 0 1px 0 rgba(255,255,255,0.06)"
    : "0 0 80px rgba(19,236,200,0.1), 0 8px 32px rgba(13,27,25,0.08)";
  const headingColor = dark ? "#e8f6f2" : "#0d1b19";
  const logoTextColor = dark ? "#e8f6f2" : "#0d1b19";
  const inputColor = dark ? "#e8f6f2" : "#0d1b19";
  const inputBg = dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)";
  const inputBorder = dark ? "rgba(255,255,255,0.1)" : "rgba(19,236,200,0.25)";
  const inputFocusClass = dark ? "tf-input-dark" : "tf-input-light";
  const labelColor = dark ? "rgba(255,255,255,0.35)" : "rgba(13,27,25,0.45)";
  const sectionLabelColor = dark ? "rgba(19,236,200,0.5)" : "rgba(13,140,110,0.7)";
  const sectionLabelLineColor = dark ? "rgba(19,236,200,0.12)" : "rgba(19,236,200,0.2)";

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    background: bg,
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
    transition: "background 0.3s",
  };

  const cardStyleObj: CSSProperties = {
    width: "100%",
    maxWidth: "480px",
    background: cardBg,
    borderRadius: "24px",
    border: `1px solid ${cardBorder}`,
    boxShadow: cardShadow,
    padding: "48px 40px 44px",
    position: "relative",
    zIndex: 1,
    transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s",
  };

  const inputStyle: CSSProperties = {
    display: "block",
    width: "100%",
    height: "52px",
    padding: "0 16px",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    color: inputColor,
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    borderRadius: "12px",
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
    boxSizing: "border-box",
    letterSpacing: "0.01em",
  };

  const fieldErrorStyle: CSSProperties = {
    margin: "8px 2px 0",
    fontSize: "12px",
    color: "#fca5a5",
    lineHeight: 1.4,
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      <button
        className="tf-toggle"
        onClick={toggleDark}
        style={{
          position: "fixed", bottom: "20px", right: "20px", zIndex: 999,
          width: "44px", height: "44px", borderRadius: "50%",
          background: dark ? "#13ecc8" : "#0d1b19",
          color: dark ? "#0d1b19" : "#fff",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,.3)",
        }}
      >
        <Icon name={dark ? "light_mode" : "dark_mode"} style={{ fontSize: "20px" }} />
      </button>

      <div style={pageStyle}>
        <Blobs dark={dark} />

        <div className="tf-card" style={cardStyleObj}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "36px" }}>
            <img
              src="https://www.logoai.com/uploads/icon/2021/08/06/732ca933-7df8-43e8-b085-69466243c919.png"
              alt="TaskFlow logo"
              style={{ width: "36px", height: "36px", objectFit: "contain", display: "block", flexShrink: 0 }}
            />
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "16px", color: logoTextColor, letterSpacing: "-0.01em", transition: "color 0.3s" }}>
              TaskFlow
            </span>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <h1 style={{
              margin: "0 0 6px",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.5rem, 3vw, 1.9rem)",
              color: headingColor,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              transition: "color 0.3s",
            }}>
              Sirketini olustur.
            </h1>
          </div>

          <div style={{
            display: "flex", gap: "10px",
            background: "rgba(251,191,36,0.07)",
            border: "1px solid rgba(251,191,36,0.2)",
            borderRadius: "12px", padding: "12px 14px", marginBottom: "28px",
          }}>
            <svg style={{ flexShrink: 0, marginTop: "1px" }} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5L14.5 13H1.5L8 1.5Z" stroke="#fbbf24" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M8 6v3.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11.5" r=".75" fill="#fbbf24" />
            </svg>
            <p style={{ fontSize: "13px", color: "rgba(251,191,36,0.8)", margin: 0, lineHeight: 1.5 }}>
              Sirket ve yonetici bilgilerini tamamlayarak kaydi bitirebilirsiniz.
            </p>
          </div>

          {isLegacyPaymentFlowEnabled && !resolvedPlan && !resolvedSlug && (
            <div
              style={{
                background: dark ? "rgba(19,236,200,0.08)" : "rgba(13,140,110,0.08)",
                border: dark ? "1px solid rgba(19,236,200,0.2)" : "1px solid rgba(13,140,110,0.2)",
                borderRadius: "12px",
                padding: "12px 14px",
                marginBottom: "18px",
              }}
            >
              <p style={{ margin: "0 0 10px", fontSize: "13px", lineHeight: 1.5, color: dark ? "#b7f7ea" : "#0d1b19" }}>
                Plan bilgisi bulunamadi. Lutfen planinizi secin.
              </p>
              <select
                className={inputFocusClass}
                value={selectedPlanName}
                disabled={isPlansLoading}
                onChange={(event) => {
                  setSelectedPlanName(event.target.value);
                }}
                style={{ ...inputStyle, appearance: "none", backgroundImage: "none" }}
              >
                <option value="">{isPlansLoading ? "Planlar yukleniyor..." : "Plan secin"}</option>
                {availablePlans.map((item) => (
                  <option key={item.planName} value={item.planName}>
                    {item.planName} - {item.planPrice <= 0 ? "Ucretsiz" : `${formatPlanPrice(item.planPrice)}/ay`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <form
            onSubmit={handleSubmit((values) => {
              void handleCreate(values);
            })}
          >
            <p style={{
              fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
              color: sectionLabelColor, margin: "0 0 14px",
              display: "flex", alignItems: "center", gap: "8px", transition: "color 0.3s",
            }}>
              Sirket Bilgileri
              <span style={{ flex: 1, height: "1px", background: sectionLabelLineColor, display: "block", transition: "background 0.3s" }} />
            </p>
            <div style={{ display: "grid", gap: "14px", marginBottom: "28px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: labelColor, marginBottom: "7px", transition: "color 0.3s" }}>
                  Sirket adi
                </label>
                <input
                  className={inputFocusClass}
                  type="text"
                  placeholder="Ornek: TaskFlow Labs"
                  style={inputStyle}
                  {...register("companyName")}
                />
                {errors.companyName?.message && <p style={fieldErrorStyle}>{errors.companyName.message}</p>}
              </div>
            </div>

            <p style={{
              fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
              color: sectionLabelColor, margin: "0 0 14px",
              display: "flex", alignItems: "center", gap: "8px", transition: "color 0.3s",
            }}>
              Yonetici Bilgileri
              <span style={{ flex: 1, height: "1px", background: sectionLabelLineColor, display: "block", transition: "background 0.3s" }} />
            </p>
            <div style={{ display: "grid", gap: "14px", marginBottom: "32px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: labelColor, marginBottom: "7px", transition: "color 0.3s" }}>
                  Ad soyad
                </label>
                <input
                  className={inputFocusClass}
                  type="text"
                  placeholder="Ornek: Emre Ucbudak"
                  style={inputStyle}
                  {...register("adminName")}
                />
                {errors.adminName?.message && <p style={fieldErrorStyle}>{errors.adminName.message}</p>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: labelColor, marginBottom: "7px", transition: "color 0.3s" }}>
                  E-posta
                </label>
                <input
                  className={inputFocusClass}
                  type="email"
                  placeholder="ornek@mail.com"
                  style={inputStyle}
                  {...register("adminEmail")}
                />
                {errors.adminEmail?.message && <p style={fieldErrorStyle}>{errors.adminEmail.message}</p>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: labelColor, marginBottom: "7px", transition: "color 0.3s" }}>
                    Sifre
                  </label>
                  <input
                    className={inputFocusClass}
                    type="password"
                    placeholder="********"
                    style={inputStyle}
                    {...register("password")}
                  />
                  {errors.password?.message && <p style={fieldErrorStyle}>{errors.password.message}</p>}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: labelColor, marginBottom: "7px", transition: "color 0.3s" }}>
                    Sifre tekrar
                  </label>
                  <input
                    className={inputFocusClass}
                    type="password"
                    placeholder="********"
                    style={inputStyle}
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword?.message && <p style={fieldErrorStyle}>{errors.confirmPassword.message}</p>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="tf-btn"
              disabled={isLoading}
              style={{
                background: isLoading
                  ? dark ? "rgba(255,255,255,0.06)" : "rgba(13,27,25,0.08)"
                  : "linear-gradient(135deg, #13ecc8 0%, #0ab89f 100%)",
                color: isLoading
                  ? dark ? "rgba(255,255,255,0.3)" : "rgba(13,27,25,0.3)"
                  : "#0a0f0e",
              }}
            >
              {isLoading ? (
                <>
                  <span style={{
                    width: "16px", height: "16px", borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.15)",
                    borderTopColor: "rgba(255,255,255,0.5)",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                  }} />
                  Olusturuluyor...
                </>
              ) : (
                "Hesabi Olustur"
              )}
            </button>
          </form>

          {errorMessage && (
            <div style={{
              display: "flex", gap: "10px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "12px", padding: "12px 14px", marginTop: "16px",
            }}>
              <svg style={{ flexShrink: 0, marginTop: "1px" }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="#ef4444" strokeWidth="1.5" />
                <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0, lineHeight: 1.55 }}>{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div style={{
              display: "flex", gap: "10px",
              background: "rgba(19,236,200,0.08)",
              border: "1px solid rgba(19,236,200,0.2)",
              borderRadius: "12px", padding: "12px 14px", marginTop: "16px",
            }}>
              <svg style={{ flexShrink: 0, marginTop: "1px" }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="#13ecc8" strokeWidth="1.5" />
                <path d="M5 8l2.5 2.5L11 5.5" stroke="#13ecc8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p style={{ fontSize: "13px", color: "#13ecc8", margin: 0, lineHeight: 1.55 }}>{successMessage}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
