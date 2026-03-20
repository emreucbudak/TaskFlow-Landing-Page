import { formatPlanPrice } from "../../shared/utils";
import type { ApiCompanyPlan } from "../../shared/types";
import { PLAN_SELECT_CTA, planDescriptions, fixMojibakeText } from "./constants";

export type PricingPlanCard = {
  name: string;
  amount: number;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
};

export const fallbackPricingPlans: PricingPlanCard[] = [
  {
    name: "Start-up",
    amount: 500,
    price: "₺500",
    period: "/ay",
    description: "Yeni başlayan küçük ekipler için ideal.",
    features: ["5 kullanıcıya kadar", "1 takım limiti", "100 bireysel görev limiti", "İç raporlama dahil"],
    cta: PLAN_SELECT_CTA,
    popular: false,
  },
  {
    name: "Business",
    amount: 1000,
    price: "₺1.000",
    period: "/ay",
    description: "Daha fazla güce ihtiyaç duyan büyüyen ekipler için.",
    features: ["25 kullanıcıya kadar", "5 takım limiti", "1000 bireysel görev limiti", "İç raporlama dahil"],
    cta: PLAN_SELECT_CTA,
    popular: true,
  },
  {
    name: "Enterprise",
    amount: 1500,
    price: "₺1.500",
    period: "/ay",
    description: "Büyük kuruluşlar için özelleştirilmiş çözümler.",
    features: ["1000 kullanıcıya kadar", "50 takım limiti", "10000 bireysel görev limiti", "İç raporlama dahil"],
    cta: PLAN_SELECT_CTA,
    popular: false,
  },
];

export const toPricingPlan = (plan: ApiCompanyPlan, index: number): PricingPlanCard => ({
  name: plan.planName,
  amount: plan.planPrice,
  price: plan.planPrice <= 0 ? "Ücretsiz" : formatPlanPrice(plan.planPrice),
  period: plan.planPrice <= 0 ? undefined : "/ay",
  description: planDescriptions[Math.min(index, planDescriptions.length - 1)],
  features: plan.planProperties
    ? [
        `${plan.planProperties.peopleAddedLimit} kullanıcıya kadar`,
        `${plan.planProperties.teamLimit} takım limiti`,
        `${plan.planProperties.individualTaskLimit} bireysel görev limiti`,
        plan.planProperties.isInternalReportingEnabled ? "İç raporlama dahil" : "İç raporlama yok",
      ]
    : [],
  cta: PLAN_SELECT_CTA,
  popular: false,
});

type PricingSectionProps = {
  pricingPlans: PricingPlanCard[];
  isCheckoutLoading: boolean;
  loadingPlanName: string | null;
  checkoutError: string;
  paymentStatus: string;
  onPlanSelect: (plan: PricingPlanCard) => void;
  cardBg: string;
  border: string;
  text: string;
  subText: string;
};

export default function PricingSection({
  pricingPlans,
  isCheckoutLoading,
  loadingPlanName,
  checkoutError,
  paymentStatus,
  onPlanSelect,
  cardBg,
  border,
  text,
  subText,
}: PricingSectionProps) {
  return (
    <section id="pricing" style={{ padding: "80px 16px", borderTop: `1px solid ${border}`, background: "inherit" }}>
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 900, margin: "0 0 12px" }}>Fiyat Planları</h2>
        <p style={{ color: subText }}>Ekibinizin büyüklüğüne ve ihtiyaçlarına en uygun planı seçin.</p>
        {paymentStatus === "cancel" && !checkoutError && (
          <p style={{ margin: "14px 0 0", color: "#92400e", fontSize: "13px" }}>
            Odeme iptal edildi. Dilediginiz zaman tekrar deneyebilirsiniz.
          </p>
        )}
        {checkoutError && (
          <p style={{ margin: "14px 0 0", color: "#b91c1c", fontSize: "13px" }}>{checkoutError}</p>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "24px", maxWidth: "960px", margin: "0 auto" }}>
        {pricingPlans.map((plan) => (
          <div key={plan.name} style={{
            padding: "32px", borderRadius: "16px", position: "relative", overflow: "hidden",
            display: "flex", flexDirection: "column",
            background: plan.popular ? "#0d1b19" : cardBg,
            border: plan.popular ? "2px solid #13ecc8" : `1px solid ${border}`,
            transform: plan.popular ? "translateY(-12px)" : "none",
            boxShadow: plan.popular ? "0 8px 32px rgba(19,236,200,.2)" : "0 2px 10px rgba(13,27,25,.03)",
          }}>
            {plan.popular && (
              <div style={{ position: "absolute", top: 0, right: 0, background: "#13ecc8", color: "#0d1b19", fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderBottomLeftRadius: "12px" }}>POPÜLER</div>
            )}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontWeight: 700, fontSize: "17px", color: plan.popular ? "#fff" : text, margin: "0 0 12px" }}>{fixMojibakeText(plan.name)}</h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "2.4rem", fontWeight: 900, color: plan.popular ? "#fff" : text }}>{fixMojibakeText(plan.price)}</span>
                {plan.period && <span style={{ color: "#9ca3af" }}>{fixMojibakeText(plan.period)}</span>}
              </div>
              <p style={{ color: plan.popular ? "#d1d5db" : subText, fontSize: "13px", margin: "8px 0 0" }}>{fixMojibakeText(plan.description)}</p>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              {plan.features.map(feat => (
                <div key={feat} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ color: "#13ecc8", fontSize: "20px", lineHeight: 1, fontWeight: 700 }} aria-hidden>
                    ✓
                  </span>
                  <span style={{ fontSize: "14px", color: plan.popular ? "#fff" : text }}>{fixMojibakeText(feat)}</span>
                </div>
              ))}
            </div>
            <button type="button" disabled={isCheckoutLoading} onClick={() => onPlanSelect(plan)} style={{
              width: "100%", padding: "12px", borderRadius: "12px", fontWeight: 700, fontSize: "15px",
              cursor: isCheckoutLoading ? "not-allowed" : "pointer",
              background: plan.popular ? "#13ecc8" : "transparent",
              color: plan.popular ? "#0d1b19" : text,
              border: plan.popular ? "none" : `1px solid rgba(76,154,141,.3)`,
              boxShadow: plan.popular ? "0 4px 16px rgba(19,236,200,.25)" : "none",
              opacity: isCheckoutLoading && loadingPlanName !== plan.name ? 0.6 : 1,
            }}>
              {fixMojibakeText(plan.cta)}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
