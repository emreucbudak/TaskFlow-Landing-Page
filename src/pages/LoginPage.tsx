import { useState, type CSSProperties } from "react";

type LoginResponse = {
  accessToken?: string;
  refreshToken?: string;
  AccessToken?: string;
  RefreshToken?: string;
  message?: string;
  detail?: string;
  errors?: Record<string, string[]>;
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
  background: "#0a0f0e",
  fontFamily: "'DM Sans', sans-serif",
  position: "relative",
  overflow: "hidden",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "440px",
  background: "rgba(255,255,255,0.03)",
  borderRadius: "24px",
  border: "1px solid rgba(19,236,200,0.15)",
  boxShadow: "0 0 80px rgba(19,236,200,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
  padding: "48px 40px 44px",
  position: "relative",
  zIndex: 1,
};

const inputStyle: CSSProperties = {
  height: "52px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.1)",
  padding: "0 16px",
  fontSize: "14px",
  outline: "none",
  background: "rgba(255,255,255,0.04)",
  color: "#e8f6f2",
  width: "100%",
  boxSizing: "border-box",
  letterSpacing: "0.01em",
  transition: "border-color 0.2s, background 0.2s",
};

const getToken = (payload: LoginResponse, type: "access" | "refresh") =>
  type === "access"
    ? payload.accessToken ?? payload.AccessToken ?? ""
    : payload.refreshToken ?? payload.RefreshToken ?? "";

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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLogin = async () => {
    if (isLoading) return;

    if (!email.trim() || !password) {
      setErrorMessage("E-posta ve sifre zorunlu.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    let lastError = "LoginCommandRequest calistirilamadi.";

    for (const apiBaseUrl of getApiBaseUrlCandidates()) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/Identity/LoginCommandRequest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });

        let payload: LoginResponse = {};
        try {
          payload = (await response.json()) as LoginResponse;
        } catch {
          payload = {};
        }

        if (!response.ok) {
          const firstError = payload.errors ? Object.values(payload.errors).flat()[0] : "";
          lastError = firstError || payload.message || payload.detail || lastError;
          continue;
        }

        const accessToken = getToken(payload, "access");
        const refreshToken = getToken(payload, "refresh");

        if (!accessToken || !refreshToken) {
          lastError = "Login basarili gorundu ancak token bilgisi donmedi.";
          continue;
        }

        window.localStorage.setItem("taskflow_access_token", accessToken);
        window.localStorage.setItem("taskflow_refresh_token", refreshToken);
        setSuccessMessage("Giris basarili. Ana sayfaya yonlendiriliyorsun.");
        setTimeout(() => { window.location.href = "/"; }, 900);
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
        .tf-input:focus {
          border-color: rgba(19,236,200,0.55) !important;
          background: rgba(19,236,200,0.04) !important;
        }
        .tf-input::placeholder { color: rgba(255,255,255,0.25); }
        .tf-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(19,236,200,0.35);
        }
        .tf-btn { transition: transform 0.15s, box-shadow 0.15s; }
        .tf-label { display: block; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 7px; }
      `}</style>

      <div style={pageStyle}>
        <Blobs />

        <div className="tf-card" style={cardStyle}>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "36px" }}>
            <img
              src="https://www.logoai.com/uploads/icon/2021/08/06/732ca933-7df8-43e8-b085-69466243c919.png"
              alt="TaskFlow logo"
              style={{ width: "36px", height: "36px", objectFit: "contain", display: "block" }}
            />
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "16px", color: "#e8f6f2", letterSpacing: "-0.01em" }}>
              TaskFlow
            </span>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <h1 style={{
              margin: "0 0 6px",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.6rem, 3vw, 2rem)",
              color: "#e8f6f2",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}>
              Hoş geldin.
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
              Devam etmek için hesabına giriş yap.
            </p>
          </div>

          <form
            style={{ display: "grid", gap: "16px" }}
            onSubmit={(event) => {
              event.preventDefault();
              void handleLogin();
            }}
          >
            <div>
              <label className="tf-label">E-posta</label>
              <input
                className="tf-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@sirket.com"
                style={inputStyle}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="tf-label">Şifre</label>
              <input
                className="tf-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                autoComplete="current-password"
              />
            </div>

            <button
              className="tf-btn"
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: "8px",
                height: "52px",
                borderRadius: "12px",
                border: "none",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                letterSpacing: "0.03em",
                cursor: isLoading ? "not-allowed" : "pointer",
                background: isLoading
                  ? "rgba(255,255,255,0.06)"
                  : "linear-gradient(135deg, #13ecc8 0%, #0ab89f 100%)",
                color: isLoading ? "rgba(255,255,255,0.3)" : "#0a0f0e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
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
                  Giriş Yapılıyor…
                </>
              ) : (
                "Giriş Yap →"
              )}
            </button>
          </form>

          {errorMessage && (
            <div style={{
              marginTop: "20px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              fontSize: "13px",
              color: "#fca5a5",
              lineHeight: 1.5,
            }}>
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div style={{
              marginTop: "20px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(19,236,200,0.08)",
              border: "1px solid rgba(19,236,200,0.2)",
              fontSize: "13px",
              color: "#13ecc8",
              lineHeight: 1.5,
            }}>
              {successMessage}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
