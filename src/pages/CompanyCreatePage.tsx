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
    envBaseUrl,
    "http://localhost:5172",
    "https://localhost:7243",
    "http://localhost:8080",
    "https://localhost:8081",
  ]
    .map((url) => normalizeBaseUrl(url))
    .filter((url, index, arr) => Boolean(url) && arr.indexOf(url) === index);
};

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

    for (const apiBaseUrl of getApiBaseUrlCandidates()) {
      try {
        const createResponse = await fetch(
          `${apiBaseUrl}/api/Identity/CreateCompanyCommandRequest`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companyName: companyName.trim() }),
          }
        );

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

        const registerResponse = await fetch(
          `${apiBaseUrl}/api/Identity/RegisterCommandRequest`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: adminName.trim(),
              email: adminEmail.trim(),
              password,
              companyId: createdCompanyId,
              role: "Company",
            }),
          }
        );

        const registerRaw = await registerResponse.text();
        const registerPayload = parsePayload<ApiErrorPayload>(registerRaw);

        if (!registerResponse.ok) {
          const registerError = extractApiError(
            registerPayload,
            registerRaw,
            "Yönetici hesabı oluşturulamadı."
          );
          setErrorMessage(
            `Şirket oluşturuldu fakat yönetici oluşturulamadı: ${registerError}`
          );
          setIsLoading(false);
          return;
        }

        setSuccessMessage(
          "Şirket ve yönetici başarıyla oluşturuldu. Giriş sayfasına yönlendiriliyorsunuz."
        );
        setTimeout(() => { window.location.href = "/"; }, 1200);
        return;
      } catch (error) {
        if (error instanceof Error && error.message) {
          lastError = `Bağlantı hatası: ${error.message}`;
        }
        continue;
      }
    }

    setErrorMessage(lastError);
    setIsLoading(false);
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .card-wrap { animation: fadeUp .4s ease forwards; }

        .field input {
          display: block;
          width: 100%;
          height: 44px;
          padding: 0 14px;
          font-size: 14px;
          font-family: 'Geist', sans-serif;
          color: #0f1710;
          background: #fff;
          border: 1.5px solid #e2e8e6;
          border-radius: 10px;
          outline: none;
          transition: border-color .18s, box-shadow .18s;
          box-sizing: border-box;
        }
        .field input::placeholder { color: #b0bdb9; }
        .field input:focus {
          border-color: #1a9e87;
          box-shadow: 0 0 0 3px rgba(26,158,135,.1);
        }

        .field label {
          display: block;
          font-size: 12.5px;
          font-weight: 500;
          color: #5a706b;
          margin-bottom: 6px;
          letter-spacing: .01em;
        }

        .submit-btn {
          width: 100%;
          height: 46px;
          border: none;
          border-radius: 10px;
          font-size: 14.5px;
          font-weight: 600;
          font-family: 'Geist', sans-serif;
          cursor: pointer;
          background: #0f1710;
          color: #fff;
          letter-spacing: .01em;
          transition: background .18s, transform .12s, box-shadow .18s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .submit-btn:hover:not(:disabled) {
          background: #1a2e1f;
          box-shadow: 0 4px 18px rgba(15,23,16,.18);
          transform: translateY(-1px);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled {
          background: #e5eae8;
          color: #a0b0ac;
          cursor: not-allowed;
        }
        .spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .65s linear infinite;
          flex-shrink: 0;
        }
        .spinner.dark {
          border-color: rgba(0,0,0,.12);
          border-top-color: #a0b0ac;
        }
      `}</style>

      <div style={pageStyle}>
        <div style={cardStyle} className="card-wrap">

          {/* Heading */}
          <div style={{ marginBottom: "28px" }}>
            <h1 style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#0f1710",
              letterSpacing: "-.03em",
              marginBottom: "6px",
              lineHeight: 1.2,
            }}>
              Şirketini oluştur
            </h1>
            <p style={{ fontSize: "14px", color: "#7a9490", lineHeight: 1.55, margin: 0 }}>
              Birkaç adımda şirketini ve yönetici hesabını kur.
            </p>
          </div>

          {/* Ödeme uyarısı */}
          {!isPaymentSuccess && (
            <div style={{
              display: "flex",
              gap: "10px",
              background: "#fffbeb",
              border: "1.5px solid #fde68a",
              borderRadius: "10px",
              padding: "12px 14px",
              marginBottom: "24px",
            }}>
              <svg style={{ flexShrink: 0, marginTop: "1px" }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5L14.5 13H1.5L8 1.5Z" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M8 6v3.5" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="11.5" r=".75" fill="#d97706" />
              </svg>
              <p style={{ fontSize: "13px", color: "#92400e", margin: 0, lineHeight: 1.5 }}>
                Bu sayfa normalde ödeme başarısından sonra açılır.
              </p>
            </div>
          )}

          {/* Bölüm: Şirket */}
          <p style={sectionLabel}>Şirket Bilgileri</p>
          <div style={{ display: "grid", gap: "14px", marginBottom: "24px" }}>
            <div className="field">
              <label htmlFor="companyName">Şirket adı</label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Örnek: TaskFlow Labs"
              />
            </div>
          </div>

          {/* Bölüm: Yönetici */}
          <p style={sectionLabel}>Yönetici Bilgileri</p>
          <div style={{ display: "grid", gap: "14px", marginBottom: "28px" }}>
            <div className="field">
              <label htmlFor="adminName">Ad soyad</label>
              <input
                id="adminName"
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Örnek: Emre Uçbudak"
              />
            </div>
            <div className="field">
              <label htmlFor="adminEmail">E-posta</label>
              <input
                id="adminEmail"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="ornek@mail.com"
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="field">
                <label htmlFor="password">Şifre</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="field">
                <label htmlFor="confirmPassword">Şifre tekrar</label>
                <input
                  id="confirmPassword"
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
            className="submit-btn"
            onClick={() => void handleCreate()}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner dark" />
                Oluşturuluyor...
              </>
            ) : (
              "Hesabı Oluştur"
            )}
          </button>

          {/* Hata */}
          {errorMessage && (
            <div style={{
              display: "flex",
              gap: "10px",
              background: "#fef2f2",
              border: "1.5px solid #fecaca",
              borderRadius: "10px",
              padding: "12px 14px",
              marginTop: "16px",
            }}>
              <svg style={{ flexShrink: 0, marginTop: "1px" }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="#ef4444" strokeWidth="1.5" />
                <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p style={{ fontSize: "13px", color: "#b91c1c", margin: 0, lineHeight: 1.55 }}>
                {errorMessage}
              </p>
            </div>
          )}

          {/* Başarı */}
          {successMessage && (
            <div style={{
              display: "flex",
              gap: "10px",
              background: "#f0fdf4",
              border: "1.5px solid #bbf7d0",
              borderRadius: "10px",
              padding: "12px 14px",
              marginTop: "16px",
            }}>
              <svg style={{ flexShrink: 0, marginTop: "1px" }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="#22c55e" strokeWidth="1.5" />
                <path d="M5 8l2.5 2.5L11 5.5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p style={{ fontSize: "13px", color: "#15803d", margin: 0, lineHeight: 1.55 }}>
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
  background: "#f5f7f6",
  fontFamily: "'Geist', sans-serif",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "480px",
  background: "#ffffff",
  borderRadius: "16px",
  border: "1.5px solid #e8eeed",
  boxShadow: "0 4px 24px rgba(15,23,16,.06), 0 1px 2px rgba(15,23,16,.04)",
  padding: "36px",
};

const sectionLabel: CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#a0b5b0",
  letterSpacing: ".08em",
  textTransform: "uppercase",
  margin: "0 0 12px",
};
