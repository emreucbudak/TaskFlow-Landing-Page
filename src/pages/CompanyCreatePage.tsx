import { useMemo, useState, type CSSProperties } from "react";

type ApiErrorPayload = {
  message?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

type CreateCompanyResponse = {
  companyId?: string;
  CompanyId?: string;
  companyName?: string;
  CompanyName?: string;
  message?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

const guidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const readQuery = () => {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  return { payment: params.get("payment") ?? "" };
};

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, "");

const getApiBaseUrlCandidates = (): string[] => {
  const envBaseUrl =
    (import.meta.env.VITE_TASKFLOW_API_URL as string | undefined)?.trim() ?? "";
  return [
    "",
    envBaseUrl,
    "http://localhost:8080",
    "http://localhost:5172",
    "https://localhost:7243",
    "https://localhost:8081",
  ]
    .map((url) => normalizeBaseUrl(url))
    .filter((url, index, arr) => arr.indexOf(url) === index);
};

const buildApiUrl = (baseUrl: string, endpointPath: string) =>
  baseUrl ? `${baseUrl}${endpointPath}` : endpointPath;

const parsePayload = <T extends object>(raw: string): T => {
  try {
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
};

const extractApiError = (
  payload: ApiErrorPayload,
  raw: string,
  fallback: string
): string => {
  const validationError = payload.errors
    ? Object.values(payload.errors).flat().find(Boolean)
    : "";
  return (
    validationError ||
    payload.message ||
    payload.detail ||
    (raw.trim() ? raw : fallback)
  );
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

export default function CompanyCreatePage() {
  const { payment } = useMemo(() => readQuery(), []);
  const [dark, setDark] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isPaymentSuccess = payment === "success";

  const handleCreate = async () => {
    if (isLoading) return;
    if (!companyName.trim()) { setErrorMessage("Şirket ismi boş olamaz."); return; }
    if (!adminName.trim() || !adminEmail.trim() || !password) { setErrorMessage("Yönetici bilgilerini eksiksiz doldur."); return; }
    if (password !== confirmPassword) { setErrorMessage("Şifreler aynı değil."); return; }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    let lastError = "Şirket oluşturulamadı.";
    let hasAnyNetworkError = false;
    const createCompanyPath = "/api/Identity/CreateCompanyCommandRequest";
    const registerPath = "/api/Identity/RegisterCommandRequest";

    for (const apiBaseUrl of getApiBaseUrlCandidates()) {
      try {
        const createCompanyUrl = buildApiUrl(apiBaseUrl, createCompanyPath);
        const createResponse = await fetch(createCompanyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyName: companyName.trim() }),
        });

        const createRaw = await createResponse.text();
        const createPayload = parsePayload<CreateCompanyResponse>(createRaw);

        if (!createResponse.ok) {
          lastError = extractApiError(createPayload, createRaw, lastError);
          continue;
        }

        const createdCompanyId = createPayload.companyId ?? createPayload.CompanyId ?? "";
        if (!guidRegex.test(createdCompanyId)) {
          lastError = "Şirket oluşturuldu fakat companyId dönmedi.";
          continue;
        }

        const registerUrl = buildApiUrl(apiBaseUrl, registerPath);
        const registerResponse = await fetch(registerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: adminName.trim(),
            email: adminEmail.trim(),
            password,
            companyId: createdCompanyId,
            role: "Company",
          }),
        });

        const registerRaw = await registerResponse.text();
        const registerPayload = parsePayload<ApiErrorPayload>(registerRaw);

        if (!registerResponse.ok) {
          const registerError = extractApiError(registerPayload, registerRaw, "Yönetici hesabı oluşturulamadı.");
          setErrorMessage(`Şirket oluşturuldu fakat yönetici oluşturulamadı: ${registerError}`);
          setIsLoading(false);
          return;
        }

        setSuccessMessage("Şirket ve yönetici başarıyla oluşturuldu. Giriş sayfasına yönlendiriliyorsunuz.");
        setTimeout(() => { window.location.href = "/"; }, 1200);
        return;
      } catch (error) {
        hasAnyNetworkError = true;
        if (error instanceof Error && error.message) {
          lastError = `Bağlantı hatası: ${error.message}`;
        } else {
          lastError = "Bağlantı hatası: API'ye erişilemedi.";
        }
        continue;
      }
    }

    if (hasAnyNetworkError && /failed to fetch/i.test(lastError)) {
      setErrorMessage("Bağlantı hatası: API'ye ulaşılamadı. TaskFlowAPI servisini çalıştırıp VITE_TASKFLOW_API_URL değerini kontrol et.");
      setIsLoading(false);
      return;
    }

    setErrorMessage(lastError);
    setIsLoading(false);
  };

  // ─── Tema değerleri ───────────────────────────────────────────────────────
  const bg = dark ? "#0a0f0e" : "#f0faf8";
  const cardBg = dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.85)";
  const cardBorder = dark ? "rgba(19,236,200,0.15)" : "rgba(19,236,200,0.3)";
  const cardShadow = dark
    ? "0 0 80px rgba(19,236,200,0.06), inset 0 1px 0 rgba(255,255,255,0.06)"
    : "0 0 80px rgba(19,236,200,0.1), 0 8px 32px rgba(13,27,25,0.08)";
  const headingColor = dark ? "#e8f6f2" : "#0d1b19";
  const logoTextColor = dark ? "#e8f6f2" : "#0d1b19";
  const inputColor = dark ? "#e8f6f2" : "#0d1b19";
  const inputBg = dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)";
  const inputBorder = dark ? "rgba(255,255,255,0.1)" : "rgba(19,236,200,0.25)";
  const inputFocusClass = dark ? "tf-input-dark" : "tf-input-light";
  const labelColor = dark ? "rgba(255,255,255,0.35)" : "rgba(13,27,25,0.45)";
  const sectionLabelColor = dark ? "rgba(19,236,200,0.5)" : "rgba(13,140,110,0.7)";
  const sectionLabelLineColor = dark ? "rgba(19,236,200,0.12)" : "rgba(19,236,200,0.2)";

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
    maxWidth: "480px",
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
    display: "block",
    width: "100%",
    height: "52px",
    padding: "0 16px",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    color: inputColor,
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    borderRadius: "12px",
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
    boxSizing: "border-box",
    letterSpacing: "0.01em",
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

        .tf-input-dark::placeholder { color: rgba(255,255,255,0.25); }
        .tf-input-dark:focus {
          border-color: rgba(19,236,200,0.55) !important;
          background: rgba(19,236,200,0.04) !important;
        }
        .tf-input-light::placeholder { color: rgba(13,27,25,0.3); }
        .tf-input-light:focus {
          border-color: rgba(19,236,200,0.7) !important;
          background: rgba(19,236,200,0.05) !important;
        }

        .tf-btn {
          width: 100%;
          height: 52px;
          border: none;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.03em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .tf-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(19,236,200,0.35);
        }
        .tf-btn:disabled { cursor: not-allowed; }
        .tf-toggle { transition: background 0.2s, color 0.2s; }
        .tf-toggle:hover { opacity: 0.85; }
      `}</style>

      {/* Dark mode toggle */}
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

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "36px" }}>
            <img
              src="https://www.logoai.com/uploads/icon/2021/08/06/732ca933-7df8-43e8-b085-69466243c919.png"
              alt="TaskFlow logo"
              style={{ width: "36px", height: "36px", objectFit: "contain", display: "block", flexShrink: 0 }}
            />
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "16px", color: logoTextColor, letterSpacing: "-0.01em", transition: "color 0.3s" }}>
              TaskFlow
            </span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{
              margin: "0 0 6px",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.5rem, 3vw, 1.9rem)",
              color: headingColor,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              transition: "color 0.3s",
            }}>
              Şirketini oluştur.
            </h1>
          </div>

          {/* Ödeme uyarısı */}
          {!isPaymentSuccess && (
            <div style={{
              display: "flex", gap: "10px",
              background: "rgba(251,191,36,0.07)",
              border: "1px solid rgba(251,191,36,0.2)",
              borderRadius: "12px", padding: "12px 14px", marginBottom: "28px",
            }}>
              <svg style={{ flexShrink: 0, marginTop: "1px" }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5L14.5 13H1.5L8 1.5Z" stroke="#fbbf24" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M8 6v3.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="11.5" r=".75" fill="#fbbf24" />
              </svg>
              <p style={{ fontSize: "13px", color: "rgba(251,191,36,0.8)", margin: 0, lineHeight: 1.5 }}>
                Bu sayfa normalde ödeme başarısından sonra açılır.
              </p>
            </div>
          )}

          {/* Şirket */}
          <p style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
            color: sectionLabelColor, margin: "0 0 14px",
            display: "flex", alignItems: "center", gap: "8px", transition: "color 0.3s",
          }}>
            Şirket Bilgileri
            <span style={{ flex: 1, height: "1px", background: sectionLabelLineColor, display: "block", transition: "background 0.3s" }} />
          </p>
          <div style={{ display: "grid", gap: "14px", marginBottom: "28px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: labelColor, marginBottom: "7px", transition: "color 0.3s" }}>
                Şirket adı
              </label>
              <input className={inputFocusClass} type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Örnek: TaskFlow Labs" style={inputStyle} />
            </div>
          </div>

          {/* Yönetici */}
          <p style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
            color: sectionLabelColor, margin: "0 0 14px",
            display: "flex", alignItems: "center", gap: "8px", transition: "color 0.3s",
          }}>
            Yönetici Bilgileri
            <span style={{ flex: 1, height: "1px", background: sectionLabelLineColor, display: "block", transition: "background 0.3s" }} />
          </p>
          <div style={{ display: "grid", gap: "14px", marginBottom: "32px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: labelColor, marginBottom: "7px", transition: "color 0.3s" }}>
                Ad soyad
              </label>
              <input className={inputFocusClass} type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Örnek: Emre Uçbudak" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: labelColor, marginBottom: "7px", transition: "color 0.3s" }}>
                E-posta
              </label>
              <input className={inputFocusClass} type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="ornek@mail.com" style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: labelColor, marginBottom: "7px", transition: "color 0.3s" }}>
                  Şifre
                </label>
                <input className={inputFocusClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: labelColor, marginBottom: "7px", transition: "color 0.3s" }}>
                  Şifre tekrar
                </label>
                <input className={inputFocusClass} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Buton */}
          <button
            type="button"
            className="tf-btn"
            onClick={() => void handleCreate()}
            disabled={isLoading}
            style={{
              background: isLoading
                ? dark ? "rgba(255,255,255,0.06)" : "rgba(13,27,25,0.08)"
                : "linear-gradient(135deg, #13ecc8 0%, #0ab89f 100%)",
              color: isLoading
                ? dark ? "rgba(255,255,255,0.3)" : "rgba(13,27,25,0.3)"
                : "#0a0f0e",
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
                Oluşturuluyor…
              </>
            ) : (
              "Hesabı Oluştur →"
            )}
          </button>

          {/* Hata */}
          {errorMessage && (
            <div style={{
              display: "flex", gap: "10px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "12px", padding: "12px 14px", marginTop: "16px",
            }}>
              <svg style={{ flexShrink: 0, marginTop: "1px" }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="#ef4444" strokeWidth="1.5" />
                <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0, lineHeight: 1.55 }}>{errorMessage}</p>
            </div>
          )}

          {/* Başarı */}
          {successMessage && (
            <div style={{
              display: "flex", gap: "10px",
              background: "rgba(19,236,200,0.08)",
              border: "1px solid rgba(19,236,200,0.2)",
              borderRadius: "12px", padding: "12px 14px", marginTop: "16px",
            }}>
              <svg style={{ flexShrink: 0, marginTop: "1px" }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="#13ecc8" strokeWidth="1.5" />
                <path d="M5 8l2.5 2.5L11 5.5" stroke="#13ecc8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p style={{ fontSize: "13px", color: "#13ecc8", margin: 0, lineHeight: 1.55 }}>{successMessage}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}