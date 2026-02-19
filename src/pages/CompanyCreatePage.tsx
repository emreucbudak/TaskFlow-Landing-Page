import { useMemo, useState, type CSSProperties } from "react";

type CreateCompanyResponse = {
  companyId?: string;
  CompanyId?: string;
  message?: string;
  detail?: string;
};

const readQuery = () => {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  return {
    payment: params.get("payment") ?? "",
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

export default function CompanyCreatePage() {
  const { payment, plan } = useMemo(() => readQuery(), []);
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isPaymentSuccess = payment === "success";

  const handleCreateCompany = async () => {
    if (isLoading) return;
    if (!companyName.trim()) {
      setErrorMessage("Sirket ismi bos olamaz.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    let lastError = "Sirket olusturulamadi.";

    for (const apiBaseUrl of getApiBaseUrlCandidates()) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/Identity/CreateCompanyCommandRequest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            companyName: companyName.trim(),
          }),
        });

        const payload = (await response.json()) as CreateCompanyResponse;
        if (!response.ok) {
          lastError = payload.message ?? payload.detail ?? lastError;
          continue;
        }

        const createdCompanyId = payload.companyId ?? payload.CompanyId;
        if (!createdCompanyId) {
          lastError = "Sirket olusturuldu fakat companyId donmedi.";
          continue;
        }

        const params = new URLSearchParams();
        params.set("companyId", createdCompanyId);
        params.set("companyName", companyName.trim());
        if (plan) {
          params.set("plan", plan);
        }

        window.location.href = `/auth/register?${params.toString()}`;
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
          <p style={{ margin: 0, color: "#4c9a8d", fontWeight: 700, fontSize: "13px", letterSpacing: ".08em" }}>PAYMENT FLOW</p>
          <h1 style={{ margin: "10px 0 8px", color: "#0d1b19", fontSize: "clamp(1.5rem,3vw,2rem)", lineHeight: 1.2 }}>
            Sirket Olustur
          </h1>
          <p style={{ margin: 0, color: "rgba(13,27,25,.65)" }}>
            Odemeden sonra ilk adim olarak sirket adini olusturuyoruz.
          </p>

          {!isPaymentSuccess && (
            <p style={{ margin: "14px 0 0", color: "#b45309", fontSize: "13px" }}>
              Bu sayfa normalde odeme basarisindan sonra acilir.
            </p>
          )}

          <div style={{ marginTop: "22px", display: "grid", gap: "10px" }}>
            <label htmlFor="companyName" style={{ fontSize: "13px", fontWeight: 700, color: "#0d1b19" }}>
              Sirket Ismi
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ornek: TaskFlow Labs"
              style={{
                height: "44px",
                borderRadius: "10px",
                border: "1px solid rgba(76,154,141,.35)",
                padding: "0 12px",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginTop: "20px", display: "grid", gap: "10px" }}>
            <button
              type="button"
              onClick={handleCreateCompany}
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
              {isLoading ? "Olusturuluyor..." : "CreateCompanyCommandRequest Calistir"}
            </button>
          </div>

          {errorMessage && (
            <p style={{ margin: "16px 0 0", fontSize: "13px", color: "#b91c1c" }}>
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
