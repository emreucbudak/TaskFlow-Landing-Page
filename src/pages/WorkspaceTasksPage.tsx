import { useNavigate } from "react-router-dom";

const bottomTabs = ["Ana Sayfa", "Görevler", "Sohbet", "Menü"];

export default function WorkspaceTasksPage() {
  const navigate = useNavigate();
  const activeTab = "Görevler";
  const currentDateLabel = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
    .format(new Date())
    .replace(/^./, (char) => char.toLocaleUpperCase("tr-TR"));

  const handleTabClick = (tab: string) => {
    if (tab === "Ana Sayfa") {
      navigate("/workspace");
      return;
    }
    if (tab === "Görevler") {
      navigate("/workspace/tasks");
      return;
    }
    if (tab === "Sohbet") {
      navigate("/workspace/chat");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F3F4F6",
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "0 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          minHeight: "100vh",
          background: "#F3F4F6",
          borderRadius: 24,
          boxShadow: "0 4px 40px rgba(0,0,0,0.10)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <div style={{ background: "#fff", padding: "20px 32px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 12, color: "#9CA3AF" }}>{currentDateLabel}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>Hoş geldin, Alex</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ position: "relative", cursor: "pointer" }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, background: "#EF4444", borderRadius: "50%", border: "1.5px solid #fff" }} />
              </div>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#4F46E5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                AX
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 13, color: "#9CA3AF" }}>Görevlerde ve departmanlarda ara...</span>
          </div>
        </div>

        <div style={{ flex: 1, padding: "24px 32px", display: "flex", flexDirection: "column", gap: 28 }}>
          <section>
            <div style={{ fontWeight: 700, fontSize: 24, color: "#111827", marginBottom: 12 }}>Görevler</div>
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", padding: 20 }}>
              <p style={{ margin: 0, color: "#6B7280", lineHeight: 1.6 }}>
                Buraya görev listesi, filtreler ve durum kartları eklenebilir.
              </p>
            </div>
          </section>
        </div>

        <div
          style={{
            background: "#fff",
            borderTop: "1px solid #F1F1F1",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            padding: "12px 0 16px",
            position: "sticky",
            bottom: 0,
          }}
        >
          {bottomTabs.slice(0, 2).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: activeTab === tab ? "#3B5BDB" : "#9CA3AF",
                padding: "0 24px",
              }}
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                {tab === "Ana Sayfa" && <><path d="M3 12L12 3l9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>}
                {tab === "Görevler" && <><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" /><path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>}
              </svg>
              <span style={{ fontSize: 10, fontWeight: activeTab === tab ? 700 : 500 }}>{tab}</span>
            </button>
          ))}

          <button
            style={{ width: 50, height: 50, borderRadius: "50%", background: "#3B5BDB", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 16px rgba(59,91,219,0.45)" }}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>

          {bottomTabs.slice(2).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: activeTab === tab ? "#3B5BDB" : "#9CA3AF",
                padding: "0 24px",
              }}
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                {tab === "Sohbet" && <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                {tab === "Menü" && <><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" /><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" /><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" /><rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" /></>}
              </svg>
              <span style={{ fontSize: 10, fontWeight: activeTab === tab ? 700 : 500 }}>{tab}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
