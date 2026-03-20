import { useEffect, useState } from "react";
import {
  getPlanSlug,
  getApiBaseUrlCandidates,
  buildApiUrl,
  buildPlansUrl,
} from "../shared/utils";
import { parseApiPlans } from "../shared/planParser";
import { saveStripePostCheckoutRedirect, clearStripePostCheckoutRedirect } from "../shared/storage";
import { useDarkMode } from "../shared/components/DarkModeToggle";
import DarkModeToggle from "../shared/components/DarkModeToggle";
import Icon from "../shared/components/Icon";
import { getStripePaymentLink } from "../shared/stripe";
import { ENDPOINTS } from "../shared/endpoints";
import type { StripeCheckoutSessionResponse } from "../shared/types";

import HeroSection from "./landing/HeroSection";
import PricingSection, { fallbackPricingPlans, toPricingPlan, type PricingPlanCard } from "./landing/PricingSection";
import FaqList from "./landing/FaqSection";
import ChatWidget from "./landing/ChatWidget";
import { features, trustedBy } from "./landing/constants";

export default function TaskFlowLanding() {
  const { dark, toggleDark, bg, text, cardBg, border, subText } = useDarkMode(false);
  const [pricingPlans, setPricingPlans] = useState<PricingPlanCard[]>(fallbackPricingPlans);
  const [loadingPlanName, setLoadingPlanName] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState("");

  const isCheckoutLoading = loadingPlanName !== null;
  const queryParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const paymentStatus = queryParams?.get("payment") ?? queryParams?.get("status") ?? "";

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchCompanyPlans = async () => {
      try {
        for (const apiBaseUrl of getApiBaseUrlCandidates()) {
          if (controller.signal.aborted) return;
          try {
            const response = await fetch(buildPlansUrl(apiBaseUrl), { cache: "no-store", signal: controller.signal });
            if (!response.ok) continue;
            const payload: unknown = await response.json();
            const apiPlans = parseApiPlans(payload).sort((a, b) => a.planPrice - b.planPrice).slice(0, 3);
            if (apiPlans.length === 0) continue;
            const planCards = apiPlans.map((plan, index) => toPricingPlan(plan, index));
            const mergedPlans = fallbackPricingPlans.map((fallbackPlan, index) => planCards[index] ?? fallbackPlan);
            const plansWithPopular = mergedPlans.map((plan, index) => ({ ...plan, popular: index === 1 }));
            if (!controller.signal.aborted) setPricingPlans(plansWithPopular);
            return;
          } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return;
            continue;
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Şirket planları alınırken hata oluştu:", error);
      }
    };
    void fetchCompanyPlans();
    return () => { controller.abort(); };
  }, []);

  useEffect(() => {
    if (paymentStatus === "cancel" || paymentStatus === "success") {
      clearStripePostCheckoutRedirect();
    }
  }, [paymentStatus]);

  const handlePlanSelect = async (plan: PricingPlanCard) => {
    if (isCheckoutLoading) return;

    const planSlug = getPlanSlug(plan.name);
    const stripePaymentLink = getStripePaymentLink(planSlug);
    setLoadingPlanName(plan.name);
    setCheckoutError("");

    const successParams = new URLSearchParams();
    successParams.set("payment", "success");
    successParams.set("plan", plan.name);
    successParams.set("slug", planSlug);
    successParams.set("session_id", "{CHECKOUT_SESSION_ID}");
    const successUrl = `${window.location.origin}/subscription/payment-success?${successParams.toString()}`;
    const cancelParams = new URLSearchParams();
    cancelParams.set("payment", "cancel");
    cancelParams.set("plan", plan.name);
    cancelParams.set("slug", planSlug);
    const cancelUrl = `${window.location.origin}/subscription/payment-success?${cancelParams.toString()}`;

    if (stripePaymentLink) {
      saveStripePostCheckoutRedirect(successUrl);
      window.location.assign(stripePaymentLink);
      return;
    }

    let lastError = "Stripe odeme oturumu baslatilamadi. Lutfen tekrar deneyin.";
    for (const apiBaseUrl of getApiBaseUrlCandidates()) {
      try {
        const response = await fetch(buildApiUrl(apiBaseUrl, ENDPOINTS.CREATE_STRIPE_CHECKOUT_SESSION), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planName: plan.name,
            planSlug,
            successUrl,
            cancelUrl,
          }),
        });

        const raw = await response.text();
        const payload = (() => {
          try {
            return JSON.parse(raw) as StripeCheckoutSessionResponse;
          } catch {
            return {} as StripeCheckoutSessionResponse;
          }
        })();

        if (!response.ok) {
          lastError = payload.detail?.trim() || payload.message?.trim() || `Odeme baslatilamadi (HTTP ${response.status}).`;
          continue;
        }

        const checkoutUrl = payload.checkoutUrl ?? payload.CheckoutUrl ?? "";
        if (!checkoutUrl) {
          lastError = "Stripe yonlendirme baglantisi olusturulamadi. Lutfen tekrar deneyin.";
          continue;
        }

        saveStripePostCheckoutRedirect(successUrl);
        window.location.assign(checkoutUrl);
        return;
      } catch {
        lastError = "Sunucuya ulasilamadi. Baglantinizi kontrol edip tekrar deneyin.";
      }
    }

    setCheckoutError(lastError);
    setLoadingPlanName(null);
  };

  return (
    <>
      <div style={{ background: bg, color: text, fontFamily: "'Inter',sans-serif", minHeight: "100vh", overflowX: "hidden", transition: "background .3s,color .3s" }}>

        <DarkModeToggle dark={dark} toggleDark={toggleDark} position="left" />
        <ChatWidget dark={dark} text={text} subText={subText} />

        <nav style={{
          position: "sticky", top: 0, zIndex: 50, width: "100%",
          background: dark ? "rgba(16,34,31,.9)" : "rgba(248,252,251,.9)",
          backdropFilter: "blur(12px)", borderBottom: `1px solid rgba(76,154,141,.1)`,
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src="https://www.logoai.com/uploads/icon/2021/08/06/732ca933-7df8-43e8-b085-69466243c919.png" alt="TaskFlow logo" style={{ width: "26px", height: "26px", objectFit: "contain", display: "block" }} />
              </div>
              <span style={{ fontWeight: 800, fontSize: "18px" }}>TaskFlow</span>
            </div>
          </div>
        </nav>

        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>

          <HeroSection subText={subText} cardBg={cardBg} border={border} text={text} scrollToSection={scrollToSection} />

          <section style={{ padding: "40px 16px", borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, background: dark ? "rgba(26,54,50,.3)" : "rgba(255,255,255,.5)" }}>
            <p style={{ textAlign: "center", fontSize: "11px", fontWeight: 700, color: "#4c9a8d", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "24px" }}>
              Sektör Liderleri Tarafından Onaylandı
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "48px", flexWrap: "wrap", opacity: 0.55, filter: "grayscale(1)" }}>
              {trustedBy.map(c => (
                <div key={c.name} style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "18px" }}>
                  <Icon name={c.icon} /> {c.name}
                </div>
              ))}
            </div>
          </section>

          <section id="features" style={{ padding: "80px 16px" }}>
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 900, margin: "0 0 12px" }}>
                Başarı için ihtiyacınız olan{" "}
                <span style={{ textDecoration: "underline", textDecorationColor: "#13ecc8", textDecorationThickness: "4px", textUnderlineOffset: "4px" }}>her şey.</span>
              </h2>
              <p style={{ color: subText, maxWidth: "520px", margin: "0 auto" }}>
                Modern ve çevik ekipler için tasarlanan temel özelliklerle iş akışınızı sadeleştirin.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "16px" }}>
              {features.map(f => (
                <div key={f.title} style={{ padding: "24px", borderRadius: "16px", border: `1px solid ${border}`, background: cardBg, transition: "box-shadow .3s", boxShadow: "0 2px 10px rgba(13,27,25,.03)" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(19,236,200,.12)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(13,27,25,.03)"}
                >
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(19,236,200,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#13ecc8", marginBottom: "16px", fontSize: "28px" }}>
                    <Icon name={f.icon} />
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: "17px", margin: "0 0 8px" }}>{f.title}</h3>
                  <p style={{ color: subText, fontSize: "14px", lineHeight: 1.6, margin: 0 }}>{f.description}</p>
                </div>
              ))}
            </div>
          </section>

          <PricingSection
            pricingPlans={pricingPlans}
            isCheckoutLoading={isCheckoutLoading}
            loadingPlanName={loadingPlanName}
            checkoutError={checkoutError}
            paymentStatus={paymentStatus}
            onPlanSelect={handlePlanSelect}
            cardBg={cardBg}
            border={border}
            text={text}
            subText={subText}
          />

          <section id="sss" style={{ padding: "80px 16px", borderTop: `1px solid ${border}` }}>
            <div style={{ maxWidth: "720px", margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: "48px" }}>
                <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 900, margin: "0 0 12px" }}>
                  Sıkça Sorulan{" "}
                  <span style={{ textDecoration: "underline", textDecorationColor: "#13ecc8", textDecorationThickness: "4px", textUnderlineOffset: "4px" }}>
                    Sorular
                  </span>
                </h2>
                <p style={{ color: subText }}>Aklınızdaki soruların yanıtlarını burada bulabilirsiniz.</p>
              </div>
              <FaqList cardBg={cardBg} border={border} text={text} subText={subText} />
            </div>
          </section>

          <section style={{ padding: "32px 16px 80px" }}>
            <div style={{ borderRadius: "24px", background: "#0d1b19", padding: "clamp(40px,8vw,80px) 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-64px", right: "-64px", width: "256px", height: "256px", borderRadius: "50%", background: "rgba(19,236,200,.08)", filter: "blur(40px)" }} />
              <div style={{ position: "absolute", bottom: "-64px", left: "-64px", width: "256px", height: "256px", borderRadius: "50%", background: "rgba(76,154,141,.08)", filter: "blur(40px)" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <h2 style={{ color: "#fff", fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 900, margin: "0 0 16px", lineHeight: 1.2 }}>
                  Çalışma şeklinizi dönüştürmeye hazır mısınız?
                </h2>
                <p style={{ color: "#d1d5db", maxWidth: "400px", margin: "0 auto 24px", lineHeight: 1.6 }}>
                  Verimliliği artırmak ve operasyonları sadeleştirmek için TaskFlow kullanan 10.000+ ekibe katılın.
                </p>
                <button type="button" onClick={() => scrollToSection("pricing")} style={{ padding: "0 40px", height: "52px", borderRadius: "12px", border: "none", background: "#13ecc8", color: "#0d1b19", fontWeight: 700, fontSize: "17px", cursor: "pointer", boxShadow: "0 8px 24px rgba(19,236,200,.35)" }}>
                  TaskFlow'u Edinin
                </button>
                <p style={{ color: "#6b7280", fontSize: "12px", marginTop: "12px" }}>Görev organizasyonu için TaskFlow'u edinin</p>
              </div>
            </div>
          </section>

        </div>

        <footer style={{ padding: "24px 16px", borderTop: `1px solid ${dark ? "#1f2937" : "#e5e7eb"}` }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src="https://www.logoai.com/uploads/icon/2021/08/06/732ca933-7df8-43e8-b085-69466243c919.png" alt="TaskFlow logo" style={{ width: "26px", height: "26px", objectFit: "contain", display: "block" }} />
              </div>
              <span>TaskFlow</span>
            </div>
            <span style={{ color: "#9ca3af", fontSize: "13px" }}>© 2026 TaskFlow Inc. Tüm hakları saklıdır.</span>
          </div>
        </footer>

      </div>
    </>
  );
}
