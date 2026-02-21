import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, type CSSProperties } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { extractApiError, parsePayload } from "../shared/errors/api";
import { toFriendlyLoginError } from "../shared/errors/mappers";
import { loginErrorMessages, validationMessages } from "../shared/errors/messages";

type LoginResponse = {
  accessToken?: string;
  refreshToken?: string;
  AccessToken?: string;
  RefreshToken?: string;
  message?: string;
  detail?: string;
  title?: string;
  errors?: Record<string, string[]>;
};

const loginSchema = z.object({
  email: z.string().trim().min(1, validationMessages.requiredEmail).email(validationMessages.invalidEmail),
  password: z.string().min(1, validationMessages.requiredPassword),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, "");

const getApiBaseUrlCandidates = (): string[] => {
  const envBaseUrl = (import.meta.env.VITE_TASKFLOW_API_URL as string | undefined)?.trim() ?? "";
  return [envBaseUrl, "http://localhost:8080", "http://localhost:5172", "https://localhost:7243", "https://localhost:8081"]
    .map((url) => normalizeBaseUrl(url))
    .filter((url, index, arr) => Boolean(url) && arr.indexOf(url) === index);
};

const getToken = (payload: LoginResponse, type: "access" | "refresh") =>
  type === "access"
    ? payload.accessToken ?? payload.AccessToken ?? ""
    : payload.refreshToken ?? payload.RefreshToken ?? "";

const stripePostCheckoutRedirectStorageKey = "taskflow_stripe_post_checkout_redirect";

type StripePostCheckoutRedirect = {
  returnUrl: string;
  createdAt: number;
};

const readStripePostCheckoutRedirect = (): StripePostCheckoutRedirect | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(stripePostCheckoutRedirectStorageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StripePostCheckoutRedirect>;
    const returnUrl = typeof parsed.returnUrl === "string" ? parsed.returnUrl.trim() : "";
    const createdAt = typeof parsed.createdAt === "number" ? parsed.createdAt : 0;
    if (!returnUrl || createdAt <= 0) return null;

    if (returnUrl.startsWith("/")) {
      return { returnUrl, createdAt };
    }

    if (returnUrl.startsWith(window.location.origin)) {
      const relativeReturnUrl = returnUrl.slice(window.location.origin.length);
      if (relativeReturnUrl.startsWith("/")) {
        return { returnUrl: relativeReturnUrl, createdAt };
      }
    }

    return null;
  } catch {
    return null;
  }
};

const clearStripePostCheckoutRedirect = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(stripePostCheckoutRedirectStorageKey);
  } catch {
    // localStorage read/write might be blocked
  }
};

const isLikelyStripeReferrer = () => {
  if (typeof document === "undefined") return false;
  const referrer = document.referrer?.trim();
  if (!referrer) return false;

  try {
    const host = new URL(referrer).hostname.toLowerCase();
    return host === "stripe.com" || host.endsWith(".stripe.com");
  } catch {
    return false;
  }
};

type IconProps = { name: string; style?: CSSProperties };
const Icon = ({ name, style }: IconProps) => (
  <span style={{ fontFamily: "'Material Symbols Outlined'", ...style }}>{name}</span>
);

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

export default function LoginPage() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const pendingRedirect = readStripePostCheckoutRedirect();
    if (!pendingRedirect) return;

    const maxAgeMs = 1000 * 60 * 120;
    if (Date.now() - pendingRedirect.createdAt > maxAgeMs) {
      clearStripePostCheckoutRedirect();
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const hasStripeQuerySignal =
      params.has("payment") ||
      params.has("status") ||
      params.has("session_id") ||
      params.has("checkout_session_id") ||
      params.has("redirect_status");

    if (!hasStripeQuerySignal && !isLikelyStripeReferrer()) return;

    clearStripePostCheckoutRedirect();
    window.location.replace(pendingRedirect.returnUrl);
  }, []);

  const handleLogin = async ({ email, password }: LoginFormValues) => {
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    let lastError: string = loginErrorMessages.genericActionFailed;
    let hasAnyNetworkError = false;
    let hasAnyReachableResponse = false;

    for (const apiBaseUrl of getApiBaseUrlCandidates()) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/Identity/LoginCommandRequest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        hasAnyReachableResponse = true;

        const raw = await response.text();
        const payload = parsePayload<LoginResponse>(raw);

        if (!response.ok) {
          const friendlyError = toFriendlyLoginError(
            extractApiError({
              payload,
              raw,
              statusCode: response.status,
              statusCodeMap: {
                401: "unauthorized",
                404: "user not found",
                429: "too many requests",
              },
            })
          );
          if (response.status < 500) {
            setErrorMessage(friendlyError);
            setIsLoading(false);
            return;
          }
          lastError = friendlyError;
          continue;
        }

        const accessToken = getToken(payload, "access");
        const refreshToken = getToken(payload, "refresh");

        if (!accessToken || !refreshToken) {
          lastError = loginErrorMessages.tokenValidationFailed;
          continue;
        }

        window.localStorage.setItem("taskflow_access_token", accessToken);
        window.localStorage.setItem("taskflow_refresh_token", refreshToken);
        setSuccessMessage("Giris basarili. Workspace sayfasina yonlendiriliyorsun.");
        setTimeout(() => {
          navigate("/workspace", { replace: true });
        }, 900);
        return;
      } catch (error) {
        hasAnyNetworkError = true;
        if (!hasAnyReachableResponse) {
          if (error instanceof Error && error.message) {
            lastError = toFriendlyLoginError(error.message);
          } else {
            lastError = loginErrorMessages.networkUnavailable;
          }
        }
      }
    }

    if (hasAnyNetworkError && !hasAnyReachableResponse) {
      setErrorMessage(loginErrorMessages.networkUnavailable);
      setIsLoading(false);
      return;
    }

    setErrorMessage(toFriendlyLoginError(lastError));
    setIsLoading(false);
  };

  const bg = dark ? "#0a0f0e" : "#f0faf8";
  const cardBg = dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.85)";
  const cardBorder = dark ? "rgba(19,236,200,0.15)" : "rgba(19,236,200,0.3)";
  const cardShadow = dark
    ? "0 0 80px rgba(19,236,200,0.06), inset 0 1px 0 rgba(255,255,255,0.06)"
    : "0 0 80px rgba(19,236,200,0.1), 0 8px 32px rgba(13,27,25,0.08)";
  const inputBg = dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)";
  const inputBorder = dark ? "rgba(255,255,255,0.1)" : "rgba(19,236,200,0.25)";
  const inputColor = dark ? "#e8f6f2" : "#0d1b19";
  const labelColor = dark ? "rgba(255,255,255,0.35)" : "rgba(13,27,25,0.45)";
  const headingColor = dark ? "#e8f6f2" : "#0d1b19";
  const subColor = dark ? "rgba(255,255,255,0.35)" : "rgba(13,27,25,0.5)";
  const logoTextColor = dark ? "#e8f6f2" : "#0d1b19";

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

  const cardStyle: CSSProperties = {
    width: "100%",
    maxWidth: "440px",
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
    height: "52px",
    borderRadius: "12px",
    border: `1px solid ${inputBorder}`,
    padding: "0 16px",
    fontSize: "14px",
    outline: "none",
    background: inputBg,
    color: inputColor,
    width: "100%",
    boxSizing: "border-box",
    letterSpacing: "0.01em",
    transition: "border-color 0.2s, background 0.2s",
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
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .tf-card { animation: fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) both; }
        .tf-input-dark:focus {
          border-color: rgba(19,236,200,0.55) !important;
          background: rgba(19,236,200,0.04) !important;
        }
        .tf-input-light:focus {
          border-color: rgba(19,236,200,0.7) !important;
          background: rgba(19,236,200,0.05) !important;
        }
        .tf-input-dark::placeholder { color: rgba(255,255,255,0.25); }
        .tf-input-light::placeholder { color: rgba(13,27,25,0.3); }
        .tf-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(19,236,200,0.35);
        }
        .tf-btn { transition: transform 0.15s, box-shadow 0.15s; }
        .tf-toggle:hover { opacity: 0.85; }
        .tf-toggle { transition: background 0.2s, color 0.2s; }
      `}</style>

      <button
        className="tf-toggle"
        onClick={() => setDark(!dark)}
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

        <div className="tf-card" style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "36px" }}>
            <img
              src="https://www.logoai.com/uploads/icon/2021/08/06/732ca933-7df8-43e8-b085-69466243c919.png"
              alt="TaskFlow logo"
              style={{ width: "36px", height: "36px", objectFit: "contain", display: "block" }}
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
              fontSize: "clamp(1.6rem, 3vw, 2rem)",
              color: headingColor,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              transition: "color 0.3s",
            }}>
              Hos geldin.
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: subColor, lineHeight: 1.5, transition: "color 0.3s" }}>
              Devam etmek icin hesabina giris yap.
            </p>
          </div>

          <form
            style={{ display: "grid", gap: "16px" }}
            onSubmit={handleSubmit((values) => {
              void handleLogin(values);
            })}
          >
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: labelColor, marginBottom: "7px", transition: "color 0.3s" }}>
                E-posta
              </label>
              <input
                className={dark ? "tf-input-dark" : "tf-input-light"}
                type="email"
                placeholder="ornek@sirket.com"
                style={inputStyle}
                autoComplete="email"
                {...register("email")}
              />
              {errors.email?.message && <p style={fieldErrorStyle}>{errors.email.message}</p>}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: labelColor, marginBottom: "7px", transition: "color 0.3s" }}>
                Sifre
              </label>
              <input
                className={dark ? "tf-input-dark" : "tf-input-light"}
                type="password"
                placeholder="********"
                style={inputStyle}
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password?.message && <p style={fieldErrorStyle}>{errors.password.message}</p>}
            </div>

            <button
              className="tf-btn"
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: "8px",
                height: "52px",
                borderRadius: "12px",
                border: "none",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                letterSpacing: "0.03em",
                cursor: isLoading ? "not-allowed" : "pointer",
                background: isLoading
                  ? dark ? "rgba(255,255,255,0.06)" : "rgba(13,27,25,0.08)"
                  : "linear-gradient(135deg, #13ecc8 0%, #0ab89f 100%)",
                color: isLoading
                  ? dark ? "rgba(255,255,255,0.3)" : "rgba(13,27,25,0.3)"
                  : "#0a0f0e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
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
                  Giris Yapiliyor...
                </>
              ) : (
                "Giris Yap "
              )}
            </button>
          </form>

          {errorMessage && (
            <div style={{
              marginTop: "20px", padding: "12px 14px", borderRadius: "10px",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              fontSize: "13px", color: "#fca5a5", lineHeight: 1.5,
            }}>
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div style={{
              marginTop: "20px", padding: "12px 14px", borderRadius: "10px",
              background: "rgba(19,236,200,0.08)", border: "1px solid rgba(19,236,200,0.2)",
              fontSize: "13px", color: "#13ecc8", lineHeight: 1.5,
            }}>
              {successMessage}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
