import { useEffect, useState, type CSSProperties } from "react";

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

type ApiPlanProperties = {
  peopleAddedLimit: number;
  teamLimit: number;
  individualTaskLimit: number;
  isInternalReportingEnabled: boolean;
};

type ApiCompanyPlan = {
  planName: string;
  planPrice: number;
  planProperties: ApiPlanProperties;
};

type PricingPlanCard = {
  name: string;
  amount: number;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
};

const fallbackPricingPlans: PricingPlanCard[] = [
  {
    name: "Start-up",
    amount: 500,
    price: "₺500",
    period: "/ay",
    description: "Yeni başlayan küçük ekipler için ideal.",
    features: ["5 kullanıcıya kadar", "1 takım limiti", "100 bireysel görev limiti", "İç raporlama dahil"],
    cta: "Plan Seç",
    popular: false,
  },
  {
    name: "Business",
    amount: 1000,
    price: "₺1.000",
    period: "/ay",
    description: "Daha fazla güce ihtiyaç duyan büyüyen ekipler için.",
    features: ["25 kullanıcıya kadar", "5 takım limiti", "1000 bireysel görev limiti", "İç raporlama dahil"],
    cta: "Plan Seç",
    popular: true,
  },
  {
    name: "Enterprise",
    amount: 1500,
    price: "₺1.500",
    period: "/ay",
    description: "Büyük kuruluşlar için özelleştirilmiş çözümler.",
    features: ["1000 kullanıcıya kadar", "50 takım limiti", "10000 bireysel görev limiti", "İç raporlama dahil"],
    cta: "Plan Seç",
    popular: false,
  },
];

const planDescriptions = [
  "Yeni başlayan küçük ekipler için ideal.",
  "Büyüyen ekipler için dengeli kapsam ve esneklik.",
  "Yüksek ölçekli şirketler için kapsamlı kurumsal çözüm.",
];

const formatPlanPrice = (price: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);

const toPricingPlan = (plan: ApiCompanyPlan, index: number): PricingPlanCard => ({
  name: plan.planName,
  amount: plan.planPrice,
  price: plan.planPrice <= 0 ? "Ücretsiz" : formatPlanPrice(plan.planPrice),
  period: plan.planPrice <= 0 ? undefined : "/ay",
  description: planDescriptions[Math.min(index, planDescriptions.length - 1)],
  features: [
    `${plan.planProperties.peopleAddedLimit} kullanıcıya kadar`,
    `${plan.planProperties.teamLimit} takım limiti`,
    `${plan.planProperties.individualTaskLimit} bireysel görev limiti`,
    plan.planProperties.isInternalReportingEnabled ? "İç raporlama dahil" : "İç raporlama yok",
  ],
  cta: "Plan Seç",
  popular: false,
});

const toRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const getNumberByAliases = (obj: Record<string, unknown>, aliases: string[]): number => {
  for (const key of aliases) {
    const numericValue = Number(obj[key]);
    if (!Number.isNaN(numericValue)) return numericValue;
  }
  return Number.NaN;
};

const getBooleanByAliases = (obj: Record<string, unknown>, aliases: string[]): boolean => {
  for (const key of aliases) {
    const rawValue = obj[key];
    if (typeof rawValue === "boolean") return rawValue;
    if (typeof rawValue === "string") {
      const normalized = rawValue.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
    if (typeof rawValue === "number") return rawValue !== 0;
  }
  return false;
};

const parseApiPlans = (payload: unknown): ApiCompanyPlan[] => {
  const payloadRecord = toRecord(payload);
  const dataRecord = toRecord(payloadRecord.data);
  const itemsRecord = toRecord(payloadRecord.items);
  const resultRecord = toRecord(payloadRecord.result);
  const valueRecord = toRecord(payloadRecord.value);
  const rawArray =
    Array.isArray(payload) ? payload :
      Array.isArray(payloadRecord.$values) ? payloadRecord.$values :
      Array.isArray(payloadRecord.data) ? payloadRecord.data :
        Array.isArray(dataRecord.$values) ? dataRecord.$values :
        Array.isArray(payloadRecord.items) ? payloadRecord.items :
          Array.isArray(itemsRecord.$values) ? itemsRecord.$values :
          Array.isArray(payloadRecord.result) ? payloadRecord.result :
            Array.isArray(resultRecord.$values) ? resultRecord.$values :
            Array.isArray(payloadRecord.value) ? payloadRecord.value :
              Array.isArray(valueRecord.$values) ? valueRecord.$values :
              [];

  return rawArray
    .map((item) => {
      const raw = toRecord(item);
      const rawProperties = toRecord(raw.planProperties ?? raw.PlanProperties ?? raw.properties ?? raw.Properties);
      const planNameValue = raw.planName ?? raw.PlanName ?? raw.name ?? raw.Name;
      const planName = typeof planNameValue === "string" ? planNameValue : undefined;
      const planPrice = Number(raw.planPrice ?? raw.PlanPrice ?? raw.price ?? raw.Price);
      if (!planName || Number.isNaN(planPrice)) return null;
      const peopleAddedLimit = getNumberByAliases(rawProperties, ["peopleAddedLimit", "PeopleAddedLimit", "workerAddedLimit", "WorkerAddedLimit"]);
      const teamLimit = getNumberByAliases(rawProperties, ["teamLimit", "TeamLimit"]);
      const individualTaskLimit = getNumberByAliases(rawProperties, ["individualTaskLimit", "IndividualTaskLimit", "taskLimit", "TaskLimit"]);
      const isInternalReportingEnabled = getBooleanByAliases(rawProperties, ["isInternalReportingEnabled", "IsInternalReportingEnabled", "isReportIncluded", "IsReportIncluded"]);
      if ([peopleAddedLimit, teamLimit, individualTaskLimit].some(Number.isNaN)) return null;
      return { planName, planPrice, planProperties: { peopleAddedLimit, teamLimit, individualTaskLimit, isInternalReportingEnabled } };
    })
    .filter((plan): plan is ApiCompanyPlan => plan !== null);
};

const buildPlansUrl = (baseUrl: string) =>
  `${baseUrl ? `${baseUrl}/` : "/"}api/Tenant/CompanyPlans?t=${Date.now()}`;

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, "");
const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);
const pendingPlanStorageKey = "taskflow_pending_plan_checkout";

type PendingPlanSelection = {
  planName: string;
  planSlug: string;
  createdAt: number;
};

const getApiBaseUrlCandidates = (): string[] => {
  const envBaseUrl = (import.meta.env.VITE_TASKFLOW_API_URL as string | undefined)?.trim() ?? "";
  return [envBaseUrl, "http://localhost:5172", "https://localhost:7243", "http://localhost:8080", "https://localhost:8081"]
    .map((url) => normalizeBaseUrl(url))
    .filter((url, index, arr) => Boolean(url) && arr.indexOf(url) === index);
};

const normalizePlanText = (value: string) =>
  value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

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
  return (staticMap[planSlug] ?? env[dynamicKey] ?? "").trim();
};

const savePendingPlanSelection = (planName: string, planSlug: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(pendingPlanStorageKey, JSON.stringify({ planName, planSlug, createdAt: Date.now() }));
  } catch { /* ignore */ }
};

const readPendingPlanSelection = (): PendingPlanSelection | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(pendingPlanStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingPlanSelection>;
    if (typeof parsed.planName !== "string" || typeof parsed.planSlug !== "string") return null;
    return { planName: parsed.planName, planSlug: parsed.planSlug, createdAt: typeof parsed.createdAt === "number" ? parsed.createdAt : 0 };
  } catch { return null; }
};

const clearPendingPlanSelection = () => {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(pendingPlanStorageKey); } catch { /* ignore */ }
};

const buildCompanyCreateUrl = (planName: string, planSlug: string) => {
  const params = new URLSearchParams();
  params.set("payment", "success");
  if (planName) params.set("plan", planName);
  if (planSlug) params.set("slug", planSlug);
  return `/company/create?${params.toString()}`;
};

const trustedBy = [
  { icon: "change_history", name: "ACME Corp" },
  { icon: "diamond", name: "GlobalTech" },
  { icon: "bolt", name: "FutureFinance" },
  { icon: "waves", name: "WavePoint" },
  { icon: "public", name: "Nexus" },
];

type IconProps = { name: string; className?: string; style?: CSSProperties };
const Icon = ({ name, className = "", style }: IconProps) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontFamily: "'Material Symbols Outlined'", ...style }}>{name}</span>
);

const PhoneMockup = () => (
  <div style={{
    position: "relative", width: "260px", aspectRatio: "9/19",
    background: "#0d1b19", borderRadius: "2.5rem", padding: "12px",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", border: "4px solid #1a3632",
    overflow: "hidden", transform: "rotate(2deg)", transition: "transform 0.5s", flexShrink: 0,
  }}
    onMouseEnter={e => e.currentTarget.style.transform = "rotate(0deg)"}
    onMouseLeave={e => e.currentTarget.style.transform = "rotate(2deg)"}
  >
    <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", height: "24px", width: "128px", background: "#000", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px", zIndex: 20 }} />
    <div style={{ width: "100%", height: "100%", background: "#f8fcfb", borderRadius: "2rem", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "40px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderBottom: "1px solid #f3f4f6" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#9ca3af" }}>Tekrar hoş geldin</div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0d1b19" }}>Alex Morgan</div>
        </div>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundImage: "url('https://i.pravatar.cc/32?img=47')", backgroundSize: "cover" }} />
      </div>
      <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "12px", overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg,rgba(19,236,200,.2),rgba(76,154,141,.1))", padding: "16px", borderRadius: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#4c9a8d" }}>Haftalık Görevler</span>
            <Icon name="trending_up" style={{ color: "#13ecc8", fontSize: "18px" }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#0d1b19" }}>84%</div>
          <div style={{ background: "rgba(255,255,255,.5)", height: "6px", borderRadius: "9999px", marginTop: "8px", overflow: "hidden" }}>
            <div style={{ background: "#13ecc8", height: "100%", width: "84%", borderRadius: "9999px" }} />
          </div>
        </div>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em" }}>Aktif Projeler</div>
        {[
          { icon: "description", bg: "#dbeafe", color: "#2563eb", title: "Q3 Raporu", sub: "Yarın Teslim", dot: "#f87171" },
          { icon: "forum", bg: "#f3e8ff", color: "#9333ea", title: "Ekip Senkronu", sub: "2 dk önce başladı", dot: "#4ade80" },
        ].map(item => (
          <div key={item.title} style={{ display: "flex", alignItems: "center", padding: "10px 12px", background: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,.05)", border: "1px solid #f9fafb" }}>
            <div style={{ padding: "6px", borderRadius: "8px", background: item.bg, color: item.color, marginRight: "10px", display: "flex" }}>
              <Icon name={item.icon} style={{ fontSize: "16px" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#0d1b19" }}>{item.title}</div>
              <div style={{ fontSize: "10px", color: "#9ca3af" }}>{item.sub}</div>
            </div>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.dot }} />
          </div>
        ))}
        <div style={{ height: "72px", background: "#fff", borderRadius: "12px", border: "1px solid #f9fafb", display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "8px 12px 8px" }}>
          {[40, 60, 80, 50, 70].map((h, i) => (
            <div key={i} style={{ width: "14%", borderRadius: "3px 3px 0 0", height: `${h}%`, background: `rgba(19,236,200,${0.3 + i * 0.12})` }} />
          ))}
        </div>
      </div>
      <div style={{ height: "56px", background: "#fff", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-around", alignItems: "center", padding: "0 8px" }}>
        {[
          { icon: "home", active: true },
          { icon: "chat", active: false },
          { icon: "add", fab: true },
          { icon: "calendar_month", active: false },
          { icon: "settings", active: false },
        ].map((item, i) => item.fab ? (
          <div key={i} style={{ background: "#0d1b19", borderRadius: "50%", padding: "8px", marginTop: "-24px", boxShadow: "0 4px 12px rgba(0,0,0,.3)", display: "flex" }}>
            <Icon name={item.icon} style={{ color: "#fff", fontSize: "20px" }} />
          </div>
        ) : (
          <Icon key={i} name={item.icon} style={{ color: item.active ? "#13ecc8" : "#d1d5db", fontSize: "24px" }} />
        ))}
      </div>
    </div>
  </div>
);

// ─── SSS ──────────────────────────────────────────────────────────────────────

const faqItems = [
  {
    q: "TaskFlow'u kullanmaya başlamak için ne yapmam gerekiyor?",
    a: "Bir plan seçip ödemeyi tamamladıktan sonra şirket hesabınızı oluşturmanız yeterli. Kurulum birkaç dakika sürer, teknik bilgi gerekmez.",
  },
  {
    q: "Planımı sonradan değiştirebilir miyim?",
    a: "Evet, dilediğiniz zaman daha üst bir plana geçiş yapabilirsiniz. Geçiş anında fark ücretlendirmesi uygulanır.",
  },
  {
    q: "Verilerim güvende mi?",
    a: "Tüm veriler TLS şifrelemesiyle iletilir ve sunucu tarafında AES-256 ile şifreli olarak saklanır. Düzenli yedekleme yapılır.",
  },
  {
    q: "Ücretsiz deneme var mı?",
    a: "Şu an için ücretsiz deneme sunulmamaktadır ancak Start-up planı küçük ekipler için uygun fiyatlı bir başlangıç seçeneği sunar.",
  },
  {
    q: "İptal etmek istediğimde ne olur?",
    a: "Aboneliğinizi istediğiniz zaman iptal edebilirsiniz. Mevcut dönem sonuna kadar erişiminiz devam eder, ek ücret alınmaz.",
  },
];

type FaqListProps = { cardBg: string; border: string; text: string; subText: string };

const FaqList = ({ cardBg, border, text, subText }: FaqListProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {faqItems.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} style={{
            borderRadius: "14px",
            border: `1px solid ${isOpen ? "rgba(19,236,200,0.35)" : border}`,
            background: cardBg,
            overflow: "hidden",
            transition: "border-color 0.2s",
          }}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              style={{
                width: "100%", display: "flex", justifyContent: "space-between",
                alignItems: "center", padding: "20px 24px", background: "transparent",
                border: "none", cursor: "pointer", textAlign: "left", gap: "16px",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "15px", color: text, lineHeight: 1.4 }}>
                {item.q}
              </span>
              <span style={{
                flexShrink: 0, width: "28px", height: "28px", borderRadius: "50%",
                background: isOpen ? "#13ecc8" : "rgba(19,236,200,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s, transform 0.25s",
                transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                color: isOpen ? "#0d1b19" : "#13ecc8",
                fontSize: "20px", fontFamily: "'Material Symbols Outlined'",
              }}>
                add
              </span>
            </button>
            <div style={{ maxHeight: isOpen ? "200px" : "0px", overflow: "hidden", transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
              <p style={{ margin: 0, padding: "0 24px 20px", fontSize: "14px", color: subText, lineHeight: 1.7 }}>
                {item.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export default function TaskFlowLanding() {
  const [dark, setDark] = useState(false);
  const [pricingPlans, setPricingPlans] = useState<PricingPlanCard[]>(fallbackPricingPlans);
  const [loadingPlanName, setLoadingPlanName] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState("");

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    let isMounted = true;
    const fetchCompanyPlans = async () => {
      try {
        for (const apiBaseUrl of getApiBaseUrlCandidates()) {
          try {
            const response = await fetch(buildPlansUrl(apiBaseUrl), { cache: "no-store" });
            if (!response.ok) continue;
            const payload: unknown = await response.json();
            const apiPlans = parseApiPlans(payload).sort((a, b) => a.planPrice - b.planPrice).slice(0, 3);
            if (apiPlans.length === 0) continue;
            const planCards = apiPlans.map((plan, index) => toPricingPlan(plan, index));
            const mergedPlans = fallbackPricingPlans.map((fallbackPlan, index) => planCards[index] ?? fallbackPlan);
            const plansWithPopular = mergedPlans.map((plan, index) => ({ ...plan, popular: index === 1 }));
            if (isMounted) setPricingPlans(plansWithPopular);
            return;
          } catch { continue; }
        }
      } catch (error) {
        console.error("Şirket planları alınırken hata oluştu:", error);
      }
    };
    void fetchCompanyPlans();
    return () => { isMounted = false; };
  }, []);

  const bg = dark ? "#10221f" : "#f8fcfb";
  const text = dark ? "#f3f4f6" : "#0d1b19";
  const cardBg = dark ? "#1a3632" : "#ffffff";
  const border = dark ? "rgba(76,154,141,.2)" : "rgba(76,154,141,.15)";
  const subText = dark ? "#9ca3af" : "rgba(13,27,25,.6)";
  const queryParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const paymentStatus = queryParams?.get("payment") ?? queryParams?.get("status") ?? "";
  const paymentPlanFromQuery = queryParams?.get("plan") ?? "";
  const paymentSlugFromQuery = queryParams?.get("slug") ?? "";
  const isCheckoutLoading = loadingPlanName !== null;

  useEffect(() => {
    if (paymentStatus !== "success") return;
    const pending = readPendingPlanSelection();
    const resolvedPlan = paymentPlanFromQuery || pending?.planName || "";
    const resolvedSlug = paymentSlugFromQuery || pending?.planSlug || (resolvedPlan ? getPlanSlug(resolvedPlan) : "");
    clearPendingPlanSelection();
    window.location.replace(buildCompanyCreateUrl(resolvedPlan, resolvedSlug));
  }, [paymentStatus, paymentPlanFromQuery, paymentSlugFromQuery]);

  const handlePlanSelect = (plan: PricingPlanCard) => {
    if (isCheckoutLoading) return;
    const planSlug = getPlanSlug(plan.name);
    if (plan.amount <= 0) {
      const params = new URLSearchParams();
      params.set("payment", "success");
      params.set("plan", plan.name);
      params.set("slug", planSlug);
      window.location.assign(`/company/create?${params.toString()}`);
      return;
    }
    setLoadingPlanName(plan.name);
    setCheckoutError("");
    const paymentLink = getStripePaymentLink(planSlug);
    if (!isHttpUrl(paymentLink)) {
      setCheckoutError(`"${plan.name}" planı için Stripe Payment Link tanımlı değil.`);
      setLoadingPlanName(null);
      return;
    }
    savePendingPlanSelection(plan.name, planSlug);
    window.location.assign(paymentLink);
  };

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
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src="https://www.logoai.com/uploads/icon/2021/08/06/732ca933-7df8-43e8-b085-69466243c919.png" alt="TaskFlow logo" style={{ width: "26px", height: "26px", objectFit: "contain", display: "block" }} />
              </div>
              <span style={{ fontWeight: 800, fontSize: "18px" }}>TaskFlow</span>
            </div>
            <a href="/auth/login" style={{ color: "#13ecc8", fontWeight: 700, fontSize: "14px", textDecoration: "none" }}>Giriş Yap</a>
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
                <button type="button" onClick={() => scrollToSection("pricing")} style={{ padding: "0 24px", height: "48px", borderRadius: "12px", border: "none", background: "#13ecc8", color: "#0d1b19", fontWeight: 700, fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 20px rgba(19,236,200,.3)" }}>
                  TaskFlow'u Alın
                </button>
                <button type="button" onClick={() => scrollToSection("features")} style={{ padding: "0 24px", height: "48px", borderRadius: "12px", background: cardBg, border: `1px solid ${border}`, color: text, fontWeight: 700, fontSize: "15px", cursor: "pointer" }}>
                  Daha Fazla Bilgi
                </button>
              </div>
            </div>
            <div style={{ flex: "1 1 260px", display: "flex", justifyContent: "center", position: "relative" }}>
              <div style={{ position: "absolute", width: "120%", height: "80%", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle,rgba(19,236,200,.15),transparent 70%)", borderRadius: "50%", zIndex: 0 }} />
              <div style={{ position: "relative", zIndex: 1 }}><PhoneMockup /></div>
            </div>
          </section>

          {/* TRUSTED */}
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

          {/* FEATURES */}
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

          {/* PRICING */}
          <section id="pricing" style={{ padding: "80px 16px", borderTop: `1px solid ${border}`, background: dark ? "rgba(26,54,50,.1)" : "rgba(255,255,255,.5)" }}>
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 900, margin: "0 0 12px" }}>Fiyat Planları</h2>
              <p style={{ color: subText }}>Ekibinizin büyüklüğüne ve ihtiyaçlarına en uygun planı seçin.</p>
              {paymentStatus === "cancel" && !checkoutError && (
                <p style={{ margin: "14px 0 0", color: "#92400e", fontSize: "13px" }}>
                  Ödeme işlemi iptal edildi. Dilersen plan seçip tekrar deneyebilirsin.
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
                  <button type="button" disabled={isCheckoutLoading} onClick={() => handlePlanSelect(plan)} style={{
                    width: "100%", padding: "12px", borderRadius: "12px", fontWeight: 700, fontSize: "15px",
                    cursor: isCheckoutLoading ? "not-allowed" : "pointer",
                    background: plan.popular ? "#13ecc8" : "transparent",
                    color: plan.popular ? "#0d1b19" : text,
                    border: plan.popular ? "none" : `1px solid rgba(76,154,141,.3)`,
                    boxShadow: plan.popular ? "0 4px 16px rgba(19,236,200,.25)" : "none",
                    opacity: isCheckoutLoading && loadingPlanName !== plan.name ? 0.6 : 1,
                  }}>
                    {loadingPlanName === plan.name ? "Yönlendiriliyor..." : plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* SSS */}
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

          {/* CTA */}
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

        {/* FOOTER */}
        <footer style={{ padding: "24px 16px", borderTop: `1px solid ${dark ? "#1f2937" : "#e5e7eb"}` }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
              <Icon name="task_alt" style={{ color: "#4c9a8d" }} /> TaskFlow
            </div>
            <span style={{ color: "#9ca3af", fontSize: "13px" }}>© 2026 TaskFlow Inc. Tüm hakları saklıdır.</span>
          </div>
        </footer>

      </div>
    </>
  );
}
