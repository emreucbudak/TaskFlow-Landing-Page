import { useMemo, useState, type CSSProperties } from "react";

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
    status: params.get("status") ?? "",
  };
};

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, "");

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

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
    if (status === "cancel") {
      return "Odeme iptal edildi. Istedigin zaman tekrar deneyebilirsin.";
    }
    return "";
  }, [status]);

  const handleStripeCheckout = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage("");
    const planSlug = slug || getPlanSlug(plan);
    const paymentLink = getStripePaymentLink(planSlug);

    if (!isHttpUrl(paymentLink)) {
      setErrorMessage(`"${plan}" plani icin Stripe Payment Link tanimli degil.`);
      setIsLoading(false);
      return;
    }

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
