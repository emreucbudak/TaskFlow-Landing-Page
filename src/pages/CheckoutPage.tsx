import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { checkoutMessages } from "../shared/errors/messages";
import {
  getPlanSlug,
} from "../shared/utils";
import {
  readPendingPlanSelection,
  clearPendingPlanSelection,
  savePendingPlanSelection,
} from "../shared/storage";
import { getStripePaymentLink, buildPaymentSuccessUrl } from "../shared/stripe";

type CheckoutQuery = {
  plan: string;
  price: string;
  period: string;
  slug: string;
  status: string;
  companyId: string;
  sessionId: string;
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
    companyId: params.get("companyId") ?? "",
    sessionId: params.get("session_id") ?? params.get("sessionId") ?? "",
  };
};

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

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
  const { plan, price, period, slug, status, companyId, sessionId } = useMemo(() => readQuery(), []);
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
    window.location.replace(buildPaymentSuccessUrl(resolvedPlan, resolvedSlug, companyId, sessionId));
  }, [status, plan, slug, companyId, sessionId]);

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
  );
}
