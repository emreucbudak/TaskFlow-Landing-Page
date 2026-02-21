import { type CSSProperties } from "react";

export default function WorkspacePage() {
  const handleLogout = () => {
    window.localStorage.removeItem("taskflow_access_token");
    window.localStorage.removeItem("taskflow_refresh_token");
    window.location.href = "/auth/login";
  };

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0f0e 0%, #10221f 100%)",
    color: "#e8f6f2",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    fontFamily: "'DM Sans', sans-serif",
  };

  const cardStyle: CSSProperties = {
    width: "100%",
    maxWidth: "680px",
    borderRadius: "20px",
    padding: "36px 32px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(19,236,200,0.2)",
    boxShadow: "0 16px 48px rgba(0,0,0,0.25)",
  };

  const buttonStyle: CSSProperties = {
    marginTop: "18px",
    height: "46px",
    padding: "0 18px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
    background: "linear-gradient(135deg, #13ecc8 0%, #0ab89f 100%)",
    color: "#0a0f0e",
  };

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <h1 style={{ margin: 0, fontSize: "30px", lineHeight: 1.1 }}>
          Workspace
        </h1>
        <p style={{ margin: "12px 0 0", color: "rgba(232,246,242,0.8)", lineHeight: 1.55 }}>
          Bu sayfa sadece giris yapan kullanicilar icin aciktir.
        </p>
        <button type="button" style={buttonStyle} onClick={handleLogout}>
          Cikis Yap
        </button>
      </section>
    </main>
  );
}
