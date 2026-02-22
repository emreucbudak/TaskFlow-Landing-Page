import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { checkoutMessages } from "../shared/errors/messages";

type CheckoutQuery = {
  plan: string;
  price: string;
  period: string;
  slug: string;
  status: string;
};

const readQuery = (): CheckoutQuery => {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  return {
    plan: params.get("plan") ?? "Secili Plan",
    price: params.get("price") ?? "",
    period: params.get("period") ?? "",
    slug: params.get("slug") ?? "",
    status: params.get("status") ?? params.get("payment") ?? "",
  };
};

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, "");

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);
const pendingPlanStorageKey = "taskflow_pending_plan_checkout";

type PendingPlanSelection = {
  planName: string;
  planSlug: string;
  createdAt: number;
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

const getStripePaymentLink = (planSlug: string): string => {
  const env = import.meta.env as Record<string, string | undefined>;
  const staticMap: Record<string, string | undefined> = {
    startup: env.VITE_STRIPE_PAYMENT_LINK_STARTUP,
    business: env.VITE_STRIPE_PAYMENT_LINK_BUSINESS,
    enterprise: env.VITE_STRIPE_PAYMENT_LINK_ENTERPRISE,
  };

  const dynamicKey = `VITE_STRIPE_PAYMENT_LINK_${planSlug.replace(/[^a-z0-9]/gi, "_").toUpperCase()}`;
  const dynamicValue = env[dynamicKey];

  return normalizeBaseUrl(staticMap[planSlug] ?? dynamicValue ?? "");
};

const savePendingPlanSelection = (planName: string, planSlug: string) => {
  if (typeof window === "undefined") return;
  const payload: PendingPlanSelection = {
    planName,
    planSlug,
    createdAt: Date.now(),
  };
  try {
    window.localStorage.setItem(pendingPlanStorageKey, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
};

const readPendingPlanSelection = (): PendingPlanSelection | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(pendingPlanStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingPlanSelection>;
    if (typeof parsed.planName !== "string" || typeof parsed.planSlug !== "string") {
      return null;
    }
    return {
      planName: parsed.planName,
      planSlug: parsed.planSlug,
      createdAt: typeof parsed.createdAt === "number" ? parsed.createdAt : 0,
    };
  } catch {
    return null;
  }
};

const clearPendingPlanSelection = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(pendingPlanStorageKey);
  } catch {
    // ignore storage errors
  }
};

const buildCompanyCreateUrl = (planName: string, planSlug: string) => {
  const params = new URLSearchParams();
  params.set("payment", "success");
  if (planName) params.set("plan", planName);
  if (planSlug) params.set("slug", planSlug);
  return `/company/create?${params.toString()}`;
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: "24px",
  background: "linear-gradient(120deg, #f8fcfb 0%, #eef8f5 45%, #e8f6f2 100%)",
  fontFamily: "'Inter',sans-serif",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "520px",
  background: "#ffffff",
  borderRadius: "20px",
  border: "1px solid rgba(76,154,141,.2)",
  boxShadow: "0 20px 48px rgba(13,27,25,.08)",
  padding: "28px",
};

export default function CheckoutPage() {
  const { plan, price, period, slug, status } = useMemo(() => readQuery(), []);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const displayPrice = `${price}${period}`;

  const statusMessage = useMemo(() => {
    if (status === "success") {
      return checkoutMessages.paymentSuccess;
    }
    if (status === "cancel") {
      return checkoutMessages.paymentCanceled;
    }
    return "";
  }, [status]);

  useEffect(() => {
    if (status !== "success") {
      return;
    }

    const pending = readPendingPlanSelection();
    const resolvedPlan = (plan && plan !== "Secili Plan" ? plan : "") || pending?.planName || "";
    const resolvedSlug = slug || pending?.planSlug || (resolvedPlan ? getPlanSlug(resolvedPlan) : "");

    clearPendingPlanSelection();
    window.location.replace(buildCompanyCreateUrl(resolvedPlan, resolvedSlug));
  }, [status, plan, slug]);

  const handleStripeCheckout = () => {
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage("");
    const planSlug = slug || getPlanSlug(plan);
    const paymentLink = getStripePaymentLink(planSlug);

    if (!isHttpUrl(paymentLink)) {
      setErrorMessage(checkoutMessages.paymentLinkMissing(plan));
      setIsLoading(false);
      return;
    }

    savePendingPlanSelection(plan, planSlug);
    window.location.href = paymentLink;
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <div style={pageStyle}>
        <div style={cardStyle}>
          <p style={{ margin: 0, color: "#4c9a8d", fontWeight: 700, fontSize: "13px", letterSpacing: ".08em" }}>TASKFLOW CHECKOUT</p>
          <h1 style={{ margin: "10px 0 8px", color: "#0d1b19", fontSize: "clamp(1.5rem,3vw,2rem)", lineHeight: 1.2 }}>Odeme Sayfasi</h1>
          <p style={{ margin: 0, color: "rgba(13,27,25,.65)" }}>
            Secilen plan: <strong>{plan}</strong>
          </p>
          {displayPrice && (
            <p style={{ margin: "8px 0 0", color: "rgba(13,27,25,.75)" }}>
              Tutar: <strong>{displayPrice}</strong>
            </p>
          )}

          {statusMessage && (
            <p style={{ margin: "14px 0 0", color: "#065f46", fontSize: "13px" }}>
              {statusMessage}
            </p>
          )}

          <div style={{ marginTop: "24px", display: "grid", gap: "10px" }}>
            <button
              type="button"
              onClick={handleStripeCheckout}
              disabled={isLoading}
              style={{
                height: "48px",
                borderRadius: "12px",
                border: "none",
                fontWeight: 800,
                fontSize: "15px",
                cursor: isLoading ? "not-allowed" : "pointer",
                background: isLoading ? "#d1d5db" : "#13ecc8",
                color: "#0d1b19",
              }}
            >
              {isLoading ? "Yonlendiriliyor..." : "Stripe ile Odeme Yap"}
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              style={{
                height: "44px",
                borderRadius: "12px",
                border: "1px solid rgba(76,154,141,.35)",
                background: "#fff",
                color: "#0d1b19",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Planlara Geri Don
            </button>
          </div>

          {errorMessage && (
            <p style={{ margin: "16px 0 0", fontSize: "13px", color: "#b91c1c" }}>
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
