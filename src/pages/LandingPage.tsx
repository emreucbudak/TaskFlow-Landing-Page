import { useState, type CSSProperties } from "react";

const features = [
  {
    icon: "bar_chart",
    title: "Gelişmiş Raporlama",
    description: "Gerçek zamanlı analizler ve özel raporlarla ekibinizin performansını tam görünürlükle takip edin.",
  },
  {
    icon: "forum",
    title: "Güvenli Sohbet",
    description: "Ekibinizin anlık ve güvenli şekilde iletişim kurması için şifreli dahili mesajlaşma.",
  },
  {
    icon: "check_box",
    title: "Görev Yönetimi",
    description: "Sezgisel sürükle-bırak arayüzüyle görevleri atayın, takip edin ve verimli şekilde tamamlayın.",
  },
];

const pricingPlans = [
  {
    name: "Başlangıç",
    price: "Ücretsiz",
    description: "Yeni başlayan küçük ekipler için ideal.",
    features: ["5 kullanıcıya kadar", "2GB Storage", "Temel Destek", "Topluluk Erişimi"],
    cta: "Hemen Başla",
    popular: false,
  },
  {
    name: "Profesyonel",
    price: "$29",
    period: "/ay",
    description: "Daha fazla güce ihtiyaç duyan büyüyen ekipler için.",
    features: ["20 kullanıcıya kadar", "50GB Depolama", "Öncelikli Destek", "Gelişmiş Analitik"],
    cta: "Try Profesyonel",
    popular: true,
  },
  {
    name: "Kurumsal",
    price: "Özel",
    description: "Büyük kuruluşlar için özelleştirilmiş çözümler.",
    features: ["Sınırsız kullanıcı", "Sınırsız Depolama", "7/24 Özel Destek", "SSO ve Gelişmiş Güvenlik"],
    cta: "Satış ile Görüş",
    popular: false,
  },
];

const trustedBy = [
  { icon: "change_history", name: "ACME Corp" },
  { icon: "diamond", name: "GlobalTech" },
  { icon: "bolt", name: "FutureFinance" },
  { icon: "waves", name: "WavePoint" },
  { icon: "public", name: "Nexus" },
];

type IconProps = {
  name: string;
  className?: string;
  style?: CSSProperties;
};

const Icon = ({ name, className = "", style }: IconProps) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontFamily: "'Material Symbols Outlined'", ...style }}
  >
    {name}
  </span>
);

const PhoneMockup = () => (
  <div style={{
    position: "relative",
    width: "260px",
    aspectRatio: "9/19",
    background: "#0d1b19",
    borderRadius: "2.5rem",
    padding: "12px",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
    border: "4px solid #1a3632",
    overflow: "hidden",
    transform: "rotate(2deg)",
    transition: "transform 0.5s",
    flexShrink: 0,
  }}
    onMouseEnter={e => e.currentTarget.style.transform = "rotate(0deg)"}
    onMouseLeave={e => e.currentTarget.style.transform = "rotate(2deg)"}
  >
    {/* Notch */}
    <div style={{
      position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
      height: "24px", width: "128px", background: "#000",
      borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px", zIndex: 20,
    }} />
    <div style={{
      width: "100%", height: "100%", background: "#f8fcfb",
      borderRadius: "2rem", overflow: "hidden", display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        padding: "40px 20px 16px", display: "flex", justifyContent: "space-between",
        alignItems: "center", background: "#fff", borderBottom: "1px solid #f3f4f6",
      }}>
        <div>
          <div style={{ fontSize: "11px", color: "#9ca3af" }}>Tekrar hoş geldin</div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0d1b19" }}>Alex Morgan</div>
        </div>
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%",
          backgroundImage: "url('https://i.pravatar.cc/32?img=47')",
          backgroundSize: "cover",
        }} />
      </div>
      {/* Body */}
      <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "12px", overflow: "hidden" }}>
        {/* Stats */}
        <div style={{ background: "linear-gradient(135deg,rgba(19,236,200,.2),rgba(76,154,141,.1))", padding: "16px", borderRadius: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#4c9a8d" }}>Haftalık Görevler</span>
            <Icon name="trending_up" className="" style={{ color: "#13ecc8", fontSize: "18px" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#0d1b19" }}>84%</div>
          <div style={{ background: "rgba(255,255,255,.5)", height: "6px", borderRadius: "9999px", marginTop: "8px", overflow: "hidden" }}>
            <div style={{ background: "#13ecc8", height: "100%", width: "84%", borderRadius: "9999px" }} />
          </div>
        </div>
        {/* Projects */}
        <div style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em" }}>Aktif Projeler</div>
        {[
          { icon: "description", bg: "#dbeafe", color: "#2563eb", title: "Q3 Raporu", sub: "Yarın Teslim", dot: "#f87171" },
          { icon: "forum", bg: "#f3e8ff", color: "#9333ea", title: "Ekip Senkronu", sub: "2 dk önce başladı", dot: "#4ade80" },
        ].map(item => (
          <div key={item.title} style={{
            display: "flex", alignItems: "center", padding: "10px 12px",
            background: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,.05)",
            border: "1px solid #f9fafb",
          }}>
            <div style={{ padding: "6px", borderRadius: "8px", background: item.bg, color: item.color, marginRight: "10px", display: "flex" }}>
              <Icon name={item.icon} className="" style={{ fontSize: "16px" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#0d1b19" }}>{item.title}</div>
              <div style={{ fontSize: "10px", color: "#9ca3af" }}>{item.sub}</div>
            </div>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.dot }} />
          </div>
        ))}
        {/* Mini chart */}
        <div style={{
          height: "72px", background: "#fff", borderRadius: "12px",
          border: "1px solid #f9fafb", display: "flex", alignItems: "flex-end",
          justifyContent: "space-between", padding: "8px 12px 8px",
        }}>
          {[40, 60, 80, 50, 70].map((h, i) => (
            <div key={i} style={{
              width: "14%", borderRadius: "3px 3px 0 0",
              height: `${h}%`, background: `rgba(19,236,200,${0.3 + i * 0.12})`,
            }} />
          ))}
        </div>
      </div>
      {/* Bottom nav */}
      <div style={{
        height: "56px", background: "#fff", borderTop: "1px solid #f3f4f6",
        display: "flex", justifyContent: "space-around", alignItems: "center", padding: "0 8px",
      }}>
        {[
          { icon: "home", active: true },
          { icon: "chat", active: false },
          { icon: "add", fab: true },
          { icon: "calendar_month", active: false },
          { icon: "settings", active: false },
        ].map((item, i) => item.fab ? (
          <div key={i} style={{
            background: "#0d1b19", borderRadius: "50%", padding: "8px",
            marginTop: "-24px", boxShadow: "0 4px 12px rgba(0,0,0,.3)", display: "flex",
          }}>
            <Icon name={item.icon} className="" style={{ color: "#fff", fontSize: "20px" }} />
          </div>
        ) : (
          <Icon key={i} name={item.icon} className="" style={{ color: item.active ? "#13ecc8" : "#d1d5db", fontSize: "24px" }} />
        ))}
      </div>
    </div>
  </div>
);

export default function TaskFlowLanding() {
  const [dark, setDark] = useState(false);

  const bg = dark ? "#10221f" : "#f8fcfb";
  const text = dark ? "#f3f4f6" : "#0d1b19";
  const cardBg = dark ? "#1a3632" : "#ffffff";
  const border = dark ? "rgba(76,154,141,.2)" : "rgba(76,154,141,.15)";
  const subText = dark ? "#9ca3af" : "rgba(13,27,25,.6)";

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />

      <div style={{ background: bg, color: text, fontFamily: "'Inter',sans-serif", minHeight: "100vh", overflowX: "hidden", transition: "background .3s,color .3s" }}>

        {/* Dark mode toggle */}
        <button onClick={() => setDark(!dark)} style={{
          position: "fixed", bottom: "20px", right: "20px", zIndex: 999,
          width: "44px", height: "44px", borderRadius: "50%",
          background: dark ? "#13ecc8" : "#0d1b19", color: dark ? "#0d1b19" : "#fff",
          border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,.3)", fontSize: "20px",
        }}>
          <Icon name={dark ? "light_mode" : "dark_mode"} />
        </button>

        {/* NAV */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 50, width: "100%",
          background: dark ? "rgba(16,34,31,.9)" : "rgba(248,252,251,.9)",
          backdropFilter: "blur(12px)", borderBottom: `1px solid rgba(76,154,141,.1)`,
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "8px", background: "#13ecc8",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#0d1b19",
              }}>
                <Icon name="task_alt" />
              </div>
              <span style={{ fontWeight: 800, fontSize: "18px" }}>TaskFlow</span>
            </div>
            <a href="#" style={{ color: "#13ecc8", fontWeight: 700, fontSize: "14px", textDecoration: "none" }}>Giriş Yap</a>
          </div>
        </nav>

        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>

          {/* HERO */}
          <section style={{ display: "flex", flexWrap: "wrap", gap: "32px", padding: "64px 16px", alignItems: "center" }}>
            <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: "24px" }}>
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
                <button style={{
                  padding: "0 24px", height: "48px", borderRadius: "12px", border: "none",
                  background: "#13ecc8", color: "#0d1b19", fontWeight: 700, fontSize: "15px",
                  cursor: "pointer", boxShadow: "0 4px 20px rgba(19,236,200,.3)",
                }}>
                  TaskFlow'u Alın
                </button>
                <button style={{
                  padding: "0 24px", height: "48px", borderRadius: "12px",
                  background: cardBg, border: `1px solid ${border}`,
                  color: text, fontWeight: 700, fontSize: "15px", cursor: "pointer",
                }}>
                  Daha Fazla Bilgi
                </button>
              </div>
            </div>
            <div style={{ flex: "1 1 260px", display: "flex", justifyContent: "center", position: "relative" }}>
              <div style={{
                position: "absolute", width: "120%", height: "80%", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                background: "radial-gradient(circle,rgba(19,236,200,.15),transparent 70%)",
                borderRadius: "50%", zIndex: 0,
              }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <PhoneMockup />
              </div>
            </div>
          </section>

          {/* TRUSTED */}
          <section style={{
            padding: "40px 16px", borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`,
            background: dark ? "rgba(26,54,50,.3)" : "rgba(255,255,255,.5)",
          }}>
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

          {/* FEATURES */}
          <section style={{ padding: "80px 16px" }}>
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 900, margin: "0 0 12px" }}>
                Başarı için ihtiyacınız olan{" "}
                <span style={{ textDecoration: "underline", textDecorationColor: "#13ecc8", textDecorationThickness: "4px", textUnderlineOffset: "4px" }}>
                  her şey.
                </span>
              </h2>
              <p style={{ color: subText, maxWidth: "520px", margin: "0 auto" }}>
                Modern ve çevik ekipler için tasarlanan temel özelliklerle iş akışınızı sadeleştirin.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "16px" }}>
              {features.map(f => (
                <div key={f.title} style={{
                  padding: "24px", borderRadius: "16px", border: `1px solid ${border}`,
                  background: cardBg, transition: "box-shadow .3s",
                  boxShadow: "0 2px 10px rgba(13,27,25,.03)",
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(19,236,200,.12)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(13,27,25,.03)"}
                >
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "12px",
                    background: "rgba(19,236,200,.1)", display: "flex", alignItems: "center",
                    justifyContent: "center", color: "#13ecc8", marginBottom: "16px", fontSize: "28px",
                  }}>
                    <Icon name={f.icon} />
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: "17px", margin: "0 0 8px" }}>{f.title}</h3>
                  <p style={{ color: subText, fontSize: "14px", lineHeight: 1.6, margin: 0 }}>{f.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* PRICING */}
          <section style={{ padding: "80px 16px", borderTop: `1px solid ${border}`, background: dark ? "rgba(26,54,50,.1)" : "rgba(255,255,255,.5)" }}>
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 900, margin: "0 0 12px" }}>Fiyat Planları</h2>
              <p style={{ color: subText }}>Ekibinizin büyüklüğüne ve ihtiyaçlarına en uygun planı seçin.</p>
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
                    <div style={{
                      position: "absolute", top: 0, right: 0,
                      background: "#13ecc8", color: "#0d1b19", fontSize: "11px",
                      fontWeight: 700, padding: "4px 12px",
                      borderBottomLeftRadius: "12px",
                    }}>POPÜLER</div>
                  )}
                  <div style={{ marginBottom: "24px" }}>
                    <h3 style={{ fontWeight: 700, fontSize: "17px", color: plan.popular ? "#fff" : text, margin: "0 0 12px" }}>{plan.name}</h3>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span style={{ fontSize: "2.4rem", fontWeight: 900, color: plan.popular ? "#fff" : text }}>{plan.price}</span>
                      {plan.period && <span style={{ color: "#9ca3af" }}>{plan.period}</span>}
                    </div>
                    <p style={{ color: plan.popular ? "#d1d5db" : subText, fontSize: "13px", margin: "8px 0 0" }}>{plan.description}</p>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                    {plan.features.map(feat => (
                      <div key={feat} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Icon name={plan.popular ? "check_circle" : "check"} style={{ color: "#13ecc8", fontSize: "20px" }} />
                        <span style={{ fontSize: "14px", color: plan.popular ? "#fff" : text }}>{feat}</span>
                      </div>
                    ))}
                  </div>
                  <button style={{
                    width: "100%", padding: "12px", borderRadius: "12px", fontWeight: 700,
                    fontSize: "15px", cursor: "pointer",
                    background: plan.popular ? "#13ecc8" : "transparent",
                    color: plan.popular ? "#0d1b19" : text,
                    border: plan.popular ? "none" : `1px solid rgba(76,154,141,.3)`,
                    boxShadow: plan.popular ? "0 4px 16px rgba(19,236,200,.25)" : "none",
                  }}>
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section style={{ padding: "32px 16px 80px" }}>
            <div style={{
              borderRadius: "24px", background: "#0d1b19",
              padding: "clamp(40px,8vw,80px) 24px", textAlign: "center",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: "-64px", right: "-64px", width: "256px", height: "256px", borderRadius: "50%", background: "rgba(19,236,200,.08)", filter: "blur(40px)" }} />
              <div style={{ position: "absolute", bottom: "-64px", left: "-64px", width: "256px", height: "256px", borderRadius: "50%", background: "rgba(76,154,141,.08)", filter: "blur(40px)" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <h2 style={{ color: "#fff", fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 900, margin: "0 0 16px", lineHeight: 1.2 }}>
                  Çalışma şeklinizi dönüştürmeye hazır mısınız?
                </h2>
                <p style={{ color: "#d1d5db", maxWidth: "400px", margin: "0 auto 24px", lineHeight: 1.6 }}>
                  Verimliliği artırmak ve operasyonları sadeleştirmek için TaskFlow kullanan 10.000+ ekibe katılın.
                </p>
                <button style={{
                  padding: "0 40px", height: "52px", borderRadius: "12px", border: "none",
                  background: "#13ecc8", color: "#0d1b19", fontWeight: 700, fontSize: "17px",
                  cursor: "pointer", boxShadow: "0 8px 24px rgba(19,236,200,.35)",
                }}>
                  TaskFlowu Edinin
                </button>
                <p style={{ color: "#6b7280", fontSize: "12px", marginTop: "12px" }}>Görev organizasyonu için TaskFlow'u edinin</p>
              </div>
            </div>
          </section>

        </div>

        {/* FOOTER */}
        <footer style={{ padding: "24px 16px", borderTop: `1px solid ${dark ? "#1f2937" : "#e5e7eb"}` }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
              <Icon name="task_alt" style={{ color: "#4c9a8d" }} />
              TaskFlow
            </div>
            <span style={{ color: "#9ca3af", fontSize: "13px" }}>© 2026 TaskFlow Inc. Tüm hakları saklıdır.</span>
          </div>
        </footer>

      </div>
    </>
  );
}

