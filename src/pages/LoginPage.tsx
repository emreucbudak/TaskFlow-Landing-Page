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
  background: "linear-gradient(120deg, #f8fcfb 0%, #eef8f5 45%, #e8f6f2 100%)",
  fontFamily: "'Inter',sans-serif",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "520px",
  background: "#ffffff",
  borderRadius: "20px",
  border: "1px solid rgba(76,154,141,.2)",
  boxShadow: "0 20px 48px rgba(13,27,25,.08)",
  padding: "28px",
};

const inputStyle: CSSProperties = {
  height: "44px",
  borderRadius: "10px",
  border: "1px solid rgba(76,154,141,.35)",
  padding: "0 12px",
  fontSize: "14px",
  outline: "none",
};

const getToken = (payload: LoginResponse, type: "access" | "refresh") =>
  type === "access"
    ? payload.accessToken ?? payload.AccessToken ?? ""
    : payload.refreshToken ?? payload.RefreshToken ?? "";

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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
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
        setTimeout(() => {
          window.location.href = "/";
        }, 900);
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
            FEATURES / AUTH / LOGIN
          </p>
          <h1 style={{ margin: "10px 0 8px", color: "#0d1b19", fontSize: "clamp(1.5rem,3vw,2rem)", lineHeight: 1.2 }}>
            Giris Yap
          </h1>
          <p style={{ margin: 0, color: "rgba(13,27,25,.65)" }}>
            Bilgilerini gir. Istek <strong>/api/Identity/LoginCommandRequest</strong> endpointine gonderilir.
          </p>

          <form
            style={{ marginTop: "20px", display: "grid", gap: "10px" }}
            onSubmit={(event) => {
              event.preventDefault();
              void handleLogin();
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta"
              style={inputStyle}
              autoComplete="email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sifre"
              style={inputStyle}
              autoComplete="current-password"
            />

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: "8px",
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
              {isLoading ? "Giris Yapiliyor..." : "Giris Yap"}
            </button>
          </form>

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
