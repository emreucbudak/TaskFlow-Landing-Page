import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { extractApiError, parsePayload, type ApiErrorPayload } from "../shared/errors/api";
import { toFriendlyCompanyCreateError } from "../shared/errors/mappers";
import { companyCreateErrorMessages } from "../shared/errors/messages";

type PaymentQuery = {
  payment: string;
  companyId: string;
  plan: string;
  slug: string;
  sessionId: string;
};

const guidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, "");
const normalizeDesktopBaseUrl = (value: string) => value.trim().replace(/\/+$/, "");

const getApiBaseUrlCandidates = (): string[] => {
  const envBaseUrl = (import.meta.env.VITE_TASKFLOW_API_URL as string | undefined)?.trim() ?? "";
  return ["", envBaseUrl, "http://localhost:8080", "http://localhost:5172", "https://localhost:7243", "https://localhost:8081"]
    .map((url) => normalizeBaseUrl(url))
    .filter((url, index, arr) => arr.indexOf(url) === index);
};

const buildApiUrl = (baseUrl: string, endpointPath: string) =>
  baseUrl ? `${baseUrl}${endpointPath}` : endpointPath;

const getDesktopAppBaseUrl = () => {
  const configured = (import.meta.env.VITE_DESKTOP_APP_RETURN_URL as string | undefined)?.trim() ?? "";
  if (!configured) {
    return "taskflowapp://payment-success";
  }

  if (configured.includes("://")) {
    return normalizeDesktopBaseUrl(configured);
  }

  const normalizedScheme = configured.replace(/:$/, "").trim();
  return `${normalizedScheme}://payment-success`;
};

const normalizePlanText = (value: string) =>
  value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getPlanSlug = (planName: string) => {
  const normalized = normalizePlanText(planName);
  if (/(start|startup|baslangic)/.test(normalized)) return "startup";
  if (/(business|profesyonel)/.test(normalized)) return "business";
  if (/(enterprise|kurumsal)/.test(normalized)) return "enterprise";
  return normalized.replace(/\s+/g, "-");
};

const readQuery = (): PaymentQuery => {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  const companyId = params.get("companyId") ?? params.get("utm_content") ?? "";
  return {
    payment: params.get("payment") ?? params.get("status") ?? "",
    companyId,
    plan: params.get("plan") ?? "",
    slug: params.get("slug") ?? "",
    sessionId: params.get("session_id") ?? params.get("sessionId") ?? "",
  };
};

export default function PlanPaymentSuccessPage() {
  const query = useMemo(() => readQuery(), []);
  const activationStartedRef = useRef(false);
  const appOpenAttemptedRef = useRef(false);

  const [dark, setDark] = useState(false);
  const [didAttemptOpenApp, setDidAttemptOpenApp] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const normalizedPaymentStatus = query.payment.trim().toLowerCase();
  const isPaymentSuccess = normalizedPaymentStatus === "success";
  const isPaymentCancel = normalizedPaymentStatus === "cancel";
  const companyId = query.companyId.trim();
  const planName = query.plan.trim();
  const planSlug = query.slug.trim() || (planName ? getPlanSlug(planName) : "");
  const sessionId = query.sessionId.trim();
  const hasValidCompanyId = guidRegex.test(companyId);
  const hasActivationPayload = Boolean(sessionId) && Boolean(planName || planSlug);

  const displayPlanName = useMemo(() => {
    if (planName) {
      return planName;
    }

    const normalizedSlug = planSlug.trim().toLowerCase();
    if (normalizedSlug === "startup") return "Start-up";
    if (normalizedSlug === "business") return "Business";
    if (normalizedSlug === "enterprise") return "Enterprise";
    return planSlug || "seçili";
  }, [planName, planSlug]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mediaQuery.matches);

    const onThemeChange = (event: MediaQueryListEvent) => {
      setDark(event.matches);
    };

    mediaQuery.addEventListener("change", onThemeChange);
    return () => mediaQuery.removeEventListener("change", onThemeChange);
  }, []);

  const desktopAppReturnUrl = useMemo(() => {
    const base = getDesktopAppBaseUrl();
    const params = new URLSearchParams();
    params.set("source", "stripe");
    params.set("payment", isPaymentSuccess ? "success" : isPaymentCancel ? "cancel" : normalizedPaymentStatus || "unknown");
    if (companyId) params.set("companyId", companyId);
    if (planName) params.set("plan", planName);
    if (planSlug) params.set("slug", planSlug);
    if (sessionId) params.set("session_id", sessionId);

    const queryText = params.toString();
    if (!queryText) {
      return base;
    }

    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}${queryText}`;
  }, [companyId, isPaymentCancel, isPaymentSuccess, normalizedPaymentStatus, planName, planSlug, sessionId]);

  const tryOpenDesktopApp = (forceManualNavigation: boolean) => {
    if (typeof window === "undefined") {
      return;
    }

    if (!forceManualNavigation && appOpenAttemptedRef.current) {
      return;
    }

    appOpenAttemptedRef.current = true;
    setDidAttemptOpenApp(true);

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = desktopAppReturnUrl;
    document.body.appendChild(iframe);
    window.setTimeout(() => {
      iframe.remove();
    }, 1800);

    if (forceManualNavigation) {
      window.location.href = desktopAppReturnUrl;
      return;
    }

    window.setTimeout(() => {
      window.location.href = desktopAppReturnUrl;
    }, 300);
  };

  useEffect(() => {
    if (!isPaymentSuccess || activationStartedRef.current) {
      return;
    }

    activationStartedRef.current = true;
    setErrorMessage("");

    if (!hasActivationPayload) {
      tryOpenDesktopApp(false);
      if (!sessionId || (!planName && !planSlug)) {
        setErrorMessage("Plan doğrulaması için gerekli parametreler eksik. Uygulamaya dönüp aboneliği kontrol edin.");
      }
      return;
    }

    let isCancelled = false;
    const activateSubscriptionPath = "/api/Tenant/ConfirmStripePaymentAndActivateRequest";

    const run = async () => {
      let lastError: string = companyCreateErrorMessages.subscriptionActivationFailed;

      for (const apiBaseUrl of getApiBaseUrlCandidates()) {
        try {
          const response = await fetch(buildApiUrl(apiBaseUrl, activateSubscriptionPath), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              companyId: hasValidCompanyId ? companyId : undefined,
              planName: planName || undefined,
              planSlug: planSlug || undefined,
              sessionId,
            }),
          });

          const raw = await response.text();
          const payload = parsePayload<ApiErrorPayload>(raw);

          if (!response.ok) {
            const activationError = extractApiError({
              payload,
              raw,
              statusCode: response.status,
              fallback: companyCreateErrorMessages.subscriptionActivationFailed,
              statusCodeMap: {
                401: "unauthorized",
                404: "resource not found",
                409: "already exists",
                429: "too many requests",
              },
            });
            const friendlyError = toFriendlyCompanyCreateError(activationError);
            if (response.status < 500) {
              if (!isCancelled) {
                setErrorMessage(friendlyError);
              }
              return;
            }

            lastError = friendlyError;
            continue;
          }

          if (!isCancelled) {
            tryOpenDesktopApp(false);
          }
          return;
        } catch (error) {
          if (error instanceof Error && error.message) {
            lastError = toFriendlyCompanyCreateError(error.message);
          } else {
            lastError = companyCreateErrorMessages.networkUnavailable;
          }
        }
      }

      if (!isCancelled) {
        setErrorMessage(lastError);
      }
    };

    run();

    return () => {
      isCancelled = true;
    };
  }, [
    companyId,
    hasActivationPayload,
    hasValidCompanyId,
    isPaymentSuccess,
    planName,
    planSlug,
    sessionId,
  ]);

  const infoText = isPaymentCancel
    ? "Ödeme iptal edildi. Uygulamaya dönebilirsiniz."
    : isPaymentSuccess
      ? `Ödeme Başarılı! Planınızı ${displayPlanName} planıyla başarıyla değiştirdiniz.`
      : "Ödeme durumu doğrulanamadı.";

  const showReturnButton = isPaymentSuccess || isPaymentCancel;

  const bg = dark ? "#10221f" : "#f8fcfb";
  const text = dark ? "#f3f4f6" : "#0d1b19";
  const subText = dark ? "#9ca3af" : "rgba(13,27,25,.72)";
  const cardBg = dark ? "#1a3632" : "#ffffff";
  const border = dark ? "rgba(76,154,141,.35)" : "rgba(76,154,141,.22)";

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    background: bg,
    color: text,
    fontFamily: "'Inter',sans-serif",
    transition: "background .3s,color .3s",
  };

  const cardStyle: CSSProperties = {
    width: "100%",
    maxWidth: "680px",
    background: cardBg,
    borderRadius: "22px",
    border: `1px solid ${border}`,
    boxShadow: dark ? "0 24px 54px rgba(0,0,0,.32)" : "0 20px 48px rgba(13,27,25,.09)",
    padding: "38px 34px",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      <div style={pageStyle}>
        <button
          type="button"
          onClick={() => setDark(!dark)}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 999,
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,.3)",
            background: dark ? "#13ecc8" : "#0d1b19",
            color: dark ? "#0d1b19" : "#ffffff",
          }}
          aria-label={dark ? "Açık moda geç" : "Koyu moda geç"}
        >
          <span className="material-symbols-outlined" style={{ fontFamily: "'Material Symbols Outlined'" }}>
            {dark ? "light_mode" : "dark_mode"}
          </span>
        </button>

        <div style={cardStyle}>
          <h1 style={{ margin: "0 0 12px", color: text, fontSize: "clamp(1.65rem,3.2vw,2.2rem)", lineHeight: 1.2 }}>
            Ödeme Başarılı!
          </h1>

          <p style={{ margin: "0 0 2px", color: subText, lineHeight: 1.6, fontSize: "15px" }}>
            {infoText}
          </p>

          <div style={{ marginTop: "18px", display: "grid", gap: "10px" }}>
            {showReturnButton && (
              <button
                type="button"
                onClick={() => tryOpenDesktopApp(true)}
                style={{
                  height: "50px",
                  borderRadius: "12px",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "15px",
                  cursor: "pointer",
                  background: "#13ecc8",
                  color: "#0d1b19",
                  boxShadow: "0 6px 20px rgba(19,236,200,.28)",
                }}
              >
                Uygulamaya Dön
              </button>
            )}
          </div>

          {errorMessage && (
            <p style={{ margin: "16px 0 0", fontSize: "13px", color: "#b91c1c" }}>
              {errorMessage}
            </p>
          )}

          {showReturnButton && didAttemptOpenApp && (
            <p style={{ margin: "10px 0 0", fontSize: "12px", color: subText }}>
              Uygulama otomatik açılmadıysa "Uygulamaya Dön" butonuna tıklayın.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
