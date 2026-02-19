import { useMemo, useState, type CSSProperties } from "react";

type RegisterResponse = {
  message?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const readQuery = () => {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  return {
    companyId: params.get("companyId") ?? "",
    companyName: params.get("companyName") ?? "",
    plan: params.get("plan") ?? "",
  };
};

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, "");

const getApiBaseUrlCandidates = (): string[] => {
  const envBaseUrl = (import.meta.env.VITE_TASKFLOW_API_URL as string | undefined)?.trim() ?? "";
  return [envBaseUrl, "http://localhost:5172", "https://localhost:7243", "http://localhost:8080", "https://localhost:8081"]
    .map((url) => normalizeBaseUrl(url))
    .filter((url, index, arr) => Boolean(url) && arr.indexOf(url) === index);
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
  maxWidth: "560px",
  background: "#ffffff",
  borderRadius: "20px",
  border: "1px solid rgba(76,154,141,.2)",
  boxShadow: "0 20px 48px rgba(13,27,25,.08)",
  padding: "28px",
};

export default function RegisterPage() {
  const { companyId, companyName, plan } = useMemo(() => readQuery(), []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isCompanyIdValid = guidRegex.test(companyId);

  const handleRegister = async () => {
    if (isLoading) return;

    if (!isCompanyIdValid) {
      setErrorMessage("Company ID gecersiz. Sirket olusturma adimini tekrar tamamla.");
      return;
    }
    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage("Tum alanlari doldur.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Sifreler ayni degil.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    let lastError = "RegisterCommandRequest calistirilamadi.";

    for (const apiBaseUrl of getApiBaseUrlCandidates()) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/Identity/RegisterCommandRequest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
            companyId,
            role: "Company",
          }),
        });

        let payload: RegisterResponse = {};
        try {
          payload = (await response.json()) as RegisterResponse;
        } catch {
          payload = {};
        }

        if (!response.ok) {
          const firstError = payload.errors ? Object.values(payload.errors).flat()[0] : "";
          lastError = firstError || payload.message || payload.detail || lastError;
          continue;
        }

        setSuccessMessage("Company rolu ile kayit basarili. Giris ekranina yonlendiriliyorsun.");
        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
        return;
      } catch {
        continue;
      }
    }

    setErrorMessage(lastError);
    setIsLoading(false);
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <div style={pageStyle}>
        <div style={cardStyle}>
          <p style={{ margin: 0, color: "#4c9a8d", fontWeight: 700, fontSize: "13px", letterSpacing: ".08em" }}>
            FEATURES / AUTH / REGISTER
          </p>
          <h1 style={{ margin: "10px 0 8px", color: "#0d1b19", fontSize: "clamp(1.5rem,3vw,2rem)", lineHeight: 1.2 }}>
            Register (Company)
          </h1>
          <p style={{ margin: 0, color: "rgba(13,27,25,.65)" }}>
            RegisterCommandRequest role alanina otomatik olarak <strong>Company</strong> gonderilir.
          </p>

          <div style={{ marginTop: "16px", padding: "10px 12px", borderRadius: "10px", background: "#f6fbfa", border: "1px solid rgba(76,154,141,.2)", fontSize: "13px" }}>
            <div><strong>Company:</strong> {companyName || "-"}</div>
            <div><strong>CompanyId:</strong> {companyId || "-"}</div>
            <div><strong>Plan:</strong> {plan || "-"}</div>
          </div>

          <div style={{ marginTop: "20px", display: "grid", gap: "10px" }}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ad Soyad"
              style={inputStyle}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta"
              style={inputStyle}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sifre"
              style={inputStyle}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Sifre Tekrar"
              style={inputStyle}
            />
          </div>

          <div style={{ marginTop: "20px", display: "grid", gap: "10px" }}>
            <button
              type="button"
              onClick={handleRegister}
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
              {isLoading ? "Kayit Olusturuluyor..." : "RegisterCommandRequest Calistir"}
            </button>
          </div>

          {errorMessage && (
            <p style={{ margin: "16px 0 0", fontSize: "13px", color: "#b91c1c" }}>
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p style={{ margin: "16px 0 0", fontSize: "13px", color: "#065f46" }}>
              {successMessage}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

const inputStyle: CSSProperties = {
  height: "44px",
  borderRadius: "10px",
  border: "1px solid rgba(76,154,141,.35)",
  padding: "0 12px",
  fontSize: "14px",
  outline: "none",
};
