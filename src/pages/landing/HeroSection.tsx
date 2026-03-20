import PhoneMockup from "./PhoneMockup";

type HeroSectionProps = {
  subText: string;
  cardBg: string;
  border: string;
  text: string;
  scrollToSection: (id: string) => void;
};

export default function HeroSection({ subText, cardBg, border, text, scrollToSection }: HeroSectionProps) {
  return (
    <section style={{ display: "flex", flexWrap: "wrap", gap: "32px", padding: "64px 16px 64px 32px", alignItems: "center", justifyContent: "center" }}>
      <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "560px" }}>
        <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.5rem)", fontWeight: 900, lineHeight: 1.1, margin: 0 }}>
          Tek Akış, Kusursuz Düzen.{" "}
          <span style={{ background: "linear-gradient(90deg,#13ecc8,#4c9a8d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            TaskFlow
          </span>
        </h1>
        <p style={{ color: subText, fontSize: "17px", lineHeight: 1.7, maxWidth: "480px", margin: 0 }}>
          Analitik raporlamadan anlık iletişime, görev yönetiminden performans takibine kadar tüm süreçlerinizi tek çatı altında toplayarak verimliliğinizi zirveye taşıyın.
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button type="button" onClick={() => scrollToSection("pricing")} style={{ padding: "0 24px", height: "48px", borderRadius: "12px", border: "none", background: "#13ecc8", color: "#0d1b19", fontWeight: 700, fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 20px rgba(19,236,200,.3)" }}>
            TaskFlow'u Alın
          </button>
          <button type="button" onClick={() => scrollToSection("sss")} style={{ padding: "0 24px", height: "48px", borderRadius: "12px", background: cardBg, border: `1px solid ${border}`, color: text, fontWeight: 700, fontSize: "15px", cursor: "pointer" }}>
            Daha Fazla Bilgi
          </button>
        </div>
      </div>
      <div style={{ flex: "1 1 520px", display: "flex", justifyContent: "center", alignItems: "center", paddingRight: "24px", overflow: "hidden" }}>
        <PhoneMockup />
      </div>
    </section>
  );
}
