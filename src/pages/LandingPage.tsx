import { useEffect, useState, type CSSProperties } from "react";
import {
  getPlanSlug,
  formatPlanPrice,
  getApiBaseUrlCandidates,
  buildApiUrl,
  buildPlansUrl,
  buildChatbotUrl,
  toRecord,
  parseApiPlans,
  saveStripePostCheckoutRedirect,
  clearStripePostCheckoutRedirect,
  saveDarkMode,
  readDarkMode,
} from "../shared/utils";
import { ENDPOINTS } from "../shared/endpoints";
import type { StripeCheckoutSessionResponse, ApiCompanyPlan } from "../shared/types";


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

type AssistantChatSource = {
  sourceKey: string;
  title: string;
  chunkIndex: number;
  score: number;
};

type AssistantChatApiResponse = {
  answer?: string;
  Answer?: string;
  sources?: unknown;
  Sources?: unknown;
  message?: string;
  detail?: string;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  sources?: AssistantChatSource[];
  isError?: boolean;
};

const PLAN_SELECT_CTA = "Plan Seç";

const fixMojibakeText = (value: string) => {
  const replacements: Array<[string, string]> = [
    ["Ã§", "ç"],
    ["Ã‡", "Ç"],
    ["Ã¶", "ö"],
    ["Ã–", "Ö"],
    ["Ã¼", "ü"],
    ["Ãœ", "Ü"],
    ["Ä±", "ı"],
    ["Ä°", "İ"],
    ["ÄŸ", "ğ"],
    ["Äž", "Ğ"],
    ["ÅŸ", "ş"],
    ["Åž", "Ş"],
    ["â‚º", "₺"],
    ["kullan�c�", "kullanıcı"],
    ["tak�m", "takım"],
    ["g�rev", "görev"],
    ["�� raporlama", "İç raporlama"],
    ["i� raporlama", "iç raporlama"],
    ["B�y�yen", "Büyüyen"],
    ["ba�layan", "başlayan"],
    ["k���k", "küçük"],
    ["B�y�k", "Büyük"],
    ["kurulu�lar", "kuruluşlar"],
    ["�zelle�tirilmi�", "özelleştirilmiş"],
    ["s�re�lerinizi", "süreçlerinizi"],
    ["i�in", "için"],
    ["Y�ksek", "Yüksek"],
    ["�l�ekli", "ölçekli"],
    ["�irketler", "şirketler"],
    ["kapsaml�", "kapsamlı"],
    ["��z�m", "çözüm"],
  ];

  let normalized = value;
  for (const [wrong, correct] of replacements) {
    normalized = normalized.replaceAll(wrong, correct);
  }
  return normalized;
};

const fallbackPricingPlans: PricingPlanCard[] = [
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

const planDescriptions = [
  "Yeni başlayan küçük ekipler için ideal.",
  "Büyüyen ekipler için dengeli kapsam ve esneklik.",
  "Yüksek ölçekli şirketler için kapsamlı kurumsal çözüm.",
];

const toPricingPlan = (plan: ApiCompanyPlan, index: number): PricingPlanCard => ({
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

const parseAssistantChatResponse = (payload: unknown) => {
  const record = toRecord(payload);
  const answerValue = record.answer ?? record.Answer;
  const answer = typeof answerValue === "string" ? answerValue.trim() : "";
  const rawSources = Array.isArray(record.sources)
    ? record.sources
    : Array.isArray(record.Sources)
      ? record.Sources
      : [];

  const sources = rawSources
    .map((item) => {
      const raw = toRecord(item);
      const sourceKeyValue = raw.sourceKey ?? raw.SourceKey ?? raw.source_key;
      const titleValue = raw.title ?? raw.Title;
      const chunkIndexValue = Number(raw.chunkIndex ?? raw.ChunkIndex ?? raw.chunk_index);
      const scoreValue = Number(raw.score ?? raw.Score);

      if (typeof sourceKeyValue !== "string" || typeof titleValue !== "string" || Number.isNaN(chunkIndexValue) || Number.isNaN(scoreValue)) {
        return null;
      }

      return {
        sourceKey: sourceKeyValue,
        title: titleValue,
        chunkIndex: chunkIndexValue,
        score: scoreValue,
      };
    })
    .filter((item): item is AssistantChatSource => item !== null);

  return { answer, sources };
};

const assistantWelcomeMessage = "Merhaba, ben TFBot. Size yardımcı olmak için buradayım.";

const getStripePaymentLinkByPlan = (planSlug: string) => {
  const startup = (import.meta.env.VITE_STRIPE_PAYMENT_LINK_STARTUP as string | undefined)?.trim() ?? "";
  const business = (import.meta.env.VITE_STRIPE_PAYMENT_LINK_BUSINESS as string | undefined)?.trim() ?? "";
  const enterprise = (import.meta.env.VITE_STRIPE_PAYMENT_LINK_ENTERPRISE as string | undefined)?.trim() ?? "";

  if (planSlug === "startup") return startup;
  if (planSlug === "business") return business;
  if (planSlug === "enterprise") return enterprise;
  return "";
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
  <div
    style={{
      position: "relative",
      width: "248px",
      aspectRatio: "9/19.5",
      flexShrink: 0,
      transform: "rotate(2deg)",
      transition: "transform 0.5s",
    }}
    onMouseEnter={e => e.currentTarget.style.transform = "rotate(0deg)"}
    onMouseLeave={e => e.currentTarget.style.transform = "rotate(2deg)"}
  >
    <div style={{ position: "absolute", left: "-3px", top: "15%", width: "3px", height: "4.5%", background: "linear-gradient(to right,#111,#2a2a2a)", borderRadius: "2px 0 0 2px", boxShadow: "-1px 0 2px rgba(0,0,0,0.6)" }} />
    <div style={{ position: "absolute", left: "-3px", top: "22%", width: "3px", height: "9%", background: "linear-gradient(to right,#111,#2a2a2a)", borderRadius: "2px 0 0 2px", boxShadow: "-1px 0 2px rgba(0,0,0,0.6)" }} />
    <div style={{ position: "absolute", left: "-3px", top: "34%", width: "3px", height: "9%", background: "linear-gradient(to right,#111,#2a2a2a)", borderRadius: "2px 0 0 2px", boxShadow: "-1px 0 2px rgba(0,0,0,0.6)" }} />
    <div style={{ position: "absolute", right: "-3px", top: "26%", width: "3px", height: "14%", background: "linear-gradient(to left,#111,#2a2a2a)", borderRadius: "0 2px 2px 0", boxShadow: "1px 0 2px rgba(0,0,0,0.6)" }} />
    <div style={{
      position: "absolute", inset: 0,
      borderRadius: "48px",
      background: "linear-gradient(155deg, #2a2a2a 0%, #0d0d0d 20%, #1c1c1c 40%, #080808 60%, #161616 80%, #0a0a0a 100%)",
      boxShadow: [
        "0 40px 80px -10px rgba(0,0,0,0.95)",
        "0 0 0 1px rgba(255,255,255,0.08)",
        "inset 0 1px 0 rgba(255,255,255,0.1)",
        "inset 0 -1px 0 rgba(0,0,0,0.8)",
        "inset 1px 0 0 rgba(255,255,255,0.04)",
        "inset -1px 0 0 rgba(255,255,255,0.04)",
      ].join(", "),
    }} />
    <div style={{
      position: "absolute", inset: 0,
      borderRadius: "48px",
      background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%)",
      pointerEvents: "none",
      zIndex: 10,
    }} />
    <div style={{
      position: "absolute", inset: "3px",
      borderRadius: "45px",
      background: "#000",
      overflow: "hidden",
    }}>
      <div style={{ width: "100%", height: "100%", background: "#f8fcfb", display: "flex", flexDirection: "column", position: "relative" }}>
        <div style={{
          position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)",
          width: "94px", height: "25px",
          background: "#000",
          borderRadius: "20px",
          zIndex: 30,
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          paddingRight: "8px",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.4)",
        }}>
          <div style={{
            width: "11px", height: "11px", borderRadius: "50%",
            background: "radial-gradient(circle at 33% 33%, #1a2e2c 0%, #050505 65%)",
            boxShadow: "0 0 0 1.5px #0a0a0a, 0 0 6px rgba(19,236,200,0.2), inset 0 0 3px rgba(0,0,0,0.8)",
            position: "relative",
          }}>
            <div style={{ position: "absolute", top: "2px", left: "2px", width: "3px", height: "3px", borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "5px", height: "5px", borderRadius: "50%", background: "radial-gradient(circle, #0d1b1a, #000)", boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }} />
          </div>
        </div>
        <div style={{
          paddingTop: "46px", paddingLeft: "18px", paddingRight: "16px", paddingBottom: "5px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "#fff",
        }}>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#0d1b19", letterSpacing: "-0.3px" }}>9:41</span>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {[3, 5, 7, 9].map((h, i) => (
              <div key={i} style={{ width: "3px", height: `${h}px`, borderRadius: "1px", background: i < 3 ? "#0d1b19" : "#c8d0ce" }} />
            ))}
            <svg width="13" height="10" viewBox="0 0 13 10" fill="none" style={{ marginLeft: "2px" }}>
              <path d="M6.5 7.8a1.05 1.05 0 110 2.1 1.05 1.05 0 010-2.1z" fill="#0d1b19" />
              <path d="M3.8 5.6C4.6 4.8 5.5 4.4 6.5 4.4s1.9.4 2.7 1.2" stroke="#0d1b19" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              <path d="M1.5 3.4C3 1.9 4.6 1.2 6.5 1.2S10 1.9 11.5 3.4" stroke="#0d1b19" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.35" />
            </svg>
            <div style={{ display: "flex", alignItems: "center", marginLeft: "2px" }}>
              <div style={{ width: "19px", height: "9px", borderRadius: "2.5px", border: "1.2px solid #0d1b19", padding: "1.5px", display: "flex", alignItems: "center" }}>
                <div style={{ width: "72%", height: "100%", borderRadius: "1px", background: "#0d1b19" }} />
              </div>
              <div style={{ width: "2px", height: "4px", borderRadius: "0 1px 1px 0", background: "#0d1b19", marginLeft: "1px" }} />
            </div>
          </div>
        </div>
        <div style={{
          padding: "8px 16px 10px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "#fff", borderBottom: "1px solid #f0f4f3",
        }}>
          <div>
            <div style={{ fontSize: "9.5px", color: "#9ca3af", letterSpacing: "0.01em" }}>Tekrar hoş geldin</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#0d1b19", letterSpacing: "-0.3px" }}>Alex Morgan</div>
          </div>
          <div style={{
            width: "30px", height: "30px", borderRadius: "50%",
            backgroundImage: "url('https://i.pravatar.cc/32?img=47')",
            backgroundSize: "cover",
            boxShadow: "0 0 0 2px rgba(19,236,200,0.45)",
          }} />
        </div>
        <div style={{ flex: 1, padding: "10px 12px", display: "flex", flexDirection: "column", gap: "9px", overflow: "hidden" }}>
          <div style={{
            background: "linear-gradient(135deg,rgba(19,236,200,.18),rgba(76,154,141,.09))",
            padding: "11px 13px", borderRadius: "14px",
            border: "1px solid rgba(19,236,200,0.15)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
              <span style={{ fontSize: "9.5px", fontWeight: 600, color: "#4c9a8d", letterSpacing: "0.02em" }}>Haftalık Görevler</span>
              <Icon name="trending_up" style={{ color: "#13ecc8", fontSize: "15px" }} />
            </div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0d1b19", lineHeight: 1, letterSpacing: "-0.5px" }}>84%</div>
            <div style={{ background: "rgba(255,255,255,.55)", height: "4px", borderRadius: "9999px", marginTop: "6px", overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(to right, #13ecc8, #0ab89f)", height: "100%", width: "84%", borderRadius: "9999px" }} />
            </div>
          </div>
          <div style={{ fontSize: "9px", fontWeight: 700, color: "#b0bab8", textTransform: "uppercase", letterSpacing: "0.12em" }}>Aktif Projeler</div>
          {[
            { icon: "description", bg: "#dbeafe", color: "#2563eb", title: "Q3 Raporu", sub: "Yarın Teslim", dot: "#f87171" },
            { icon: "forum", bg: "#f3e8ff", color: "#9333ea", title: "Ekip Senkronu", sub: "2 dk önce başladı", dot: "#4ade80" },
          ].map(item => (
            <div key={item.title} style={{
              display: "flex", alignItems: "center", padding: "8px 10px",
              background: "#fff", borderRadius: "12px",
              boxShadow: "0 1px 4px rgba(0,0,0,.05)", border: "1px solid #f0f4f3",
            }}>
              <div style={{ padding: "5px", borderRadius: "8px", background: item.bg, color: item.color, marginRight: "8px", display: "flex" }}>
                <Icon name={item.icon} style={{ fontSize: "13px" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#0d1b19", letterSpacing: "-0.2px" }}>{item.title}</div>
                <div style={{ fontSize: "9px", color: "#9ca3af" }}>{item.sub}</div>
              </div>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: item.dot, boxShadow: `0 0 4px ${item.dot}` }} />
            </div>
          ))}
          <div style={{
            height: "48px", background: "#fff", borderRadius: "12px",
            border: "1px solid #f0f4f3",
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            padding: "6px 10px 6px",
            boxShadow: "0 1px 4px rgba(0,0,0,.04)",
          }}>
            {[35, 58, 80, 48, 68].map((h, i) => (
              <div key={i} style={{
                width: "13%", borderRadius: "3px 3px 0 0",
                height: `${h}%`,
                background: `rgba(19,236,200,${0.25 + i * 0.15})`,
              }} />
            ))}
          </div>
        </div>
        <div style={{ background: "#fff", borderTop: "1px solid #f0f4f3", paddingBottom: "8px" }}>
          <div style={{
            height: "46px",
            display: "flex", justifyContent: "space-around", alignItems: "center", padding: "0 6px",
          }}>
            {[
              { icon: "home", active: true },
              { icon: "chat", active: false },
              { icon: "add", fab: true },
              { icon: "calendar_month", active: false },
              { icon: "settings", active: false },
            ].map((item, i) => item.fab ? (
              <div key={i} style={{
                background: "linear-gradient(135deg,#13ecc8,#0ab89f)",
                borderRadius: "50%", padding: "7px",
                marginTop: "-18px",
                boxShadow: "0 4px 16px rgba(19,236,200,.55)", display: "flex",
              }}>
                <Icon name={item.icon} style={{ color: "#0a0f0e", fontSize: "17px" }} />
              </div>
            ) : (
              <Icon key={i} name={item.icon} style={{ color: item.active ? "#13ecc8" : "#d1d5db", fontSize: "21px" }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", paddingTop: "2px" }}>
            <div style={{ width: "90px", height: "4px", borderRadius: "2px", background: "#0d1b19", opacity: 0.12 }} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const faqItems = [
  {
    q: "TaskFlow'u kullanmaya başlamak için ne yapmam gerekiyor?",
    a: "Bir plan seçip ödemeyi tamamlamanız yeterli. Ödeme başarılı olduğunda kayıt sayfasına yönlendirilirsiniz.",
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
            background: cardBg, overflow: "hidden", transition: "border-color 0.2s",
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
              <span style={{ fontWeight: 600, fontSize: "15px", color: text, lineHeight: 1.4 }}>{item.q}</span>
              <span style={{
                flexShrink: 0, width: "28px", height: "28px", borderRadius: "50%",
                background: isOpen ? "#13ecc8" : "rgba(19,236,200,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s, transform 0.25s",
                transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                color: isOpen ? "#0d1b19" : "#13ecc8",
                fontSize: "20px", fontFamily: "'Material Symbols Outlined'",
              }}>add</span>
            </button>
            <div style={{ maxHeight: isOpen ? "200px" : "0px", overflow: "hidden", transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
              <p style={{ margin: 0, padding: "0 24px 20px", fontSize: "14px", color: subText, lineHeight: 1.7 }}>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function TaskFlowLanding() {
  const [dark, setDark] = useState(() => readDarkMode(false));
  const [pricingPlans, setPricingPlans] = useState<PricingPlanCard[]>(fallbackPricingPlans);
  const [loadingPlanName, setLoadingPlanName] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", text: assistantWelcomeMessage },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      saveDarkMode(next);
      return next;
    });
  };

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

  const bg = dark ? "#10221f" : "#f8fcfb";
  const text = dark ? "#f3f4f6" : "#0d1b19";
  const cardBg = dark ? "#1a3632" : "#ffffff";
  const border = dark ? "rgba(76,154,141,.2)" : "rgba(76,154,141,.15)";
  const subText = dark ? "#9ca3af" : "rgba(13,27,25,.6)";
  const isCheckoutLoading = loadingPlanName !== null;
  const queryParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const paymentStatus = queryParams?.get("payment") ?? queryParams?.get("status") ?? "";

  useEffect(() => {
    if (paymentStatus === "cancel" || paymentStatus === "success") {
      clearStripePostCheckoutRedirect();
    }
  }, [paymentStatus]);

  useEffect(() => {
    if (!chatOpen) return;
    const scrollContainer = document.getElementById("tf-chat-scroll");
    if (!scrollContainer) return;
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  }, [chatMessages, chatOpen]);

  const handlePlanSelect = async (plan: PricingPlanCard) => {
    if (isCheckoutLoading) return;

    const planSlug = getPlanSlug(plan.name);
    const stripePaymentLink = getStripePaymentLinkByPlan(planSlug);
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

  const sendChatQuestion = async (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question || chatLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: question,
    };

    setChatMessages((current) => [...current, userMessage]);
    setChatInput("");
    setChatLoading(true);
    setChatError("");

    let lastError = "Şu anda bot yanıt veremedi. Lütfen tekrar deneyin.";

    for (const apiBaseUrl of getApiBaseUrlCandidates()) {
      try {
        const response = await fetch(buildChatbotUrl(apiBaseUrl), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });

        const raw = await response.text();
        let payload: AssistantChatApiResponse | unknown = {};
        try {
          payload = JSON.parse(raw) as AssistantChatApiResponse;
        } catch {
          payload = {};
        }

        if (!response.ok) {
          const parsed = toRecord(payload);
          lastError = (typeof parsed.detail === "string" && parsed.detail.trim()) ||
            (typeof parsed.message === "string" && parsed.message.trim()) ||
            `Yanıt alınamadı (HTTP ${response.status}).`;
          continue;
        }

        const parsed = parseAssistantChatResponse(payload);
        if (!parsed.answer) {
          lastError = "Bot yanıtı boş döndü.";
          continue;
        }

        setChatMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: parsed.answer,
            sources: parsed.sources,
          },
        ]);
        setChatLoading(false);
        return;
      } catch {
        lastError = "API'ye ulaşılamadı.";
      }
    }

    setChatMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: lastError,
        isError: true,
      },
    ]);
    setChatError(lastError);
    setChatLoading(false);
  };

  const handleChatSubmit = async (event?: { preventDefault: () => void }) => {
    event?.preventDefault();
    await sendChatQuestion(chatInput);
  };

  return (
    <>
      <div style={{ background: bg, color: text, fontFamily: "'Inter',sans-serif", minHeight: "100vh", overflowX: "hidden", transition: "background .3s,color .3s" }}>

        <button
          type="button"
          onClick={toggleDark}
          aria-label={dark ? "Açık tema" : "Koyu tema"}
          style={{
            position: "fixed", bottom: "20px", left: "20px", zIndex: 999,
            width: "44px", height: "44px", borderRadius: "50%",
            background: dark ? "#13ecc8" : "#0d1b19", color: dark ? "#0d1b19" : "#fff",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,.3)", fontSize: "20px",
          }}
        >
          <Icon name={dark ? "light_mode" : "dark_mode"} />
        </button>

        <button
          type="button"
          onClick={() => setChatOpen((current) => !current)}
          aria-label={chatOpen ? "Sohbet penceresini kapat" : "TFBot sohbetini aç"}
          style={{
            position: "fixed", right: "20px", bottom: "20px", zIndex: 1000,
            width: "56px", height: "56px", borderRadius: "18px",
            background: "linear-gradient(135deg, #13ecc8 0%, #4c9a8d 100%)",
            color: "#0d1b19",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 12px 28px rgba(19,236,200,.28), 0 4px 12px rgba(0,0,0,.2)", fontSize: "24px",
            transform: chatOpen ? "scale(1.02)" : "scale(1)",
          }}
        >
          <Icon name={chatOpen ? "close" : "chat_bubble"} style={{ fontSize: "24px" }} />
        </button>

        {chatOpen && (
          <div style={{
            position: "fixed",
            right: "20px",
            bottom: "88px",
            zIndex: 1000,
            width: "min(380px, calc(100vw - 24px))",
            height: "min(560px, calc(100vh - 120px))",
            borderRadius: "24px",
            border: `1px solid ${dark ? "rgba(76,154,141,.25)" : "rgba(76,154,141,.18)"}`,
            background: dark ? "rgba(9,21,19,.96)" : "rgba(255,255,255,.98)",
            boxShadow: dark ? "0 28px 70px rgba(0,0,0,.45)" : "0 28px 70px rgba(13,27,25,.18)",
            backdropFilter: "blur(20px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}>
            <div style={{
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              borderBottom: `1px solid ${dark ? "rgba(255,255,255,.06)" : "rgba(13,27,25,.08)"}`,
              background: dark ? "linear-gradient(180deg, rgba(19,236,200,.08), transparent)" : "linear-gradient(180deg, rgba(19,236,200,.1), transparent)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "14px",
                  background: "linear-gradient(135deg, #13ecc8 0%, #4c9a8d 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#0d1b19", boxShadow: "0 10px 20px rgba(19,236,200,.22)",
                }}>
                  <Icon name="smart_toy" style={{ fontSize: "22px" }} />
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: text, lineHeight: 1.1 }}>TFBot</div>
                  <div style={{ fontSize: "12px", color: subText, marginTop: "3px" }}>TaskFlow yardım asistanı</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                aria-label="Sohbeti kapat"
                style={{
                  width: "34px", height: "34px", borderRadius: "10px",
                  border: "none", background: dark ? "rgba(255,255,255,.04)" : "rgba(13,27,25,.05)",
                  color: text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon name="close" style={{ fontSize: "18px" }} />
              </button>
            </div>

            <div
              id="tf-chat-scroll"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                background: dark
                  ? "radial-gradient(circle at top, rgba(19,236,200,.08), transparent 38%), linear-gradient(180deg, rgba(9,21,19,.98), rgba(9,21,19,.92))"
                  : "linear-gradient(180deg, rgba(248,252,251,.98), rgba(255,255,255,.98))",
              }}
            >
              {chatMessages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={message.id}
                    style={{
                      maxWidth: "84%",
                      alignSelf: isUser ? "flex-end" : "flex-start",
                      borderRadius: "18px",
                      padding: "12px 14px",
                      background: isUser
                        ? "linear-gradient(135deg, #13ecc8 0%, #4c9a8d 100%)"
                        : dark
                          ? "rgba(255,255,255,.06)"
                          : "rgba(13,27,25,.05)",
                      color: isUser ? "#0d1b19" : text,
                      border: isUser ? "none" : `1px solid ${dark ? "rgba(255,255,255,.06)" : "rgba(13,27,25,.08)"}`,
                      boxShadow: isUser ? "0 10px 20px rgba(19,236,200,.16)" : "none",
                    }}
                  >
                    <div style={{ fontSize: "13px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{message.text}</div>
                    {message.isError && (
                      <div style={{ marginTop: "8px", fontSize: "11px", color: dark ? "#fca5a5" : "#b91c1c" }}>
                        Lütfen biraz sonra tekrar deneyin.
                      </div>
                    )}
                  </div>
                );
              })}

              {chatLoading && (
                <div style={{
                  maxWidth: "84%",
                  alignSelf: "flex-start",
                  borderRadius: "18px",
                  padding: "12px 14px",
                  background: dark ? "rgba(255,255,255,.06)" : "rgba(13,27,25,.05)",
                  border: `1px solid ${dark ? "rgba(255,255,255,.06)" : "rgba(13,27,25,.08)"}`,
                  color: subText,
                }}>
                  <div style={{ fontSize: "13px" }}>TFBot yazıyor...</div>
                </div>
              )}
            </div>

            <div style={{
              padding: "14px",
              borderTop: `1px solid ${dark ? "rgba(255,255,255,.06)" : "rgba(13,27,25,.08)"}`,
              background: dark ? "rgba(9,21,19,.98)" : "rgba(255,255,255,.98)",
            }}>
              {chatError && (
                <div style={{
                  marginBottom: "10px",
                  fontSize: "12px",
                  color: dark ? "#fca5a5" : "#b91c1c",
                }}>
                  {chatError}
                </div>
              )}
              <form onSubmit={handleChatSubmit} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Sorunuzu yazın..."
                  autoComplete="off"
                  autoFocus
                  style={{
                    flex: 1,
                    height: "48px",
                    borderRadius: "14px",
                    border: `1px solid ${dark ? "rgba(255,255,255,.08)" : "rgba(13,27,25,.12)"}`,
                    background: dark ? "rgba(255,255,255,.04)" : "#fff",
                    color: text,
                    padding: "0 14px",
                    outline: "none",
                    fontSize: "14px",
                  }}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  style={{
                    height: "48px",
                    minWidth: "88px",
                    padding: "0 16px",
                    borderRadius: "14px",
                    border: "none",
                    cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer",
                    background: "#13ecc8",
                    color: "#0d1b19",
                    fontWeight: 800,
                    fontSize: "14px",
                    boxShadow: "0 8px 18px rgba(19,236,200,.22)",
                    opacity: chatLoading || !chatInput.trim() ? 0.65 : 1,
                  }}
                >
                  Gönder
                </button>
              </form>
            </div>
          </div>
        )}

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
            <div style={{ flex: "1 1 260px", display: "flex", justifyContent: "center", position: "relative",paddingRight: "24px" }}>
              <div style={{ position: "absolute", width: "120%", height: "80%", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle,rgba(19,236,200,.15),transparent 70%)", borderRadius: "50%", zIndex: 0 }} />
              <div style={{ position: "relative", zIndex: 1 }}><PhoneMockup /></div>
            </div>
          </section>

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

          <section id="pricing" style={{ padding: "80px 16px", borderTop: `1px solid ${border}`, background: dark ? "rgba(26,54,50,.1)" : "rgba(255,255,255,.5)" }}>
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
                  <button type="button" disabled={isCheckoutLoading} onClick={() => handlePlanSelect(plan)} style={{
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
