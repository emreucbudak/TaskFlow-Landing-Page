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

const Blobs = () => (
  <>
    <div style={{
      position: "fixed", top: "-180px", right: "-120px",
      width: "520px", height: "520px", borderRadius: "50%",
      background: "radial-gradient(circle, rgba(19,236,200,0.12) 0%, transparent 70%)",
      pointerEvents: "none",
    }} />
    <div style={{
      position: "fixed", bottom: "-200px", left: "-150px",
      width: "600px", height: "600px", borderRadius: "50%",
      background: "radial-gradient(circle, rgba(19,236,200,0.07) 0%, transparent 70%)",
      pointerEvents: "none",
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

        const createdCompanyId =
          createPayload.companyId ?? createPayload.CompanyId ?? "";
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
          const registerError = extractApiError(
            registerPayload,
            registerRaw,
            "Yönetici hesabı oluşturulamadı."
          );
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

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .tf-card { animation: fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) both; }

        .tf-input {
          display: block;
          width: 100%;
          height: 52px;
          padding: 0 16px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #e8f6f2;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
          letter-spacing: 0.01em;
        }
        .tf-input::placeholder { color: rgba(255,255,255,0.25); }
        .tf-input:focus {
          border-color: rgba(19,236,200,0.55);
          background: rgba(19,236,200,0.04);
        }

        .tf-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-bottom: 7px;
        }

        .tf-section-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(19,236,200,0.5);
          margin: 0 0 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tf-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(19,236,200,0.12);
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
      `}</style>

      <div style={pageStyle}>
        <Blobs />

        <div className="tf-card" style={cardStyle}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "36px" }}>
            <img
              src="https://www.logoai.com/uploads/icon/2021/08/06/732ca933-7df8-43e8-b085-69466243c919.png"
              alt="TaskFlow logo"
              style={{ width: "36px", height: "36px", objectFit: "contain", display: "block", flexShrink: 0 }}
            />
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "16px", color: "#e8f6f2", letterSpacing: "-0.01em" }}>
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
              color: "#e8f6f2",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}>
              Şirketini oluştur.
            </h1>
          </div>

          {/* Ödeme uyarısı */}
          {!isPaymentSuccess && (
            <div style={{
              display: "flex",
              gap: "10px",
              background: "rgba(251,191,36,0.07)",
              border: "1px solid rgba(251,191,36,0.2)",
              borderRadius: "12px",
              padding: "12px 14px",
              marginBottom: "28px",
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
          <p className="tf-section-label">Şirket Bilgileri</p>
          <div style={{ display: "grid", gap: "14px", marginBottom: "28px" }}>
            <div>
              <label className="tf-label">Şirket adı</label>
              <input
                className="tf-input"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Örnek: TaskFlow Labs"
              />
            </div>
          </div>

          {/* Yönetici */}
          <p className="tf-section-label">Yönetici Bilgileri</p>
          <div style={{ display: "grid", gap: "14px", marginBottom: "32px" }}>
            <div>
              <label className="tf-label">Ad soyad</label>
              <input
                className="tf-input"
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Örnek: Emre Uçbudak"
              />
            </div>
            <div>
              <label className="tf-label">E-posta</label>
              <input
                className="tf-input"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="ornek@mail.com"
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label className="tf-label">Şifre</label>
                <input
                  className="tf-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="tf-label">Şifre tekrar</label>
                <input
                  className="tf-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
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
                ? "rgba(255,255,255,0.06)"
                : "linear-gradient(135deg, #13ecc8 0%, #0ab89f 100%)",
              color: isLoading ? "rgba(255,255,255,0.3)" : "#0a0f0e",
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
              display: "flex",
              gap: "10px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "12px",
              padding: "12px 14px",
              marginTop: "16px",
            }}>
              <svg style={{ flexShrink: 0, marginTop: "1px" }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="#ef4444" strokeWidth="1.5" />
                <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0, lineHeight: 1.55 }}>
                {errorMessage}
              </p>
            </div>
          )}

          {/* Başarı */}
          {successMessage && (
            <div style={{
              display: "flex",
              gap: "10px",
              background: "rgba(19,236,200,0.08)",
              border: "1px solid rgba(19,236,200,0.2)",
              borderRadius: "12px",
              padding: "12px 14px",
              marginTop: "16px",
            }}>
              <svg style={{ flexShrink: 0, marginTop: "1px" }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="#13ecc8" strokeWidth="1.5" />
                <path d="M5 8l2.5 2.5L11 5.5" stroke="#13ecc8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p style={{ fontSize: "13px", color: "#13ecc8", margin: 0, lineHeight: 1.55 }}>
                {successMessage}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: "24px",
  background: "#0a0f0e",
  fontFamily: "'DM Sans', sans-serif",
  position: "relative",
  overflow: "hidden",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "480px",
  background: "rgba(255,255,255,0.03)",
  borderRadius: "24px",
  border: "1px solid rgba(19,236,200,0.15)",
  boxShadow: "0 0 80px rgba(19,236,200,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
  padding: "48px 40px 44px",
  position: "relative",
  zIndex: 1,
};